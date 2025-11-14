-- ============================================================================
-- HEALTH CHECK QUERIES FOR JOIN REQUESTS SYSTEM
-- ============================================================================
-- Run these queries regularly to monitor system health
-- ============================================================================

-- 1. DAILY HEALTH CHECK
-- Run this every day to ensure system is working
SELECT 
    'DAILY HEALTH CHECK' as check_name,
    CURRENT_DATE as check_date,
    (SELECT COUNT(*) FROM join_requests WHERE created_at > CURRENT_DATE) as requests_today,
    (SELECT COUNT(*) FROM join_requests WHERE status = 'pending') as pending_requests,
    (SELECT COUNT(*) FROM topics WHERE jsonb_array_length(requests) > 0) as old_jsonb_requests,
    CASE 
        WHEN (SELECT COUNT(*) FROM topics WHERE jsonb_array_length(requests) > 0) > 0 
        THEN '⚠️ WARNING: Old JSONB requests found'
        WHEN (SELECT COUNT(*) FROM join_requests WHERE created_at > CURRENT_DATE) = 0
        THEN '⚠️ WARNING: No requests created today'
        ELSE '✅ HEALTHY'
    END as status;

-- 2. REQUEST FLOW MONITORING
-- Check if requests are being created and processed
SELECT 
    'REQUEST FLOW' as check_name,
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as requests_created,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as still_pending,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM join_requests
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- 3. ORPHANED DATA CHECK
-- Check for data inconsistencies
SELECT 
    'ORPHANED DATA CHECK' as check_name,
    (
        SELECT COUNT(*) 
        FROM join_requests jr 
        WHERE NOT EXISTS (SELECT 1 FROM topics t WHERE t.id = jr.topic_id)
    ) as requests_with_deleted_topics,
    (
        SELECT COUNT(*) 
        FROM join_requests jr 
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = jr.requester_id)
    ) as requests_with_deleted_users,
    (
        SELECT COUNT(*) 
        FROM join_requests jr
        JOIN topics t ON t.id = jr.topic_id
        WHERE jr.status = 'pending' AND t.end_time < NOW()
    ) as pending_requests_for_past_sessions;

-- 4. EMAIL VS DATABASE CONSISTENCY CHECK
-- This helps identify if emails are being sent but requests not saved
-- (You'd need to track email sends separately for this to work fully)
SELECT 
    'CONSISTENCY CHECK' as check_name,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as requests_last_hour,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as requests_last_24h,
    CASE 
        WHEN COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) = 0
        THEN '⚠️ No requests in last hour - check if system is working'
        ELSE '✅ System active'
    END as status
FROM join_requests;

-- 5. RPC FUNCTION HEALTH CHECK
-- Verify RPC functions exist and are accessible
SELECT 
    'RPC FUNCTIONS CHECK' as check_name,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name IN ('add_join_request', 'approve_join_request', 'reject_join_request')
        THEN '✅ Function exists'
        ELSE '❌ Unexpected function'
    END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%join_request%'
ORDER BY routine_name;

-- 6. PERFORMANCE CHECK
-- Check for slow queries or issues
SELECT 
    'PERFORMANCE CHECK' as check_name,
    COUNT(*) as total_requests,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_seconds_to_action,
    MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_seconds_to_action,
    COUNT(CASE WHEN status = 'pending' AND created_at < NOW() - INTERVAL '24 hours' THEN 1 END) as stale_pending_requests
FROM join_requests
WHERE updated_at > created_at;

-- 7. USER EXPERIENCE CHECK
-- Check if users are experiencing issues
SELECT 
    'USER EXPERIENCE CHECK' as check_name,
    COUNT(DISTINCT jr.requester_id) as unique_requesters_today,
    COUNT(DISTINCT t.author_id) as unique_session_authors_today,
    COUNT(*) as total_requests_today,
    ROUND(
        COUNT(CASE WHEN jr.status = 'approved' THEN 1 END)::numeric / 
        NULLIF(COUNT(CASE WHEN jr.status IN ('approved', 'rejected') THEN 1 END), 0) * 100, 
        2
    ) as approval_rate_percent
FROM join_requests jr
JOIN topics t ON t.id = jr.topic_id
WHERE jr.created_at > CURRENT_DATE;

-- ============================================================================
-- ALERT THRESHOLDS
-- ============================================================================
-- Set up alerts if:
-- 1. old_jsonb_requests > 0 (data in wrong place)
-- 2. requests_today = 0 (system not working)
-- 3. stale_pending_requests > 10 (users not responding)
-- 4. orphaned data > 0 (data integrity issues)
-- ============================================================================

-- COMBINED ALERT QUERY
-- Run this and alert if any warnings found
SELECT 
    'ALERT SUMMARY' as alert_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM topics WHERE jsonb_array_length(requests) > 0) > 0
        THEN '🚨 CRITICAL: Old JSONB requests found - run migration'
        WHEN (SELECT COUNT(*) FROM join_requests WHERE created_at > NOW() - INTERVAL '2 hours') = 0
        THEN '⚠️ WARNING: No requests in last 2 hours'
        WHEN (SELECT COUNT(*) FROM join_requests WHERE status = 'pending' AND created_at < NOW() - INTERVAL '48 hours') > 5
        THEN '⚠️ WARNING: Many stale pending requests'
        ELSE '✅ ALL SYSTEMS NORMAL'
    END as status,
    NOW() as checked_at;
