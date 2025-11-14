-- Comprehensive Security Audit
-- Run this to verify all security measures are in place

-- 1. Check RLS is enabled on all public tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check messages table policies (should have exactly 4 policies)
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN with_check IS NOT NULL THEN 'INSERT/UPDATE'
    WHEN qual IS NOT NULL THEN 'SELECT/DELETE'
  END as policy_type
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY cmd, policyname;

-- 3. Check topics table policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'topics'
ORDER BY cmd, policyname;

-- 4. Check users table policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- 5. Check notifications table policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- 6. Check admin views permissions (should only be service_role)
SELECT 
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name IN ('device_analytics', 'security_dashboard', 'user_footprints', 'user_management_view')
ORDER BY table_name, grantee;

-- 7. Check for tables without RLS (security risk)
SELECT 
  tablename,
  'WARNING: RLS not enabled!' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- 8. Check RPC functions security
SELECT 
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'add_join_request',
    'approve_join_request', 
    'reject_join_request',
    'cancel_join_request'
  )
ORDER BY routine_name;
