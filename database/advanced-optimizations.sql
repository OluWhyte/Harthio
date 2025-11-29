-- Advanced Database Optimizations - Phase 3
-- Based on actual Harthio database schema

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Get available sessions with creator info
CREATE OR REPLACE FUNCTION get_available_sessions(p_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  creator_name TEXT,
  creator_email TEXT,
  participant_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.start_time,
    t.end_time,
    COALESCE(u.display_name, CONCAT(u.first_name, ' ', u.last_name), u.email) as creator_name,
    u.email as creator_email,
    COALESCE(array_length(t.participants, 1), 0) as participant_count
  FROM topics t
  JOIN users u ON u.id = t.author_id
  WHERE t.start_time >= NOW()
  ORDER BY t.start_time ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FULL TEXT SEARCH
-- ============================================

ALTER TABLE topics ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION topics_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS topics_search_vector_trigger ON topics;
CREATE TRIGGER topics_search_vector_trigger
BEFORE INSERT OR UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION topics_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_topics_search_vector ON topics USING GIN(search_vector);

UPDATE topics SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE search_vector IS NULL;

-- ============================================
-- AUTOVACUUM SETTINGS
-- ============================================

ALTER TABLE topics SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE messages SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE notifications SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- ============================================
-- MAINTENANCE FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION analyze_all_tables()
RETURNS void AS $$
BEGIN
  ANALYZE topics;
  ANALYZE users;
  ANALYZE messages;
  ANALYZE ratings;
  ANALYZE notifications;
  ANALYZE join_requests;
  ANALYZE sobriety_trackers;
  ANALYZE ai_chat_history;
  ANALYZE ai_usage;
  ANALYZE daily_checkins;
END;
$$ LANGUAGE plpgsql;
