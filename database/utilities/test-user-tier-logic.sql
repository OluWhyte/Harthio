-- ============================================================================
-- TEST USER TIER LOGIC
-- ============================================================================
-- Test platform settings and tier logic for specific user
-- User ID: f50818e5-5dd5-4ac3-bb2e-218a294f33b2

-- ============================================================================
-- 1. CHECK PLATFORM SETTINGS
-- ============================================================================

SELECT 
  '=== PLATFORM SETTINGS ===' as section;

SELECT 
  setting_key,
  setting_value->>'enabled' as enabled,
  setting_value,
  CASE 
    WHEN setting_key = 'pro_tier_enabled' AND (setting_value->>'enabled')::boolean = true 
      THEN '✅ Pro tier ACTIVE - Limits enforced'
    WHEN setting_key = 'pro_tier_enabled' AND (setting_value->>'enabled')::boolean = false 
      THEN '❌ Pro tier DISABLED - Everyone gets Pro access'
    WHEN setting_key = 'ai_rate_limiting_enabled' AND (setting_value->>'enabled')::boolean = true 
      THEN '✅ Rate limiting ACTIVE - Free users limited'
    WHEN setting_key = 'ai_rate_limiting_enabled' AND (setting_value->>'enabled')::boolean = false 
      THEN '❌ Rate limiting DISABLED - Unlimited for all'
    WHEN setting_key = 'trial_mode_enabled' AND (setting_value->>'enabled')::boolean = true 
      THEN '✅ Trial mode ACTIVE - Trial users get Pro'
    WHEN setting_key = 'trial_mode_enabled' AND (setting_value->>'enabled')::boolean = false 
      THEN '❌ Trial mode DISABLED - Trial users treated as Free'
  END as status
FROM public.platform_settings
WHERE setting_key IN ('pro_tier_enabled', 'ai_rate_limiting_enabled', 'trial_mode_enabled')
ORDER BY setting_key;

-- ============================================================================
-- 2. CHECK USER INFO
-- ============================================================================

SELECT 
  '=== USER INFO ===' as section;

SELECT 
  id,
  email,
  subscription_tier,
  is_trial_active,
  trial_start_date,
  trial_end_date,
  CASE 
    WHEN trial_end_date > NOW() THEN 'Trial still active'
    WHEN trial_end_date <= NOW() THEN 'Trial expired'
    ELSE 'No trial'
  END as trial_status,
  created_at
FROM public.users
WHERE id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2';

-- ============================================================================
-- 3. CHECK AI USAGE TODAY
-- ============================================================================

SELECT 
  '=== AI USAGE TODAY ===' as section;

SELECT 
  user_id,
  usage_date,
  message_count,
  topic_helper_count,
  CASE 
    WHEN message_count >= 3 THEN '❌ Free tier limit reached (3/3)'
    ELSE '✅ Under limit (' || message_count || '/3)'
  END as status
FROM public.ai_usage
WHERE user_id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2'
AND usage_date = CURRENT_DATE;

-- If no usage today
SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM public.ai_usage 
      WHERE user_id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2' 
      AND usage_date = CURRENT_DATE
    ) THEN '✅ No usage today (0/3 messages used)'
  END as no_usage_message;

-- ============================================================================
-- 4. SIMULATE EFFECTIVE TIER CALCULATION
-- ============================================================================

SELECT 
  '=== EFFECTIVE TIER CALCULATION ===' as section;

