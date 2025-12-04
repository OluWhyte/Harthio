-- ============================================================================
-- UPDATE UPGRADE_USER_TO_PRO FUNCTION
-- ============================================================================
-- Updates function to use subscriptions table instead of credit_purchases
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
  
  -- Record subscription in subscriptions table (NOT credit_purchases)
  INSERT INTO subscriptions (
    user_id,
    plan,
    tier,
    status,
    amount_usd,
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
    p_currency,
    NOW(),
    v_end_date,
    p_payment_gateway,
    p_gateway_payment_id,
    p_gateway_customer_id,
    NULL, -- No recurring subscription ID for one-time Paystack payments
    false, -- Manual renewal
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
    'days_added', v_days_to_add
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION upgrade_user_to_pro TO service_role;
REVOKE EXECUTE ON FUNCTION upgrade_user_to_pro FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION upgrade_user_to_pro FROM authenticated;

-- Success message
SELECT '✅ upgrade_user_to_pro function updated!' as status,
       'Now inserts into subscriptions table instead of credit_purchases' as change;
