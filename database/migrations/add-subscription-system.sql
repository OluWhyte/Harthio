-- ============================================================================
-- SUBSCRIPTION & PAYMENT SYSTEM
-- ============================================================================
-- Complete subscription management and payment tracking
-- Safe to run multiple times (idempotent)

-- ============================================================================
-- 1. UPDATE USERS TABLE
-- ============================================================================

-- Add payment gateway fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT CHECK (payment_gateway IN ('paddle', 'stripe', 'lemonsqueezy', 'paypal', 'razorpay'));

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS payment_customer_id TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS will_renew BOOLEAN DEFAULT true;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_payment_customer ON public.users(payment_customer_id);

-- ============================================================================
-- 2. CREATE SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription details
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- Payment gateway
  payment_gateway TEXT NOT NULL CHECK (payment_gateway IN ('paddle', 'stripe', 'lemonsqueezy', 'paypal', 'razorpay')),
  gateway_subscription_id TEXT NOT NULL,
  gateway_customer_id TEXT NOT NULL,
  
  -- Pricing
  amount_usd DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(gateway_subscription_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.is_active = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_id ON public.subscriptions(gateway_subscription_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- 3. CREATE PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  -- Payment details
  amount_usd DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'refunded', 'pending', 'cancelled')),
  
  -- Gateway info
  payment_gateway TEXT NOT NULL CHECK (payment_gateway IN ('paddle', 'stripe', 'lemonsqueezy', 'paypal', 'razorpay')),
  gateway_payment_id TEXT NOT NULL UNIQUE,
  gateway_customer_id TEXT,
  
  -- Metadata
  payment_method TEXT, -- 'card', 'paypal', etc.
  description TEXT,
  receipt_url TEXT,
  failure_reason TEXT,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.is_active = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_id ON public.payments(gateway_payment_id);

-- ============================================================================
-- 4. FINANCE ANALYTICS VIEWS
-- ============================================================================

-- Monthly Recurring Revenue (MRR)
CREATE OR REPLACE VIEW public.finance_mrr AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as subscription_count,
  SUM(CASE WHEN plan = 'monthly' THEN amount_usd ELSE amount_usd / 12 END) as mrr,
  SUM(amount_usd) as total_revenue
FROM public.subscriptions
WHERE status = 'active'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Revenue by plan
CREATE OR REPLACE VIEW public.finance_by_plan AS
SELECT 
  plan,
  COUNT(*) as subscription_count,
  SUM(amount_usd) as total_revenue,
  AVG(amount_usd) as avg_revenue
FROM public.subscriptions
WHERE status = 'active'
GROUP BY plan;

-- Payment success rate
CREATE OR REPLACE VIEW public.finance_payment_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'succeeded') as successful_payments,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'succeeded')::DECIMAL / COUNT(*)) * 100, 
    2
  ) as success_rate,
  SUM(amount_usd) FILTER (WHERE status = 'succeeded') as revenue
FROM public.payments
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- User tier distribution
CREATE OR REPLACE VIEW public.finance_user_tiers AS
SELECT 
  subscription_tier as tier,
  COUNT(*) as user_count,
  ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM public.users)) * 100, 2) as percentage
FROM public.users
GROUP BY subscription_tier;

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Get user's active subscription
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan TEXT,
  status TEXT,
  end_date TIMESTAMPTZ,
  amount_usd DECIMAL,
  will_renew BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan,
    s.status,
    s.end_date,
    s.amount_usd,
    u.will_renew
  FROM public.subscriptions s
  JOIN public.users u ON u.id = s.user_id
  WHERE s.user_id = p_user_id
  AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate MRR
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS DECIMAL AS $$
DECLARE
  total_mrr DECIMAL;
BEGIN
  SELECT SUM(
    CASE 
      WHEN plan = 'monthly' THEN amount_usd
      WHEN plan = 'yearly' THEN amount_usd / 12
      ELSE 0
    END
  ) INTO total_mrr
  FROM public.subscriptions
  WHERE status = 'active';
  
  RETURN COALESCE(total_mrr, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate ARR
CREATE OR REPLACE FUNCTION calculate_arr()
RETURNS DECIMAL AS $$
DECLARE
  total_arr DECIMAL;
BEGIN
  SELECT SUM(
    CASE 
      WHEN plan = 'monthly' THEN amount_usd * 12
      WHEN plan = 'yearly' THEN amount_usd
      ELSE 0
    END
  ) INTO total_arr
  FROM public.subscriptions
  WHERE status = 'active';
  
  RETURN COALESCE(total_arr, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get payment history for user
CREATE OR REPLACE FUNCTION get_payment_history(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  payment_id UUID,
  amount_usd DECIMAL,
  status TEXT,
  payment_method TEXT,
  description TEXT,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.amount_usd,
    p.status,
    p.payment_method,
    p.description,
    p.receipt_url,
    p.paid_at
  FROM public.payments p
  WHERE p.user_id = p_user_id
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.finance_mrr TO authenticated;
GRANT SELECT ON public.finance_by_plan TO authenticated;
GRANT SELECT ON public.finance_payment_stats TO authenticated;
GRANT SELECT ON public.finance_user_tiers TO authenticated;

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

-- Check tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('subscriptions', 'payments')
ORDER BY table_name;

-- Check views
SELECT 
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'finance_%'
ORDER BY table_name;

-- Check functions
SELECT 
  routine_name as function_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_active_subscription',
  'calculate_mrr',
  'calculate_arr',
  'get_payment_history'
)
ORDER BY routine_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Subscription & payment system migration complete!' as status,
       'Tables: subscriptions, payments' as tables,
       'Views: finance_mrr, finance_by_plan, finance_payment_stats, finance_user_tiers' as views,
       'Functions: get_active_subscription, calculate_mrr, calculate_arr, get_payment_history' as functions;
