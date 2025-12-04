-- ============================================================================
-- ENHANCE CREDIT_PURCHASES TABLE FOR PAYMENT TRACKING
-- ============================================================================
-- Adds comprehensive payment tracking columns for audit and reconciliation
-- Ensures all payment information is properly stored for traceability
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

-- Add comments for documentation
COMMENT ON COLUMN credit_purchases.currency IS 'Payment currency (USD, NGN, KES, etc.)';
COMMENT ON COLUMN credit_purchases.gateway_customer_id IS 'Payment gateway customer ID for recurring payments';
COMMENT ON COLUMN credit_purchases.gateway_payment_id IS 'Payment gateway transaction ID';
COMMENT ON COLUMN credit_purchases.gateway_reference IS 'Payment gateway reference number';
COMMENT ON COLUMN credit_purchases.payment_session_id IS 'Payment session/checkout ID';
COMMENT ON COLUMN credit_purchases.payment_intent_id IS 'Payment intent ID (for Stripe-like gateways)';
COMMENT ON COLUMN credit_purchases.payment_channel IS 'Payment method used (card, bank, mobile money, etc.)';
COMMENT ON COLUMN credit_purchases.card_type IS 'Card brand (visa, mastercard, verve, etc.)';
COMMENT ON COLUMN credit_purchases.card_last4 IS 'Last 4 digits of card';
COMMENT ON COLUMN credit_purchases.card_bank IS 'Issuing bank of the card';
COMMENT ON COLUMN credit_purchases.authorization_code IS 'Authorization code for recurring payments';
COMMENT ON COLUMN credit_purchases.amount_local IS 'Amount in local currency';
COMMENT ON COLUMN credit_purchases.exchange_rate IS 'Exchange rate used for conversion';
COMMENT ON COLUMN credit_purchases.gateway_fee IS 'Fee charged by payment gateway';
COMMENT ON COLUMN credit_purchases.net_amount IS 'Net amount received after fees';
COMMENT ON COLUMN credit_purchases.payment_initiated_at IS 'When payment was initiated';
COMMENT ON COLUMN credit_purchases.payment_completed_at IS 'When payment was completed';
COMMENT ON COLUMN credit_purchases.payment_failed_at IS 'When payment failed';
COMMENT ON COLUMN credit_purchases.customer_email IS 'Customer email at time of payment';
COMMENT ON COLUMN credit_purchases.customer_phone IS 'Customer phone at time of payment';
COMMENT ON COLUMN credit_purchases.customer_ip_address IS 'Customer IP address for fraud detection';
COMMENT ON COLUMN credit_purchases.refund_id IS 'Refund transaction ID';
COMMENT ON COLUMN credit_purchases.refund_reason IS 'Reason for refund';
COMMENT ON COLUMN credit_purchases.refunded_at IS 'When refund was processed';
COMMENT ON COLUMN credit_purchases.refund_amount IS 'Amount refunded';
COMMENT ON COLUMN credit_purchases.webhook_received_at IS 'When webhook notification was received';
COMMENT ON COLUMN credit_purchases.webhook_verified IS 'Whether webhook signature was verified';
COMMENT ON COLUMN credit_purchases.metadata IS 'Additional payment metadata (JSON)';

-- Success message
SELECT '✅ Credit purchases table enhanced with comprehensive payment tracking!' as status,
       'All payment information can now be properly traced and audited' as note;
