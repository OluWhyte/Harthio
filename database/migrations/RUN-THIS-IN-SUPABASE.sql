-- ============================================================================
-- COMPLETE PAYMENT SYSTEM MIGRATION
-- ============================================================================
-- Run this entire file in Supabase SQL Editor
-- This will set up the complete payment system with proper tracking
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE CREDITS SYSTEM (if not exists)
-- ============================================================================

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own credit purchases" ON credit_purchases;
DROP POLICY IF EXISTS "Admins can view all credit purchases" ON credit_purchases;
DROP POLICY IF EXISTS "System can insert credit purchases" ON credit_purchases;
DROP POLICY IF EXISTS "Admins can update credit purchases" ON credit_purchases;

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

-- ============================================================================
-- STEP 2: ADD COMPREHENSIVE PAYMENT TRACKING COLUMNS
-- ============================================================================

-- Add currency column for multi-currency support
ALTER TABLE credit_purchases 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add gateway-specific tracking columns
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS gateway_customer_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_reference TEXT;

-- Add payment session tracking
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS payment_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Add detailed payment metadata
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS payment_channel TEXT, -- 'card', 'bank_transfer', 'mobile_money', 'ussd'
ADD COLUMN IF NOT EXISTS card_type TEXT, -- 'visa', 'mastercard', 'verve'
ADD COLUMN IF NOT EXISTS card_last4 TEXT,
ADD COLUMN IF NOT EXISTS card_bank TEXT,
ADD COLUMN IF NOT EXISTS authorization_code TEXT; -- For recurring payments

-- Add amount tracking in multiple currencies
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS amount_local DECIMAL(10,2), -- Amount in local currency (NGN, KES, etc.)
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6), -- Exchange rate used
ADD COLUMN IF NOT EXISTS gateway_fee DECIMAL(10,2), -- Fee charged by payment gateway
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2); -- Amount after fees

-- Add timestamps for payment lifecycle
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS payment_initiated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMP WITH TIME ZONE;

-- Add customer information
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_ip_address INET;

-- Add refund tracking
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);

-- Add webhook tracking
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_verified BOOLEAN DEFAULT false;

-- Add metadata for additional tracking
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_credit_purchases_currency ON credit_purchases(currency);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_gateway_customer ON credit_purchases(gateway_customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_gateway_payment ON credit_purchases(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_gateway_reference ON credit_purchases(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_payment_session ON credit_purchases(payment_session_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_customer_email ON credit_purchases(customer_email);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_payment_channel ON credit_purchases(payment_channel);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_completed_at ON credit_purchases(payment_completed_at);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_webhook_verified ON credit_purchases(webhook_verified);

-- ============================================================================
-- STEP 3: CREATE PAYMENT PROCESSING FUNCTIONS
-- ============================================================================

-- Function: Add Credits to User
CREATE OR REPLACE FUNCTION add_credits_to_user(
  p_user_id UUID,
  p_credits INTEGER,
  p_amount_usd DECIMAL,
  p_pack_id TEXT,
  p_payment_gateway TEXT,
  p_gateway_payment_id TEXT,
  p_currency TEXT DEFAULT 'NGN',
  p_gateway_customer_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_new_credits INTEGER;
  v_expiry_date TIMESTAMP WITH TIME ZONE;
  v_purchase_id UUID;
BEGIN
  -- Validate inputs
  IF p_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credits must be positive'
    );
  END IF;
  
  IF p_amount_usd <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Amount must be positive'
    );
  END IF;
  
  -- Calculate new expiry (30 days from now)
  v_expiry_date := NOW() + INTERVAL '30 days';
  
  -- Insert purchase record
  INSERT INTO credit_purchases (
    user_id, 
    credits_purchased, 
    amount_usd, 
    currency,
    pack_id, 
    payment_gateway, 
    gateway_payment_id,
    gateway_customer_id,
    status, 
    validity_days, 
    expires_at,
    created_at
  ) VALUES (
    p_user_id, 
    p_credits, 
    p_amount_usd, 
    p_currency,
    p_pack_id, 
    p_payment_gateway, 
    p_gateway_payment_id,
    p_gateway_customer_id,
    'completed', 
    30, 
    v_expiry_date,
    NOW()
  )
  RETURNING id INTO v_purchase_id;
  
  -- Update user credits (atomic)
  UPDATE users 
  SET 
    ai_credits = COALESCE(ai_credits, 0) + p_credits,
    credits_expire_at = v_expiry_date,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING ai_credits INTO v_new_credits;
  
  -- Check if user was found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'credits_added', p_credits,
    'new_balance', v_new_credits,
    'expires_at', v_expiry_date
  );
  
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, everything rolls back automatically
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Upgrade User to Pro
CREATE OR REPLACE FUNCTION upgrade_user_to_pro(
  p_user_id UUID,
  p_plan TEXT, -- 'monthly' or 'yearly'
  p_amount_usd DECIMAL,
  p_payment_gateway TEXT,
  p_gateway_payment_id TEXT,
  p_currency TEXT DEFAULT 'NGN',
  p_gateway_customer_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_days_to_add INTEGER;
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_current_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Validate plan
  IF p_plan NOT IN ('monthly', 'yearly') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Plan must be monthly or yearly'
    );
  END IF;
  
  -- Calculate days to add
  v_days_to_add := CASE 
    WHEN p_plan = 'yearly' THEN 365
    ELSE 30
  END;
  
  -- Get current subscription end date
  SELECT subscription_end_date INTO v_current_end_date
  FROM users
  WHERE id = p_user_id;
  
  -- Calculate new end date (extend if already subscribed)
  IF v_current_end_date IS NOT NULL AND v_current_end_date > NOW() THEN
    v_end_date := v_current_end_date + (v_days_to_add || ' days')::INTERVAL;
  ELSE
    v_end_date := NOW() + (v_days_to_add || ' days')::INTERVAL;
  END IF;
  
  -- Record payment in credit_purchases (for tracking)
  INSERT INTO credit_purchases (
    user_id,
    credits_purchased,
    amount_usd,
    currency,
    pack_id,
    payment_gateway,
    gateway_payment_id,
    gateway_customer_id,
    status,
    validity_days,
    expires_at,
    created_at
  ) VALUES (
    p_user_id,
    0, -- Pro subscription, not credits
    p_amount_usd,
    p_currency,
    'pro_' || p_plan,
    p_payment_gateway,
    p_gateway_payment_id,
    p_gateway_customer_id,
    'completed',
    v_days_to_add,
    v_end_date,
    NOW()
  );
  
  -- Update user to Pro tier
  UPDATE users
  SET
    subscription_tier = 'pro',
    subscription_end_date = v_end_date,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Check if user was found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'plan', p_plan,
    'subscription_end_date', v_end_date,
    'days_added', v_days_to_add
  );
  
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, everything rolls back
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================================================

-- Only service role can call these functions (API routes only)
GRANT EXECUTE ON FUNCTION add_credits_to_user TO service_role;
GRANT EXECUTE ON FUNCTION upgrade_user_to_pro TO service_role;

-- Revoke from public and authenticated to prevent abuse
REVOKE EXECUTE ON FUNCTION add_credits_to_user FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION upgrade_user_to_pro FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION add_credits_to_user FROM authenticated;
REVOKE EXECUTE ON FUNCTION upgrade_user_to_pro FROM authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Complete payment system deployed successfully!' as status,
       'Credits system, payment tracking, and atomic functions are ready' as note;
