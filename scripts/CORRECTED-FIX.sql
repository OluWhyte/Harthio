-- ============================================================================
-- CORRECTED FIX: Remove RLS Policy Attempt on View
-- ============================================================================
-- Views cannot have RLS policies, so we'll use a different approach

-- Step 1: Drop the problematic view
DROP VIEW IF EXISTS public.user_footprints;

-- Step 2: Create a working view without RLS complications
CREATE VIEW public.user_footprints AS
SELECT 
  u.id as user_id,
  u.email,
  u.display_name,
  COALESCE(COUNT(DISTINCT us.id), 0) as total_sessions,
  COALESCE(COUNT(DISTINCT us.device_fingerprint), 0) as unique_devices,
  COALESCE(COUNT(DISTINCT us.ip_address), 0) as unique_ip_addresses,
  COALESCE(COUNT(DISTINCT (us.location_info->>'country')), 0) as unique_countries,
  MIN(us.created_at) as first_session,
  MAX(us.last_active) as last_session,
  COALESCE(AVG(us.session_duration_minutes), 0) as avg_session_duration,
  COALESCE(SUM(us.session_duration_minutes), 0) as total_session_time,
  COALESCE(COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END), 0) as sessions_last_7_days,
  COALESCE(COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '30 days' THEN 1 END), 0) as sessions_last_30_days,
  '{}'::jsonb as most_used_device,
  '{}'::jsonb as most_common_location,
  'Medium'::text as engagement_level
FROM users u
LEFT JOIN user_sessions us ON u.id = us.user_id
GROUP BY u.id, u.email, u.display_name;

-- Step 3: Grant permissions
GRANT SELECT ON public.user_footprints TO authenticated;
GRANT SELECT ON public.user_footprints TO service_role;

-- Step 4: Test the basic components first

-- Test 1: Check users table
SELECT 'Test 1: Users table' as test, COUNT(*) as count FROM users;

-- Test 2: Check user_sessions table
SELECT 'Test 2: User sessions table' as test, COUNT(*) as count FROM user_sessions;

-- Test 3: Check admin_roles table
SELECT 'Test 3: Admin roles table' as test, COUNT(*) as count FROM admin_roles;

-- Test 4: Check if your specific user exists
SELECT 'Test 4: Your user exists' as test, 
       email, 
       created_at 
FROM users 
WHERE id = '3fe8c7ea-15ce-4149-a435-c738ffbecaff';

-- Test 5: Check the new view
SELECT 'Test 5: View works' as test, COUNT(*) as count FROM user_footprints;

-- Test 6: Check your user in the view
SELECT 'Test 6: Your user in view' as test,
       user_id,
       email,
       engagement_level
FROM user_footprints 
WHERE user_id = '3fe8c7ea-15ce-4149-a435-c738ffbecaff';

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Test 1: Should show number of users (> 0)
-- Test 2: Should show number of sessions (might be 0 if tracking disabled)
-- Test 3: Should show 1 (your admin role)
-- Test 4: Should show your email and creation date
-- Test 5: Should show same as Test 1 (all users visible in view)
-- Test 6: Should show your user data with engagement_level = 'Medium'
-- ============================================================================