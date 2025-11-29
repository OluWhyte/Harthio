-- ============================================================================
-- SESSION ARCHIVE SYSTEM MIGRATION
-- ============================================================================
-- Creates the complete session archiving system from production
-- This keeps the timeline fast by moving old/expired sessions to archive
-- 
-- IMPORTANT: This migration is SAFE to run multiple times (idempotent)
-- It checks for existence before creating objects
-- ============================================================================

-- ============================================================================
-- 1. CREATE topics_archive TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS topics_archive (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    participants UUID[] DEFAULT '{}',
    requests JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    archive_reason TEXT
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_topics_archive_archived_at 
    ON topics_archive(archived_at);

CREATE INDEX IF NOT EXISTS idx_topics_archive_author 
    ON topics_archive(author_id);

CREATE INDEX IF NOT EXISTS idx_topics_archive_participants 
    ON topics_archive USING GIN(participants);

-- ============================================================================
-- 3. ENABLE RLS ON topics_archive
-- ============================================================================

ALTER TABLE topics_archive ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "System can insert into archive" ON topics_archive;
DROP POLICY IF EXISTS "Users can view their archived sessions" ON topics_archive;
DROP POLICY IF EXISTS "Users can view archived sessions they participated in" ON topics_archive;

-- Allow system to insert (for archiving function)
CREATE POLICY "System can insert into archive"
    ON topics_archive
    FOR INSERT
    WITH CHECK (true);

-- Users can view their own archived sessions
CREATE POLICY "Users can view their archived sessions"
    ON topics_archive
    FOR SELECT
    USING (auth.uid() = author_id);

-- Users can view archived sessions they participated in
CREATE POLICY "Users can view archived sessions they participated in"
    ON topics_archive
    FOR SELECT
    USING (auth.uid() = ANY(participants));

-- ============================================================================
-- 5. CREATE ARCHIVING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_expired_sessions()
RETURNS TABLE(expired_count INTEGER, no_participant_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_no_participant_count INTEGER := 0;
BEGIN
  -- Archive sessions that ended more than 1 hour ago
  WITH expired_archived AS (
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
  expired_deleted AS (
    DELETE FROM topics
    WHERE id IN (SELECT id FROM expired_archived)
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_expired_count FROM expired_deleted;
  
  -- Archive sessions that reached start time WITHOUT approved participants
  -- These sessions can't proceed and should be removed from timeline
  -- IMPORTANT: Clear pending requests to prevent author from approving past sessions
  -- But keep session in archive for history page
  WITH no_participant_archived AS (
    INSERT INTO topics_archive (
      id, title, description, author_id, start_time, end_time,
      participants, requests, created_at, archived_at, archive_reason
    )
    SELECT 
      id, title, description, author_id, start_time, end_time,
      participants, 
      '[]'::jsonb, -- Clear requests - prevents approving past sessions
      created_at, NOW(), 'no_participants'
    FROM topics
    WHERE start_time <= NOW()
      AND (participants IS NULL OR array_length(participants, 1) IS NULL OR array_length(participants, 1) = 0)
    RETURNING id
  ),
  no_participant_deleted AS (
    DELETE FROM topics
    WHERE id IN (SELECT id FROM no_participant_archived)
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_no_participant_count FROM no_participant_deleted;
  
  -- Log the archival
  RAISE NOTICE 'Archived % expired sessions and % sessions without participants', 
    v_expired_count, v_no_participant_count;
  
  RETURN QUERY SELECT v_expired_count, v_no_participant_count;
END;
$$;

-- ============================================================================
-- 6. CREATE MANUAL ARCHIVE FUNCTION (for admin use)
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_session(
    p_topic_id UUID,
    p_reason TEXT DEFAULT 'manual'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- ============================================================================
-- 7. CREATE BACKUP TRIGGER (safety net for deletions)
-- ============================================================================

-- Create deletion log table if it doesn't exist
CREATE TABLE IF NOT EXISTS topics_deleted_log (
    id UUID PRIMARY KEY,
    title TEXT,
    author_id UUID,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    participants UUID[],
    requests JSONB,
    created_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on topics_deleted_log
ALTER TABLE topics_deleted_log ENABLE ROW LEVEL SECURITY;

-- Allow trigger function to insert (system-level operation)
DROP POLICY IF EXISTS "System can log deletions" ON topics_deleted_log;
CREATE POLICY "System can log deletions"
    ON topics_deleted_log
    FOR INSERT
    WITH CHECK (true);

-- Allow users to view their own deleted topics
DROP POLICY IF EXISTS "Users can view their deleted topics" ON topics_deleted_log;
CREATE POLICY "Users can view their deleted topics"
    ON topics_deleted_log
    FOR SELECT
    USING (auth.uid() = author_id);

-- Create trigger function
CREATE OR REPLACE FUNCTION backup_topic_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO topics_deleted_log (
        id, title, author_id, start_time, end_time, 
        participants, requests, created_at, deleted_at
    ) VALUES (
        OLD.id, OLD.title, OLD.author_id, OLD.start_time, OLD.end_time,
        OLD.participants, OLD.requests, OLD.created_at, NOW()
    );
    RETURN OLD;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS log_topic_deletion ON topics;
CREATE TRIGGER log_topic_deletion
    BEFORE DELETE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION backup_topic_before_delete();

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION archive_expired_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION archive_session(UUID, TEXT) TO authenticated;

-- ============================================================================
-- NOTES FOR pg_cron SETUP (Manual Step)
-- ============================================================================
-- 
-- To enable automatic archiving every 5 minutes, run this in Supabase SQL Editor:
-- 
-- SELECT cron.schedule(
--     'archive-expired-sessions',
--     '*/5 * * * *',
--     $$SELECT archive_expired_sessions();$$
-- );
--
-- To check if the job is running:
-- SELECT * FROM cron.job WHERE jobname = 'archive-expired-sessions';
--
-- To unschedule (if needed):
-- SELECT cron.unschedule('archive-expired-sessions');
--
-- ============================================================================

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if table exists
SELECT 'topics_archive table created' as status
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'topics_archive'
);

-- Check if indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'topics_archive';

-- Check if policies exist
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'topics_archive';

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('archive_expired_sessions', 'archive_session', 'backup_topic_before_delete');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
