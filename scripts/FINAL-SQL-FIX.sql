-- ============================================================================
-- FINAL FIX: is_admin_user() Function
-- ============================================================================
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it
-- This will fix the is_admin_user() function to return true for admin users

-- Step 1: Drop the user_footprints view first (since it depends on the function)
DROP VIEW IF EXISTS public.user_footprints;

-- Step 2: Drop the existing function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Step 2: Create a better version of the function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_id UUID;
  admin_exists BOOLEAN := FALSE;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the user exists in admin_roles table
  SELECT EXISTS(
    SELECT 1 
    FROM public.admin_roles ar 
    WHERE ar.user_id = current_user_id
  ) INTO admin_exists;
  
  RETURN admin_exists;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return false on any error to be safe
    RETURN FALSE;
END;
$$;

-- Step 3: Grant proper permissions
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;

-- Step 4: Create a debug function to help troubleshoot
CREATE OR REPLACE FUNCTION public.debug_admin_check()
RETURNS TABLE(
  current_user_id UUID,
  user_email TEXT,
  admin_roles_count BIGINT,
  is_admin_result BOOLEAN,
  auth_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (SELECT email::TEXT FROM auth.users WHERE id = auth.uid()) as user_email,
    (SELECT COUNT(*) FROM admin_roles WHERE user_id = auth.uid()) as admin_roles_count,
    public.is_admin_user() as is_admin_result,
    auth.role()::TEXT as auth_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_admin_check() TO authenticated;

-- Step 5: Test the functions
-- These SELECT statements will show you if everything is working

-- Test 1: Check the debug function
SELECT * FROM public.debug_admin_check();

-- Test 2: Test the is_admin_user function directly
SELECT public.is_admin_user() as am_i_admin;

-- Test 3: Verify your admin status manually
SELECT 
  auth.uid() as my_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as my_email,
  (SELECT COUNT(*) FROM admin_roles WHERE user_id = auth.uid()) as my_admin_count,
  public.is_admin_user() as function_says_admin;

-- Step 6: Recreate the user_footprints view with the fixed function
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
  CASE 
    WHEN COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) >= 5 THEN 'High'::text
    WHEN COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) >= 2 THEN 'Medium'::text
    ELSE 'Low'::text
  END as engagement_level
FROM users u
LEFT JOIN user_sessions us ON u.id = us.user_id
WHERE public.is_admin_user() = true
GROUP BY u.id, u.email, u.display_name;

-- Grant permissions on the view
GRANT SELECT ON public.user_footprints TO authenticated;

-- Step 7: Test the user_footprints view
SELECT COUNT(*) as total_users_in_footprints FROM user_footprints;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- After running this script, you should see:
-- 
-- Test 1 (debug_admin_check): 
--   - current_user_id: your UUID
--   - user_email: peterlimited2000@gmail.com  
--   - admin_roles_count: 1
--   - is_admin_result: true  ← This should be TRUE now
--   - auth_role: authenticated
--
-- Test 2 (is_admin_user):
--   - am_i_admin: true  ← This should be TRUE now
--
-- Test 3 (manual verification):
--   - my_user_id: your UUID
--   - my_email: peterlimited2000@gmail.com
--   - my_admin_count: 1
--   - function_says_admin: true  ← This should be TRUE now
--
-- Test 4 (user_footprints):
--   - total_users_in_footprints: should show a number > 0
--
-- ============================================================================

-- Optional: If you want to see all admin users in the system
SELECT 
  ar.user_id,
  ar.role,
  ar.created_at,
  u.email
FROM admin_roles ar
LEFT JOIN auth.users u ON u.id = ar.user_id
ORDER BY ar.created_at;