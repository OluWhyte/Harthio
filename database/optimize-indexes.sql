-- ============================================================================
-- DATABASE INDEX OPTIMIZATIONS
-- ============================================================================
-- Performance optimizations for the topic-to-session flow
-- Run this script to add indexes that improve query performance
-- ============================================================================

-- Topics table optimizations
-- ============================================================================

-- Index for author-based queries (getUserTopics, getReceivedRequests)
CREATE INDEX IF NOT EXISTS idx_topics_author_id_start_time 
ON topics(author_id, start_time);

-- Index for participant-based queries (getParticipantTopics)
CREATE INDEX IF NOT EXISTS idx_topics_participants_gin 
ON topics USING GIN(participants);

-- Index for request-based queries (getSentRequests)
CREATE INDEX IF NOT EXISTS idx_topics_requests_gin 
ON topics USING GIN(requests);

-- Composite index for time-based filtering with author
CREATE INDEX IF NOT EXISTS idx_topics_author_time_range 
ON topics(author_id, start_time, end_time);

-- Index for active session queries (start_time <= now <= end_time)
CREATE INDEX IF NOT EXISTS idx_topics_active_sessions 
ON topics(start_time, end_time) 
WHERE start_time <= NOW() AND end_time >= NOW();

-- Index for upcoming sessions
CREATE INDEX IF NOT EXISTS idx_topics_upcoming_sessions 
ON topics(start_time) 
WHERE start_time > NOW();

-- Users table optimizations
-- ============================================================================

-- Index for user profile lookups (already exists but ensure it's optimal)
CREATE INDEX IF NOT EXISTS idx_users_id_display_name 
ON users(id, display_name);

-- Index for user search by display name
CREATE INDEX IF NOT EXISTS idx_users_display_name_trgm 
ON users USING GIN(display_name gin_trgm_ops);

-- Partial indexes for better performance
-- ============================================================================

-- Index only topics with requests (for request-related queries)
CREATE INDEX IF NOT EXISTS idx_topics_with_requests 
ON topics(author_id, start_time) 
WHERE requests IS NOT NULL AND requests != '[]'::jsonb;

-- Index only topics with participants (for session-ready queries)
CREATE INDEX IF NOT EXISTS idx_topics_with_participants 
ON topics(start_time, end_time) 
WHERE participants IS NOT NULL AND jsonb_array_length(participants) > 0;

-- Index for topics that need cleanup (ended or insufficient participants)
CREATE INDEX IF NOT EXISTS idx_topics_cleanup_candidates 
ON topics(end_time, start_time) 
WHERE end_time < NOW() OR (start_time < NOW() - INTERVAL '5 minutes' AND (participants IS NULL OR jsonb_array_length(participants) = 0));

-- JSONB-specific optimizations
-- ============================================================================

-- Index for finding topics where a specific user has sent a request
CREATE INDEX IF NOT EXISTS idx_topics_requests_requester_id 
ON topics USING GIN((requests -> 'requesterId'));

-- Index for finding topics where a specific user is a participant
CREATE INDEX IF NOT EXISTS idx_topics_participants_contains 
ON topics USING GIN(participants jsonb_path_ops);

-- Performance statistics and monitoring
-- ============================================================================

-- Enable query statistics collection (if not already enabled)
-- This helps monitor query performance
SELECT pg_stat_statements_reset(); -- Reset statistics

-- Create a view for monitoring slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100 -- Queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- Analyze tables to update statistics
-- ============================================================================

ANALYZE topics;
ANALYZE users;

-- Vacuum tables to reclaim space and update statistics
-- ============================================================================

VACUUM ANALYZE topics;
VACUUM ANALYZE users;

-- Performance monitoring queries
-- ============================================================================

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
ORDER BY idx_scan DESC;

-- Check table statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public';

-- Recommendations for further optimization
-- ============================================================================

-- 1. Consider partitioning the topics table by date if it grows very large
-- 2. Implement connection pooling (PgBouncer) for better connection management
-- 3. Monitor query performance regularly using pg_stat_statements
-- 4. Consider read replicas for read-heavy workloads
-- 5. Implement proper caching at the application level (already done)

-- Notes:
-- ============================================================================
-- - These indexes are designed to optimize the most common query patterns
-- - Monitor index usage and drop unused indexes to save space
-- - Consider the trade-off between query performance and write performance
-- - Update statistics regularly with ANALYZE for optimal query planning