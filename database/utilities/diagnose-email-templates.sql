-- ============================================================================
-- DIAGNOSE EMAIL TEMPLATES ISSUE
-- ============================================================================
-- Run these queries to find out what's wrong

-- 1. Check if templates exist in database
SELECT 
  'Templates in database' as check_name,
  COUNT(*) as count
FROM email_templates;

-- 2. Check if RLS is enabled
SELECT 
  'RLS Status' as check_name,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'email_templates';

-- 3. Check existing RLS policies
SELECT 
  'RLS Policies' as check_name,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'email_templates';

-- 4. Check if you're an admin
SELECT 
  'Your Admin Status' as check_name,
  user_id,
  role,
  is_active,
  created_at
FROM admin_roles
WHERE user_id = auth.uid();

-- 5. Try to select templates directly (bypass RLS temporarily)
SET LOCAL row_security = off;
SELECT 
  'Templates (RLS OFF)' as check_name,
  id,
  name,
  category
FROM email_templates;
SET LOCAL row_security = on;

-- 6. Try to select templates with RLS (what the app sees)
SELECT 
  'Templates (RLS ON)' as check_name,
  id,
  name,
  category
FROM email_templates;

-- 7. Check if email_templates table has correct structure
SELECT 
  'Table Structure' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'email_templates'
ORDER BY ordinal_position;
