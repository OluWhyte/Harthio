-- Apply essential performance indexes for topic-to-session flow
-- These indexes will significantly improve query performance

-- Index for author-based queries (most common pattern)
CREATE INDEX IF NOT EXISTS idx_topics_author_id_start_time 
ON topics(author_id, start_time);

-- Index for participant-based queries using GIN for JSONB arrays
CREATE INDEX IF NOT EXISTS idx_topics_participants_gin 
ON topics USING GIN(participants);

-- Index for time-based filtering (active/upcoming sessions)
CREATE INDEX IF NOT EXISTS idx_topics_time_range 
ON topics(start_time, end_time);

-- Index for topics with requests (for request management)
CREATE INDEX IF NOT EXISTS idx_topics_with_requests 
ON topics(author_id) 
WHERE requests IS NOT NULL AND requests != '[]'::jsonb;

-- Index for user profile lookups
CREATE INDEX IF NOT EXISTS idx_users_display_name 
ON users(display_name);

-- Update table statistics for better query planning
ANALYZE topics;
ANALYZE users;