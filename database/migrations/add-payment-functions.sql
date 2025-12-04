-- ============================================================================
-- UPDATE PAYMENT FUNCTIONS WITH EXCHANGE RATE SUPPORT
-- ============================================================================
-- Updates functions to calculate and save amount_local and exchange_rate
-- Ensures proper currency tracking for multi-currency support
-- ============================================================================

-- ============================================================================
-- 1. UPDATE: Add Credits to User (with exchange rate calculation)
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
  v_amount_local DECIMAL;
  v_exchange_rate DECIMAL;
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
  
  -- Calculate exchange rate and local amount based on currency
  -- Exchange rates: NGN=1501, KES=129, GHS=12, ZAR=18, USD=1
  v_exchange_rate := CASE p_currency
    WHEN 'USD' THEN 1
    WHEN 'NGN' THEN 1501
    WHEN 'KES' THEN 129
    WHEN 'GHS' THEN 12
    WHEN 'ZAR' THEN 18
    ELSE 1
  END;
  
  -- Calculate local amount from USD
  v_amount_local := p_amount_usd * v_exchange_rate;
  
  -- Calculate new expiry (30 days from now)
  v_expiry_date := NOW() + INTERVAL '30 days';
  
  -- Insert purchase record with all currency tracking
  INSERT INTO credit_purchases (
    user_id, 
    credits_purchased, 
    amount_usd,
    amount_local,
    currency,
    exchange_rate,
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
    v_amount_local,
    p_currency,
    v_exchange_rate,
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
    'expires_at', v_expiry_date,
    'amount_usd', p_amount_usd,
    'amount_local', v_amount_local,
    'currency', p_currency,
    'exchange_rate', v_exchange_rate
  );
  
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, everything rolls back automatically
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. UPDATE: Upgrade User to Pro (with exchange rate calculation)
-- ============================================================================
CREATE OR REPLACE FUNCTION upgrade_user_to_pro(
  p_user_id UUID,
  p_plan TEXT,
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
  v_subscription_id UUID;
  v_amount_local DECIMAL;
  v_exchange_rate DECIMAL;
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
  
  -- Calculate exchange rate and local amount
  v_exchange_rate := CASE p_currency
    WHEN 'USD' THEN 1
    WHEN 'NGN' THEN 1501
    WHEN 'KES' THEN 129
    WHEN 'GHS' THEN 12
    WHEN 'ZAR' THEN 18
    ELSE 1
  END;
  
  v_amount_local := p_amount_usd * v_exchange_rate;
  
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
  
  -- Record subscription with all currency tracking
  INSERT INTO subscriptions (
    user_id,
    plan,
    tier,
    status,
    amount_usd,
    amount_local,
    currency,
    start_date,
    end_date,
    payment_gateway,
    gateway_payment_id,
    gateway_customer_id,
    gateway_subscription_id,
    auto_renew,
    created_at
  ) VALUES (
    p_user_id,
    p_plan,
    'pro',
    'active',
    p_amount_usd,
    v_amount_local,
    p_currency,
    NOW(),
    v_end_date,
    p_payment_gateway,
    p_gateway_payment_id,
    p_gateway_customer_id,
    NULL,
    false,
    NOW()
  )
  RETURNING id INTO v_subscription_id;
  
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
    'subscription_id', v_subscription_id,
    'plan', p_plan,
    'subscription_end_date', v_end_date,
    'days_added', v_days_to_add,
    'amount_usd', p_amount_usd,
    'amount_local', v_amount_local,
    'currency', p_currency,
    'exchange_rate', v_exchange_rate
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION add_credits_to_user TO service_role;
GRANT EXECUTE ON FUNCTION upgrade_user_to_pro TO service_role;

-- Success message
SELECT '✅ Payment functions updated with exchange rate support!' as status,
       'Now calculates and saves amount_local and exchange_rate' as change,
       'Supports: USD, NGN, KES, GHS, ZAR' as currencies;
