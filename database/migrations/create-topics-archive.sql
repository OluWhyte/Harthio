-- Create archive table for completed/expired sessions
-- This keeps the main topics table fast while preserving history

-- Create topics_archive table with same structure as topics
CREATE TABLE IF NOT EXISTS topics_archive (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  participants UUID[] DEFAULT '{}',
  requests JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  archive_reason TEXT -- 'expired', 'completed', 'cancelled'
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_topics_archive_author ON topics_archive(author_id);
CREATE INDEX IF NOT EXISTS idx_topics_archive_archived_at ON topics_archive(archived_at);
CREATE INDEX IF NOT EXISTS idx_topics_archive_participants ON topics_archive USING GIN(participants);

-- RLS policies for archive table
ALTER TABLE topics_archive ENABLE ROW LEVEL SECURITY;

-- Users can view archived sessions they authored
CREATE POLICY "Users can view their archived sessions"
ON topics_archive
FOR SELECT
USING (auth.uid() = author_id);

-- Users can view archived sessions they participated in
CREATE POLICY "Users can view archived sessions they participated in"
ON topics_archive
FOR SELECT
USING (auth.uid() = ANY(participants));

-- Only system can insert into archive (via function)
CREATE POLICY "System can insert into archive"
ON topics_archive
FOR INSERT
WITH CHECK (true);

-- Create function to archive expired sessions
CREATE OR REPLACE FUNCTION archive_expired_sessions()
RETURNS TABLE(archived_count INTEGER) AS $$
DECLARE
  v_archived_count INTEGER := 0;
BEGIN
  -- Move sessions that ended more than 1 hour ago to archive
  WITH archived AS (
    INSERT INTO topics_archive (
      id, title, description, author_id, start_time, end_time,
      participants, requests, created_at, archived_at, archive_reason
    )
    SELECT 
      id, title, description, author_id, start_time, end_time,
      participants, requests, created_at, NOW(), 'expired'
    FROM topics
    WHERE end_time < (NOW() - INTERVAL '1 hour')
    RETURNING id
  ),
  deleted AS (
    DELETE FROM topics
    WHERE id IN (SELECT id FROM archived)
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_archived_count FROM deleted;
  
  -- Log the archival
  RAISE NOTICE 'Archived % expired sessions', v_archived_count;
  
  RETURN QUERY SELECT v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to manually archive a session (for cancellations)
CREATE OR REPLACE FUNCTION archive_session(
  p_topic_id UUID,
  p_reason TEXT DEFAULT 'cancelled'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN := false;
BEGIN
  -- Move session to archive
  INSERT INTO topics_archive (
    id, title, description, author_id, start_time, end_time,
    participants, requests, created_at, archived_at, archive_reason
  )
  SELECT 
    id, title, description, author_id, start_time, end_time,
    participants, requests, created_at, NOW(), p_reason
  FROM topics
  WHERE id = p_topic_id;
  
  -- Delete from active topics
  DELETE FROM topics WHERE id = p_topic_id;
  
  v_success := FOUND;
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up pg_cron job to run every hour
-- Note: pg_cron extension must be enabled in Supabase dashboard first
SELECT cron.schedule(
  'archive-expired-sessions',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT archive_expired_sessions();$$
);

-- Verify the setup
SELECT 
  'Archive table created' as status,
  (SELECT COUNT(*) FROM topics) as active_sessions,
  (SELECT COUNT(*) FROM topics_archive) as archived_sessions;
