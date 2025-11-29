-- =====================================================
-- CREDITS SYSTEM MIGRATION
-- =====================================================
-- Adds pay-as-you-go credits alongside Pro subscription
-- Users can buy message packs that don't expire daily
-- =====================================================

-- 1. Add credit columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_expire_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster credit queries
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(ai_credits, credits_expire_at);

COMMENT ON COLUMN users.ai_credits IS 'Number of AI message credits remaining';
COMMENT ON COLUMN users.credits_expire_at IS 'When current credits expire';

-- 2. Create credit_purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Purchase details
  pack_id TEXT NOT NULL, -- 'starter', 'popular', 'power'
  amount_usd DECIMAL(10,2) NOT NULL,
  credits_purchased INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  
  -- Payment details
  payment_method TEXT, -- 'card', 'mpesa', 'airtel_money', 'mtn_money', 'orange_money'
  payment_id TEXT UNIQUE,
  payment_gateway TEXT, -- 'stripe', 'flutterwave', 'paystack'
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  
  -- Expiry tracking
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT positive_amount CHECK (amount_usd > 0),
  CONSTRAINT positive_credits CHECK (credits_purchased > 0)
);

-- Indexes for credit_purchases
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created ON credit_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_payment ON credit_purchases(payment_id);

-- Comments
COMMENT ON TABLE credit_purchases IS 'Tracks all credit pack purchases';
COMMENT ON COLUMN credit_purchases.pack_id IS 'Which pack was purchased (starter/popular/power)';
COMMENT ON COLUMN credit_purchases.validity_days IS 'How many days credits are valid for';

-- 3. Enable RLS on credit_purchases
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own credit purchases"
  ON credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all purchases
CREATE POLICY "Admins can view all credit purchases"
  ON credit_purchases FOR SELECT
  USING (is_admin());

-- Only system can insert (via API)
CREATE POLICY "System can insert credit purchases"
  ON credit_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update (for refunds)
CREATE POLICY "Admins can update credit purchases"
  ON credit_purchases FOR UPDATE
  USING (is_admin());

-- 4. Update payments table to track credits
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS credits_purchased INTEGER,
ADD COLUMN IF NOT EXISTS credits_expire_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN payments.credits_purchased IS 'Number of credits purchased (if credit pack)';
COMMENT ON COLUMN payments.credits_expire_at IS 'When purchased credits expire';

-- 5. Create function to update credit_purchases timestamp
CREATE OR REPLACE FUNCTION update_credit_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credit_purchases_updated_at
  BEFORE UPDATE ON credit_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_purchases_updated_at();

-- 6. Create view for active credits
CREATE OR REPLACE VIEW active_credit_balances AS
SELECT 
  u.id as user_id,
  u.email,
  u.ai_credits,
  u.credits_expire_at,
  CASE 
    WHEN u.credits_expire_at IS NULL THEN false
    WHEN u.credits_expire_at < NOW() THEN true
    ELSE false
  END as is_expired,
  CASE 
    WHEN u.credits_expire_at IS NULL THEN 0
    WHEN u.credits_expire_at < NOW() THEN 0
    ELSE u.ai_credits
  END as active_credits
FROM users u
WHERE u.ai_credits > 0 OR u.credits_expire_at IS NOT NULL;

COMMENT ON VIEW active_credit_balances IS 'Shows users with credits and their expiry status';

-- 7. Create admin view for credit analytics
CREATE OR REPLACE VIEW credit_analytics AS
SELECT 
  COUNT(DISTINCT user_id) as total_credit_users,
  SUM(credits_purchased) as total_credits_sold,
  SUM(amount_usd) as total_revenue,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_purchases,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_purchases,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_purchases,
  COUNT(*) FILTER (WHERE status = 'refunded') as refunded_purchases,
  AVG(amount_usd) FILTER (WHERE status = 'completed') as avg_purchase_amount,
  COUNT(*) FILTER (WHERE pack_id = 'starter') as starter_packs_sold,
  COUNT(*) FILTER (WHERE pack_id = 'popular') as popular_packs_sold,
  COUNT(*) FILTER (WHERE pack_id = 'power') as power_packs_sold
FROM credit_purchases
WHERE created_at >= NOW() - INTERVAL '30 days';

COMMENT ON VIEW credit_analytics IS 'Credit purchase analytics for admin dashboard';

-- 8. Create function to clean expired credits
CREATE OR REPLACE FUNCTION clean_expired_credits()
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE users
  SET ai_credits = 0
  WHERE credits_expire_at < NOW()
    AND ai_credits > 0;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clean_expired_credits IS 'Resets expired credits to 0 (run daily via cron)';

-- 9. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Credits system migration complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'New tables created:';
  RAISE NOTICE '  - credit_purchases (tracks all credit purchases)';
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added to users:';
  RAISE NOTICE '  - ai_credits (current credit balance)';
  RAISE NOTICE '  - credits_expire_at (when credits expire)';
  RAISE NOTICE '';
  RAISE NOTICE 'New views created:';
  RAISE NOTICE '  - active_credit_balances (users with active credits)';
  RAISE NOTICE '  - credit_analytics (admin analytics)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Deploy credits-service.ts';
  RAISE NOTICE '  2. Update rate limiting logic';
  RAISE NOTICE '  3. Add credit purchase UI';
  RAISE NOTICE '  4. Integrate payment gateway';
END $$;
