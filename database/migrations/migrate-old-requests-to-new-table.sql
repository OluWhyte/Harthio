-- ============================================================================
-- MIGRATION: Move old JSONB requests to new join_requests table
-- ============================================================================
-- This script migrates existing join requests from the old topics.requests
-- JSONB field to the new dedicated join_requests table.
--
-- IMPORTANT: Run this AFTER deploying the new code changes
-- ============================================================================

-- Step 1: Migrate existing requests from JSONB to join_requests table
INSERT INTO public.join_requests (topic_id, requester_id, requester_name, message, created_at, status)
SELECT 
    t.id as topic_id,
    (req->>'requesterId')::uuid as requester_id,
    req->>'requesterName' as requester_name,
    COALESCE(req->>'message', '') as message,
    COALESCE((req->>'timestamp')::timestamptz, NOW()) as created_at,
    'pending' as status
FROM 
    public.topics t,
    jsonb_array_elements(t.requests) as req
WHERE 
    t.requests IS NOT NULL 
    AND jsonb_array_length(t.requests) > 0
    -- Only migrate if the requester is not already a participant
    AND NOT ((req->>'requesterId')::uuid = ANY(t.participants))
    -- Only migrate if the requester is not the author
    AND (req->>'requesterId')::uuid != t.author_id
ON CONFLICT (topic_id, requester_id) DO NOTHING;

-- Step 2: Verify migration
SELECT 
    COUNT(*) as migrated_requests,
    COUNT(DISTINCT topic_id) as topics_with_requests,
    COUNT(DISTINCT requester_id) as unique_requesters
FROM public.join_requests
WHERE status = 'pending';

-- Step 3: Show sample of migrated data
SELECT 
    jr.id,
    jr.topic_id,
    jr.requester_name,
    t.title as session_title,
    jr.created_at,
    jr.status
FROM public.join_requests jr
JOIN public.topics t ON t.id = jr.topic_id
WHERE jr.status = 'pending'
ORDER BY jr.created_at DESC
LIMIT 10;

-- Step 4: Optional - Clear old JSONB requests after verifying migration
-- UNCOMMENT ONLY AFTER VERIFYING THE MIGRATION WAS SUCCESSFUL
-- UPDATE public.topics 
-- SET requests = '[]'::jsonb 
-- WHERE requests IS NOT NULL 
-- AND jsonb_array_length(requests) > 0;

-- Step 5: Verify old requests are cleared (if you ran step 4)
-- SELECT 
--     COUNT(*) as topics_with_old_requests
-- FROM public.topics
-- WHERE requests IS NOT NULL 
-- AND jsonb_array_length(requests) > 0;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check for any data inconsistencies
SELECT 
    'Requests where requester is author' as issue,
    COUNT(*) as count
FROM public.join_requests jr
JOIN public.topics t ON t.id = jr.topic_id
WHERE jr.requester_id = t.author_id

UNION ALL

SELECT 
    'Requests where requester is already participant' as issue,
    COUNT(*) as count
FROM public.join_requests jr
JOIN public.topics t ON t.id = jr.topic_id
WHERE jr.requester_id = ANY(t.participants)

UNION ALL

SELECT 
    'Pending requests for past sessions' as issue,
    COUNT(*) as count
FROM public.join_requests jr
JOIN public.topics t ON t.id = jr.topic_id
WHERE jr.status = 'pending'
AND t.end_time < NOW();

-- ============================================================================
-- CLEANUP (Optional)
-- ============================================================================

-- Clean up any invalid requests (run after reviewing the verification queries)
-- UNCOMMENT ONLY IF YOU WANT TO CLEAN UP INVALID DATA

-- Delete requests where requester is the author
-- DELETE FROM public.join_requests jr
-- USING public.topics t
-- WHERE jr.topic_id = t.id
-- AND jr.requester_id = t.author_id;

-- Delete requests where requester is already a participant
-- DELETE FROM public.join_requests jr
-- USING public.topics t
-- WHERE jr.topic_id = t.id
-- AND jr.requester_id = ANY(t.participants);

-- Auto-reject requests for past sessions
-- UPDATE public.join_requests jr
-- SET status = 'rejected', updated_at = NOW()
-- FROM public.topics t
-- WHERE jr.topic_id = t.id
-- AND jr.status = 'pending'
-- AND t.end_time < NOW();

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

-- If you need to rollback the migration, you can restore the old JSONB data:
-- WARNING: This will overwrite any new requests created after migration

-- Step 1: Backup current join_requests to a temp table
-- CREATE TEMP TABLE join_requests_backup AS
-- SELECT * FROM public.join_requests;

-- Step 2: Restore JSONB from join_requests (if you cleared it)
-- UPDATE public.topics t
-- SET requests = (
--     SELECT jsonb_agg(
--         jsonb_build_object(
--             'requesterId', jr.requester_id::text,
--             'requesterName', jr.requester_name,
--             'message', jr.message,
--             'timestamp', jr.created_at::text
--         )
--     )
--     FROM public.join_requests jr
--     WHERE jr.topic_id = t.id
--     AND jr.status = 'pending'
-- )
-- WHERE EXISTS (
--     SELECT 1 FROM public.join_requests jr
--     WHERE jr.topic_id = t.id
--     AND jr.status = 'pending'
-- );

-- ============================================================================
-- POST-MIGRATION MONITORING
-- ============================================================================

-- Monitor new requests being created
-- Run this periodically to ensure new requests are being added correctly
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as requests_created,
    COUNT(DISTINCT topic_id) as unique_sessions,
    COUNT(DISTINCT requester_id) as unique_users
FROM public.join_requests
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Check for any errors or anomalies
SELECT 
    jr.status,
    COUNT(*) as count,
    COUNT(DISTINCT topic_id) as unique_sessions
FROM public.join_requests jr
GROUP BY jr.status
ORDER BY jr.status;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. This migration is SAFE to run multiple times (uses ON CONFLICT DO NOTHING)
-- 2. The migration does NOT delete old JSONB data by default
-- 3. You can keep both old and new data during transition period
-- 4. After verifying everything works, you can clear old JSONB data (Step 4)
-- 5. The new system will ONLY use the join_requests table going forward
-- 
-- ============================================================================
