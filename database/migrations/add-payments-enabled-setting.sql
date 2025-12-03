-- ============================================================================
-- ADD PAYMENTS ENABLED SETTING
-- ============================================================================
-- Master switch to control all payment functionality
-- Separates feature availability (monetization) from payment processing (finance)
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- Insert the new setting (follows existing platform_settings structure)
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'payments_enabled',
    '{"enabled": false, "message": "Payment processing is currently disabled. Coming soon!"}'::jsonb,
    'Master switch to enable/disable all payment functionality (credits, subscriptions, etc.). When disabled, buy buttons show "Coming Soon".'
)
ON CONFLICT (setting_key) DO UPDATE
SET 
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the setting was created
SELECT 
    setting_key,
    setting_value,
    description,
    created_at
FROM public.platform_settings 
WHERE setting_key = 'payments_enabled';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Payments enabled setting added!' as status,
       'Payment processing: DISABLED (users see "Coming Soon")' as payments,
       'Admins can toggle this in Admin > Finance' as admin_control;
