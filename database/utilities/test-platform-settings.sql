-- ============================================================================
-- TEST PLATFORM SETTINGS
-- ============================================================================
-- Diagnostic queries to check if platform settings are working correctly

-- ============================================================================
-- 1. CHECK IF TABLE EXISTS
-- ============================================================================

SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_settings'
  ) as table_exists;

-- ============================================================================
-- 2. VIEW ALL SETTINGS
-- ============================================================================

SELECT 
  setting_key,
  setting_value,
  description,
  updated_at
FROM public.platform_settings
ORDER BY setting_key;

-- ============================================================================
-- 3. CHECK PRO TIER SETTING SPECIFICALLY
-- ============================================================================

SELECT 
  setting_key,
  setting_value->>'enabled' as enabled_value,
  setting_value->>'message' as message,
  setting_value as full_json
FROM public.platform_settings
WHERE setting_key = 'pro_tier_enabled';

-- ============================================================================
-- 4. TEST THE FUNCTION
-- ============================================================================

SELECT is_pro_tier_enforced() as pro_tier_enforced;

-- ============================================================================
-- 5. CHECK RLS POLICIES
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'platform_settings';

-- ============================================================================
-- 6. TEST UPDATE (AS ADMIN)
-- ============================================================================

-- First, check current value
SELECT 
  setting_key,
  setting_value->>'enabled' as current_enabled
FROM public.platform_settings
WHERE setting_key = 'pro_tier_enabled';

-- Try to update (this will only work if you're an admin)
UPDATE public.platform_settings
SET setting_value = jsonb_set(
  setting_value,
  '{enabled}',
  'true'::jsonb
)
WHERE setting_key = 'pro_tier_enabled';

-- Check if update worked
SELECT 
  setting_key,
  setting_value->>'enabled' as new_enabled,
  updated_at
FROM public.platform_settings
WHERE setting_key = 'pro_tier_enabled';

-- ============================================================================
-- 7. CHECK YOUR ADMIN STATUS
-- ============================================================================

SELECT 
  user_id,
  role,
  is_active,
  created_at
FROM public.admin_roles
WHERE user_id = auth.uid();

-- ============================================================================
-- 8. MANUAL TOGGLE TEST
-- ============================================================================

-- Enable Pro tier
UPDATE public.platform_settings
SET 
  setting_value = jsonb_build_object(
    'enabled', true,
    'message', 'Pro tier is active. Free users have limited access.'
  ),
  updated_at = NOW()
WHERE setting_key = 'pro_tier_enabled';

-- Verify
SELECT 
  setting_key,
  setting_value,
  updated_at
FROM public.platform_settings
WHERE setting_key = 'pro_tier_enabled';

-- Disable Pro tier
UPDATE public.platform_settings
SET 
  setting_value = jsonb_build_object(
    'enabled', false,
    'message', 'Pro tier is disabled. All users have Pro access.'
  ),
  updated_at = NOW()
WHERE setting_key = 'pro_tier_enabled';

-- Verify
SELECT 
  setting_key,
  setting_value,
  updated_at
FROM public.platform_settings
WHERE setting_key = 'pro_tier_enabled';

-- ============================================================================
-- 9. CHECK IF SETTINGS ARE BEING READ
-- ============================================================================

-- This should return the current Pro tier status
SELECT 
  setting_key,
  setting_value->>'enabled' as is_enabled,
  CASE 
    WHEN (setting_value->>'enabled')::boolean = true THEN 'Pro tier is ACTIVE - Free users have limited access'
    ELSE 'Pro tier is DISABLED - All users have Pro access'
  END as status_message
FROM public.platform_settings
WHERE setting_key = 'pro_tier_enabled';

-- ============================================================================
-- 10. TROUBLESHOOTING CHECKLIST
-- ============================================================================

SELECT 
  '✓ Table exists' as check_1,
  (SELECT COUNT(*) FROM public.platform_settings) as total_settings,
  (SELECT setting_value->>'enabled' FROM public.platform_settings WHERE setting_key = 'pro_tier_enabled') as pro_tier_enabled,
  (SELECT COUNT(*) FROM public.admin_roles WHERE user_id = auth.uid() AND is_active = true) as you_are_admin,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'platform_settings') as rls_policies_count;
