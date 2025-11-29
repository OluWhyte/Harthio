-- Check if profiles table exists and get its structure
-- Run this in Supabase SQL Editor to find the correct table name

-- 1. List all tables with 'profile' in the name
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name LIKE '%profile%'
  AND table_schema = 'public'
ORDER BY table_name;

-- 2. If profiles table exists, show its columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check for is_admin column specifically
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'is_admin';
