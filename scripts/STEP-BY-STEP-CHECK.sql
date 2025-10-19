-- ============================================================================
-- STEP-BY-STEP DIAGNOSTIC CHECK
-- ============================================================================
-- Run each section ONE AT A TIME to see where the issue is

-- ============================================================================
-- SECTION 1: Basic Auth Check
-- ============================================================================
-- Run this first to see your current authentication status

SELECT 'SECTION 1: Basic Auth Check' as section;

SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- ============================================================================
-- SECTION 2: Admin Roles Check  
-- ============================================================================
-- Run this second to verify you're in the admin_roles table

SELECT 'SECTION 2: Admin Roles Check' as section;

SELECT 
  user_id,
  role,
  created_at
FROM admin_roles 
WHERE user_id = auth.uid();

-- If the above returns no rows, you're not in admin_roles!
-- If it returns a row, you ARE in admin_roles

-- ============================================================================
-- SECTION 3: Function Test
-- ============================================================================
-- Run this third to test the is_admin_user function

SELECT 'SECTION 3: Function Test' as section;

SELECT public.is_admin_user() as function_result;

-- ============================================================================
-- SECTION 4: Manual Admin Check
-- ============================================================================
-- Run this fourth to manually verify admin status

SELECT 'SECTION 4: Manual Admin Check' as section;

SELECT 
  (SELECT COUNT(*) FROM admin_roles WHERE user_id = auth.uid()) as admin_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM admin_roles WHERE user_id = auth.uid()) > 0 
    THEN 'YES - You are an admin'
    ELSE 'NO - You are NOT an admin'
  END as admin_status;

-- ============================================================================
-- SECTION 5: View Test
-- ============================================================================
-- Run this fifth to test the user_footprints view

SELECT 'SECTION 5: View Test' as section;

SELECT COUNT(*) as users_visible_in_view FROM user_footprints;

-- ============================================================================
-- SECTION 6: Specific User Test
-- ============================================================================
-- Run this sixth to test access to your specific user data

SELECT 'SECTION 6: Specific User Test' as section;

SELECT 
  user_id,
  email,
  engagement_level
FROM user_footprints 
WHERE user_id = '3fe8c7ea-15ce-4149-a435-c738ffbecaff';

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. Copy and paste SECTION 1 into SQL Editor and run it
-- 2. Tell me what you see
-- 3. Then copy and paste SECTION 2 and run it
-- 4. Tell me what you see
-- 5. Continue with each section...
-- 
-- This will help us identify exactly where the problem is!
-- ============================================================================