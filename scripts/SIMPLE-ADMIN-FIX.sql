-- ============================================================================
-- SIMPLE ADMIN FUNCTION FIX
-- ============================================================================
-- This is a simplified version that avoids type issues
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it

-- Step 1: Drop the user_footprints view first (since it depends on the function)
DROP VIEW IF EXISTS public.user_footprints;

-- Step 2: Drop the existing function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Step 3: Create the improved function
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

-- Step 4: Grant proper permissions
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;

-- Step 5: Recreate the user_footprints view with the fixed function
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

-- ============================================================================
-- SIMPLE TESTS (no complex functions that might have type issues)
-- ============================================================================

-- Test 1: Test the is_admin_user function directly
SELECT public.is_admin_user() as am_i_admin;

-- Test 2: Verify your admin status manually
SELECT 
  auth.uid() as my_user_id,
  (SELECT COUNT(*) FROM admin_roles WHERE user_id = auth.uid()) as my_admin_count;

-- Test 3: Test the user_footprints view
SELECT COUNT(*) as total_users_in_footprints FROM user_footprints;

-- Test 4: Check if you can see specific user data
SELECT engagement_level 
FROM user_footprints 
WHERE user_id = '3fe8c7ea-15ce-4149-a435-c738ffbecaff'
LIMIT 1;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Test 1: am_i_admin should be TRUE
-- Test 2: my_admin_count should be 1 (or more)
-- Test 3: total_users_in_footprints should be > 0
-- Test 4: should return an engagement_level (High/Medium/Low)
-- ============================================================================