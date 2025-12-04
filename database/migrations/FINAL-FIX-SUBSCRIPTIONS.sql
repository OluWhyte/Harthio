-- ============================================================================
-- FINAL FIX FOR SUBSCRIPTIONS TABLE
-- ============================================================================
-- Based on actual database state check
-- Adds only the missing columns needed for upgrade_user_to_pro function
-- ============================================================================

-- 1. Add tier column (REQUIRED - function inserts this)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'pro';

-- 2. Add gateway_payment_id (REQUIRED - function inserts this)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT;

-- 3. Add gateway_reference (optional but useful)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS gateway_reference TEXT;

-- 4. Add comprehensive payment tracking (same as credit_purchases)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_channel TEXT,
ADD COLUMN IF NOT EXISTS card_type TEXT,
ADD COLUMN IF NOT EXISTS card_last4 TEXT,
ADD COLUMN IF NOT EXISTS card_bank TEXT,
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS amount_local NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS gateway_fee NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS payment_initiated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_ip_address INET,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 5. Add subscription-specific fields
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS renewal_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_renewal_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

-- 5. Update payment_gateway constraint to include paystack
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_payment_gateway_check;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_payment_gateway_check 
CHECK (payment_gateway IN ('paddle', 'stripe', 'lemonsqueezy', 'paypal', 'razorpay', 'paystack', 'flutterwave'));

-- 6. Add tier constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_tier' 
    AND conrelid = 'subscriptions'::regclass
  ) THEN
    ALTER TABLE subscriptions 
    ADD CONSTRAINT valid_tier CHECK (tier IN ('pro', 'premium', 'enterprise'));
  END IF;
END $$;

-- 7. Make gateway_subscription_id nullable (for one-time payments like Paystack)
ALTER TABLE subscriptions
ALTER COLUMN gateway_subscription_id DROP NOT NULL;

-- 8. Make gateway_customer_id nullable (for one-time payments)
ALTER TABLE subscriptions
ALTER COLUMN gateway_customer_id DROP NOT NULL;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_payment ON subscriptions(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_session ON subscriptions(payment_session_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_email ON subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_channel ON subscriptions(payment_channel);
CREATE INDEX IF NOT EXISTS idx_subscriptions_webhook_verified ON subscriptions(webhook_verified);
CREATE INDEX IF NOT EXISTS idx_subscriptions_auto_renew ON subscriptions(auto_renew) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE auto_renew = true;

-- 10. Add comments for documentation
COMMENT ON COLUMN subscriptions.tier IS 'Subscription tier (pro, premium, enterprise)';
COMMENT ON COLUMN subscriptions.gateway_payment_id IS 'Payment gateway transaction ID';
COMMENT ON COLUMN subscriptions.payment_channel IS 'Payment method (card, bank_transfer, mobile_money)';
COMMENT ON COLUMN subscriptions.card_last4 IS 'Last 4 digits of card for customer reference';
COMMENT ON COLUMN subscriptions.authorization_code IS 'Authorization code for recurring payments';
COMMENT ON COLUMN subscriptions.amount_local IS 'Amount in local currency (NGN, KES, etc.)';
COMMENT ON COLUMN subscriptions.gateway_fee IS 'Fee charged by payment gateway';
COMMENT ON COLUMN subscriptions.net_amount IS 'Net amount received after fees';
COMMENT ON COLUMN subscriptions.webhook_verified IS 'Whether webhook signature was verified';
COMMENT ON COLUMN subscriptions.metadata IS 'Additional payment metadata (JSON)';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether subscription auto-renews';
COMMENT ON COLUMN subscriptions.cancellation_reason IS 'Reason for cancellation';
COMMENT ON COLUMN subscriptions.cancelled_by IS 'Who cancelled (user, admin, system, payment_failed)';

-- Success message
SELECT '✅ Subscriptions table fully enhanced!' as status,
       'Added tier, gateway_payment_id, and comprehensive payment tracking' as columns_added,
       'Same detailed tracking as credit_purchases' as tracking_level,
       'Updated payment_gateway constraint to include paystack' as constraint_updated,
       'Made gateway IDs nullable for one-time payments' as nullable_updated;
