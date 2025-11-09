-- ============================================================================
-- DIAGNOSE: Messages Table RLS Status
-- ============================================================================
-- This script only READS information - it doesn't change anything
-- Run this first to understand what's currently configured

-- Check 1: Does the messages table exist and is RLS enabled?
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  'Messages table found' as status
FROM pg_tables 
WHERE tablename = 'messages' AND schemaname = 'public';

-- Check 2: What RLS policies currently exist on messages table?
SELECT 
  policyname as policy_name,
  cmd as command_type,
  permissive,
  roles,
  qual as using_condition,
  with_check as with_check_condition,
  'Current policy' as status
FROM pg_policies 
WHERE tablename = 'messages' AND schemaname = 'public';

-- Check 3: What's the structure of the messages table?
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  'Table structure' as status
FROM information_schema.columns 
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 4: What's my current user info?
SELECT 
  auth.uid() as my_user_id,
  auth.role() as my_role,
  'My auth info' as status;

-- Check 5: Am I part of any topics?
SELECT 
  t.id as topic_id,
  t.title,
  t.author_id,
  t.participants,
  CASE 
    WHEN t.author_id = auth.uid() THEN 'I am author'
    WHEN auth.uid() = ANY(t.participants) THEN 'I am participant'
    ELSE 'Not my topic'
  END as my_relationship,
  'My topics' as status
FROM topics t
WHERE t.author_id = auth.uid() OR auth.uid() = ANY(t.participants)
LIMIT 5;

-- ============================================================================
-- WHAT THIS TELLS US:
-- ============================================================================
-- 1. If messages table exists and RLS status
-- 2. What policies are currently blocking inserts
-- 3. Table structure to ensure we're using right column names
-- 4. Your user ID and role
-- 5. Which topics you can access
-- 
-- This is 100% SAFE - it only reads data, doesn't change anything
-- ============================================================================