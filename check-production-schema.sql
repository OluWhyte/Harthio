-- Run this in PRODUCTION Supabase to check schema
-- Compare with dev to see what's missing

-- 1. Check if sobriety_trackers table exists and its columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sobriety_trackers'
ORDER BY ordinal_position;

-- 2. Check RLS policies on sobriety_trackers
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'sobriety_trackers';

-- 3. Check if table has RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'sobriety_trackers';
