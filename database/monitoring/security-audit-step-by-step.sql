-- SECURITY AUDIT - Run each query separately and share results

-- QUERY 1: Check RLS is enabled on all tables
-- Copy and run this first:
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- QUERY 2: Check messages policies (should be 4 total)
-- Copy and run this second:
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY cmd, policyname;

-- QUERY 3: Check topics policies
-- Copy and run this third:
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'topics'
ORDER BY cmd, policyname;

-- QUERY 4: Check users policies
-- Copy and run this fourth:
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- QUERY 5: Check notifications policies
-- Copy and run this fifth:
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- QUERY 6: Check admin views (should only show service_role)
-- Copy and run this sixth:
SELECT 
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name IN ('device_analytics', 'security_dashboard', 'user_footprints', 'user_management_view')
ORDER BY table_name, grantee;

-- QUERY 7: Find tables WITHOUT RLS (security risks!)
-- Copy and run this seventh:
SELECT 
  tablename,
  'WARNING: RLS not enabled!' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
