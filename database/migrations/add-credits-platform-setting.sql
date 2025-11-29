-- Add credits_enabled platform setting
-- Run this in Supabase SQL Editor

INSERT INTO platform_settings (setting_key, setting_value, description, category)
VALUES (
  'credits_enabled',
  '{
    "enabled": true,
    "packs": [
      {"id": "starter", "price": 2.00, "credits": 50, "days": 30},
      {"id": "popular", "price": 5.00, "credits": 150, "days": 60},
      {"id": "power", "price": 10.00, "credits": 500, "days": 90}
    ],
    "message": "Pay-as-you-go credits are available for purchase"
  }'::jsonb,
  'Enable/disable pay-as-you-go credit system',
  'monetization'
)
ON CONFLICT (setting_key) DO UPDATE
SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = NOW();
