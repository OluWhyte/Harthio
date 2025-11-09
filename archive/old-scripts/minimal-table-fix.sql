-- Minimal fix - just create the user_session_states table
-- This should fix the immediate "relation does not exist" error

CREATE TABLE IF NOT EXISTS user_session_states (
  session_id UUID,
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT 'User',
  connection_state TEXT DEFAULT 'connecting',
  current_provider TEXT DEFAULT 'none',
  is_audio_muted BOOLEAN DEFAULT FALSE,
  is_video_off BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reconnect_attempts INTEGER DEFAULT 0,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);

-- Simple RLS setup
ALTER TABLE user_session_states ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "allow_all_user_session_states" ON user_session_states;
  CREATE POLICY "allow_all_user_session_states" ON user_session_states FOR ALL USING (true);
EXCEPTION 
  WHEN OTHERS THEN 
    -- If policy creation fails, just grant permissions
    NULL;
END $$;

-- Grant permissions
GRANT ALL ON user_session_states TO authenticated;

SELECT 'user_session_states table created!' as result;