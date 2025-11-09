-- Create only the missing session tables
-- Run this if tables don't exist but functions do

-- Create user_session_states table (main one causing the error)
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

-- Create session_states table
CREATE TABLE IF NOT EXISTS session_states (
  session_id UUID PRIMARY KEY,
  active_provider TEXT DEFAULT 'none',
  fallback_provider TEXT DEFAULT 'p2p',
  room_info JSONB DEFAULT '{}',
  last_provider_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reconnection_in_progress BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_health table
CREATE TABLE IF NOT EXISTS session_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  user_id UUID,
  connection_status TEXT DEFAULT 'connecting',
  video_quality TEXT,
  audio_quality TEXT,
  network_latency INTEGER,
  packet_loss_percent DECIMAL(5,2),
  bandwidth_kbps INTEGER,
  device_type TEXT,
  browser_info JSONB DEFAULT '{}',
  network_type TEXT,
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE user_session_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_health ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (drop first if they exist)
DROP POLICY IF EXISTS "allow_all_user_session_states" ON user_session_states;
DROP POLICY IF EXISTS "allow_all_session_states" ON session_states;
DROP POLICY IF EXISTS "allow_all_session_health" ON session_health;

CREATE POLICY "allow_all_user_session_states" ON user_session_states FOR ALL USING (true);
CREATE POLICY "allow_all_session_states" ON session_states FOR ALL USING (true);
CREATE POLICY "allow_all_session_health" ON session_health FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON user_session_states TO authenticated;
GRANT ALL ON session_states TO authenticated;
GRANT ALL ON session_health TO authenticated;

SELECT 'Tables created successfully!' as result;