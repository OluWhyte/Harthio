-- Add room management columns to topics table
-- This ensures every session has a pre-created, persistent room

-- Add room management columns
ALTER TABLE topics ADD COLUMN IF NOT EXISTS daily_room_url TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS daily_room_name TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS room_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS room_status TEXT DEFAULT 'pending' CHECK (room_status IN ('pending', 'created', 'active', 'failed', 'fallback'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_daily_room_name ON topics(daily_room_name);
CREATE INDEX IF NOT EXISTS idx_topics_room_status ON topics(room_status);

-- Add comments for clarity
COMMENT ON COLUMN topics.daily_room_url IS 'Pre-created Daily.co room URL for this session';
COMMENT ON COLUMN topics.daily_room_name IS 'Daily.co room name (derived from session ID)';
COMMENT ON COLUMN topics.room_created_at IS 'When the Daily.co room was created';
COMMENT ON COLUMN topics.room_status IS 'Current status of the room (pending, created, active, failed, fallback)';