WITH settings AS (
  SELECT 
    (SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'pro_tier_enabled')::boolean as pro_tier_enabled,
    (SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'ai_rate_limiting_enabled')::boolean as rate_limiting_enabled,
    (SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'trial_mode_enabled')::boolean as trial_mode_enabled
),
user_info AS (
  SELECT 
    subscription_tier,
    is_trial_active,
    trial_end_date
  FROM public.users
  WHERE id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2'
)
SELECT 
  -- Platform settings
  s.pro_tier_enabled,
  s.rate_limiting_enabled,
  s.trial_mode_enabled,
  
  -- User info
  u.subscription_tier as actual_tier,
  u.is_trial_active,
  u.trial_end_date,
  u.trial_end_date > NOW() as trial_still_valid,
  
  -- Effective tier logic
  CASE 
    -- If Pro tier is OFF, everyone gets Pro
    WHEN NOT s.pro_tier_enabled THEN 'pro (Pro tier disabled)'
    
    -- If Pro tier is ON and trial mode is ON and user has active trial
    WHEN s.pro_tier_enabled AND s.trial_mode_enabled AND u.is_trial_active AND u.trial_end_date > NOW() 
      THEN 'pro (Active trial)'
    
    -- If Pro tier is ON and trial mode is OFF, trial users are treated as free
    WHEN s.pro_tier_enabled AND NOT s.trial_mode_enabled AND u.is_trial_active 
      THEN 'free (Trial mode disabled)'
    
    -- Otherwise use actual tier
    ELSE u.subscription_tier || ' (Actual tier)'
  END as effective_tier,
  
  -- Should AI be allowed?
  CASE 
    -- If rate limiting is OFF, always allowed
    WHEN NOT s.rate_limiting_enabled THEN '✅ ALLOWED (Rate limiting disabled)'
    
    -- If effective tier is Pro, always allowed
    WHEN (
      NOT s.pro_tier_enabled OR
      (s.trial_mode_enabled AND u.is_trial_active AND u.trial_end_date > NOW()) OR
      u.subscription_tier = 'pro'
    ) THEN '✅ ALLOWED (Pro access)'
    
    -- If free tier, check usage
    ELSE 
      CASE 
        WHEN (SELECT message_count FROM ai_usage WHERE user_id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2' AND usage_date = CURRENT_DATE) >= 3 
          THEN '❌ BLOCKED (3/3 messages used)'
        ELSE '✅ ALLOWED (Under 3 messages)'
      END
  END as ai_access_status
FROM settings s, user_info u;

-- ============================================================================
-- 5. DECISION TREE
-- ============================================================================

SELECT 
  '=== DECISION TREE ===' as section;

SELECT 
  'Step 1: Check Pro Tier' as step,
  (SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'pro_tier_enabled')::boolean as pro_tier_enabled,
  CASE 
    WHEN (SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'pro_tier_enabled')::boolean = false 
      THEN '→ Pro tier OFF: User gets Pro access (STOP HERE)'
    ELSE '→ Pro tier ON: Continue to next step'
  END as result;

SELECT 
  'Step 2: Check Trial Status' as step,
  (SELECT is_trial_active FROM users WHERE id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2') as is_trial_active,
  (SELECT trial_end_date > NOW() FROM users WHERE id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2') as trial_valid,
  CASE 
    WHEN (SELECT is_trial_active FROM users WHERE id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2') = false 
      THEN '→ No trial: Use actual tier'
    WHEN (SELECT trial_end_date <= NOW() FROM users WHERE id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2')
      THEN '→ Trial expired: Use actual tier'
    ELSE '→ Trial active: Check trial mode'
  END as result;

SELECT 
  'Step 3: Check Trial Mode' as step,
  (SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'trial_mode_enabled')::boolean as trial_mode_enabled,
  CASE 
    WHEN (SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'trial_mode_enabled')::boolean = true 
      THEN '→ Trial mode ON: Trial user gets Pro access'
    ELSE '→ Trial mode OFF: Trial user treated as Free'
  END as result;

SELECT 
  'Step 4: Check Rate Limiting' as step,
  (SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'ai_rate_limiting_enabled')::boolean as rate_limiting_enabled,
  CASE 
    WHEN (SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'ai_rate_limiting_enabled')::boolean = false 
      THEN '→ Rate limiting OFF: Unlimited messages'
    ELSE '→ Rate limiting ON: Check usage'
  END as result;

SELECT 
  'Step 5: Check Usage' as step,
  COALESCE((SELECT message_count FROM ai_usage WHERE user_id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2' AND usage_date = CURRENT_DATE), 0) as messages_used,
  CASE 
    WHEN COALESCE((SELECT message_count FROM ai_usage WHERE user_id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2' AND usage_date = CURRENT_DATE), 0) >= 3 
      THEN '→ 3+ messages used: BLOCKED'
    ELSE '→ Under 3 messages: ALLOWED'
  END as result;

-- ============================================================================
-- 6. FINAL VERDICT
-- ============================================================================

SELECT 
  '=== FINAL VERDICT ===' as section;

WITH settings AS (
  SELECT 
    COALESCE((SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'pro_tier_enabled')::boolean, false) as pro_tier_enabled,
    COALESCE((SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'ai_rate_limiting_enabled')::boolean, false) as rate_limiting_enabled,
    COALESCE((SELECT setting_value->>'enabled' FROM platform_settings WHERE setting_key = 'trial_mode_enabled')::boolean, false) as trial_mode_enabled
),
user_info AS (
  SELECT 
    subscription_tier,
    is_trial_active,
    trial_end_date > NOW() as trial_valid
  FROM public.users
  WHERE id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2'
),
usage_info AS (
  SELECT 
    COALESCE(message_count, 0) as messages_today
  FROM public.ai_usage
  WHERE user_id = 'f50818e5-5dd5-4ac3-bb2e-218a294f33b2'
  AND usage_date = CURRENT_DATE
)
SELECT 
  -- Settings
  s.pro_tier_enabled as "Pro Tier",
  s.rate_limiting_enabled as "Rate Limiting",
  s.trial_mode_enabled as "Trial Mode",
  
  -- User
  u.subscription_tier as "Actual Tier",
  u.is_trial_active as "Is Trial Active",
  u.trial_valid as "Trial Valid",
  
  -- Usage
  COALESCE(usage.messages_today, 0) as "Messages Today",
  
  -- Final decision
  CASE 
    -- Pro tier OFF = everyone gets Pro
    WHEN NOT s.pro_tier_enabled THEN '✅ ALLOWED (Pro tier disabled - everyone gets Pro)'
    
    -- Rate limiting OFF = unlimited
    WHEN NOT s.rate_limiting_enabled THEN '✅ ALLOWED (Rate limiting disabled - unlimited)'
    
    -- User is Pro tier
    WHEN u.subscription_tier = 'pro' THEN '✅ ALLOWED (Pro user - unlimited)'
    
    -- User has active trial AND trial mode is ON
    WHEN u.is_trial_active AND u.trial_valid AND s.trial_mode_enabled 
      THEN '✅ ALLOWED (Active trial with trial mode ON - gets Pro)'
    
    -- User has active trial BUT trial mode is OFF
    WHEN u.is_trial_active AND u.trial_valid AND NOT s.trial_mode_enabled 
      THEN CASE 
        WHEN COALESCE(usage.messages_today, 0) >= 3 THEN '❌ BLOCKED (Trial mode OFF - treated as Free, 3/3 used)'
        ELSE '✅ ALLOWED (Trial mode OFF - treated as Free, ' || COALESCE(usage.messages_today, 0) || '/3 used)'
      END
    
    -- Free user - check usage
    WHEN COALESCE(usage.messages_today, 0) >= 3 
      THEN '❌ BLOCKED (Free user - 3/3 messages used)'
    ELSE '✅ ALLOWED (Free user - ' || COALESCE(usage.messages_today, 0) || '/3 used)'
  END as "FINAL VERDICT"
FROM settings s, user_info u
LEFT JOIN usage_info usage ON true;

-- ============================================================================
-- 7. QUICK TOGGLE COMMANDS
-- ============================================================================

SELECT 
  '=== QUICK TOGGLE COMMANDS ===' as section;

-- Enable everything (full monetization)
SELECT 'To enable full monetization, run:' as instruction;
SELECT 'UPDATE platform_settings SET setting_value = jsonb_set(setting_value, ''{enabled}'', ''true''::jsonb) WHERE setting_key IN (''pro_tier_enabled'', ''ai_rate_limiting_enabled'', ''trial_mode_enabled'');' as sql;

-- Disable everything (launch mode)
SELECT 'To disable everything (launch mode), run:' as instruction;
SELECT 'UPDATE platform_settings SET setting_value = jsonb_set(setting_value, ''{enabled}'', ''false''::jsonb) WHERE setting_key IN (''pro_tier_enabled'', ''ai_rate_limiting_enabled'', ''trial_mode_enabled'');' as sql;

-- Test free tier (Pro ON, Trial mode OFF)
SELECT 'To test free tier experience, run:' as instruction;
SELECT 'UPDATE platform_settings SET setting_value = jsonb_set(setting_value, ''{enabled}'', ''true''::jsonb) WHERE setting_key IN (''pro_tier_enabled'', ''ai_rate_limiting_enabled''); UPDATE platform_settings SET setting_value = jsonb_set(setting_value, ''{enabled}'', ''false''::jsonb) WHERE setting_key = ''trial_mode_enabled'';' as sql;
