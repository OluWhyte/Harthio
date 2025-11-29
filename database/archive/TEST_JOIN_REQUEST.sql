-- Test Join Request Functionality
-- Run this in your DEV database to verify everything works

-- ============================================================================
-- STEP 1: Verify join_requests table exists
-- ============================================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'join_requests'
        ) 
        THEN '✅ join_requests table EXISTS'
        ELSE '❌ join_requests table MISSING'
    END as table_status;

-- ============================================================================
-- STEP 2: Check all required functions exist
-- ============================================================================
SELECT 
    routine_name,
    '✅ Function exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'add_join_request',
    'add_join_request_secure',
    'approve_join_request',
    'reject_join_request'
)
ORDER BY routine_name;

-- Expected output: 4 functions

-- ============================================================================
-- STEP 3: Check topics table has updated_at column
-- ============================================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'topics' 
            AND column_name = 'updated_at'
        ) 
        THEN '✅ topics.updated_at EXISTS'
        ELSE '❌ topics.updated_at MISSING'
    END as updated_at_status;

-- ============================================================================
-- STEP 4: View current join_requests (if any)
-- ============================================================================
SELECT 
    jr.id,
    jr.topic_id,
    jr.requester_name,
    jr.status,
    jr.created_at,
    t.title as session_title
FROM public.join_requests jr
LEFT JOIN public.topics t ON t.id = jr.topic_id
ORDER BY jr.created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 5: Check RLS policies on join_requests
-- ============================================================================
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname LIKE '%author%' THEN '✅ For topic authors'
        WHEN policyname LIKE '%own%' THEN '✅ For requesters'
        ELSE '✅ Policy exists'
    END as description
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'join_requests'
ORDER BY policyname;

-- Expected: 6 policies

-- ============================================================================
-- STEP 6: Test the add_join_request_secure function (MANUAL TEST)
-- ============================================================================
-- IMPORTANT: Replace these UUIDs with real values from your database
-- 
-- To get a real topic_id:
-- SELECT id, title FROM public.topics LIMIT 1;
--
-- To get your user_id:
-- SELECT auth.uid();
--
-- Then run:
-- SELECT add_join_request_secure(
--     'YOUR_TOPIC_ID'::uuid,
--     'YOUR_USER_ID'::uuid,
--     'Your Name',
--     'Test message'
-- );

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- If all checks pass (✅), your database is ready!
-- 
-- Expected results:
-- ✅ join_requests table exists
-- ✅ 4 functions exist (add, add_secure, approve, reject)
-- ✅ topics.updated_at column exists
-- ✅ 6 RLS policies on join_requests
-- 
-- If anything is ❌, run the missing migration:
-- - Missing table: Run combined.sql
-- - Missing updated_at: Run fix-topics-and-rpc.sql
-- - Missing add_join_request_secure: Run fix-topics-and-rpc.sql
-- ============================================================================
