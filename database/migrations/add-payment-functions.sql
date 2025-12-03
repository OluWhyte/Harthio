-- ============================================================================
-- PAYMENT PROCESSING FUNCTIONS
-- ============================================================================
-- Atomic functions for handling credit purchases and Pro subscriptions
-- Ensures data consistency and prevents partial failures
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION: Add Credits to User
-- ============================================================================
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

COMMENT ON FUNCTION add_credits_to_user IS 'Atomically adds credits to user account and records purchase';

-- ============================================================================
-- 2. FUNCTION: Upgrade User to Pro
-- ============================================================================
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

COMMENT ON FUNCTION upgrade_user_to_pro IS 'Atomically upgrades user to Pro tier and records payment';

-- ============================================================================
-- 3. GRANT PERMISSIONS
-- ============================================================================
-- Only service role can call these functions (API routes only)
-- This prevents users from directly calling these functions to give themselves credits
GRANT EXECUTE ON FUNCTION add_credits_to_user TO service_role;
GRANT EXECUTE ON FUNCTION upgrade_user_to_pro TO service_role;

-- Revoke from public and authenticated to prevent abuse
REVOKE EXECUTE ON FUNCTION add_credits_to_user FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION upgrade_user_to_pro FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION add_credits_to_user FROM authenticated;
REVOKE EXECUTE ON FUNCTION upgrade_user_to_pro FROM authenticated;

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('add_credits_to_user', 'upgrade_user_to_pro')
ORDER BY routine_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Payment functions created successfully!' as status,
       'add_credits_to_user() - Atomically adds credits' as function_1,
       'upgrade_user_to_pro() - Atomically upgrades to Pro' as function_2,
       'Both functions ensure data consistency with automatic rollback on errors' as note;
