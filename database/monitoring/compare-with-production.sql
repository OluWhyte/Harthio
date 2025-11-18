-- Compare Dev Database with Production
-- Run this in your DEV database to see what's different

-- ============================================================================
-- 1. Check if join_requests table exists (PRODUCTION HAS THIS)
-- ============================================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'join_requests'
        ) 
        THEN '✅ join_requests table EXISTS'
        ELSE '❌ join_requests table MISSING - This is the problem!'
    END as join_requests_table_status;

-- ============================================================================
-- 2. Check topics table structure
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'topics'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. Check if RPC functions exist
-- ============================================================================
SELECT 
    routine_name,
    CASE 
        WHEN routine_name = 'add_join_request' THEN '✅ Base function'
        WHEN routine_name = 'add_join_request_secure' THEN '✅ Secure wrapper'
        WHEN routine_name = 'approve_join_request' THEN '✅ Approve function'
        WHEN routine_name = 'reject_join_request' THEN '✅ Reject function'
        ELSE '⚠️ Unknown function'
    END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%join_request%'
ORDER BY routine_name;

-- ============================================================================
-- 4. Check if updated_at column exists in topics
-- ============================================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'topics' 
            AND column_name = 'updated_at'
        ) 
        THEN '✅ updated_at column EXISTS in topics'
        ELSE '❌ updated_at column MISSING in topics'
    END as updated_at_status;

-- ============================================================================
-- 5. Check RLS policies on join_requests (if table exists)
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'join_requests'
ORDER BY policyname;

-- ============================================================================
-- SUMMARY: What should exist in PRODUCTION
-- ============================================================================
/*
PRODUCTION DATABASE SHOULD HAVE:
✅ join_requests table (separate table, not JSONB in topics)
✅ topics.updated_at column
✅ add_join_request() function
✅ add_join_request_secure() function
✅ approve_join_request() function
✅ reject_join_request() function
✅ RLS policies on join_requests table

IF ANY ARE MISSING:
- Run database/migrations/combined.sql (creates join_requests table)
- Run database/migrations/fix-topics-and-rpc.sql (adds updated_at and secure function)
*/
