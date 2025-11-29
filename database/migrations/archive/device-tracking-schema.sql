-- ============================================================================
-- DEVICE TRACKING & USER FOOTPRINT SCHEMA
-- ============================================================================
-- Database schema for tracking user sessions, devices, and footprints
-- This extends the existing Harthio database with device tracking capabilities

-- ============================================================================
-- USER SESSIONS TABLE
-- ============================================================================
-- Tracks individual user sessions with device and location information

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_info JSONB NOT NULL DEFAULT '{}',
  location_info JSONB,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  session_duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN ended_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (ended_at - created_at)) / 60
      ELSE 
        EXTRACT(EPOCH FROM (last_active - created_at)) / 60
    END
  ) STORED
);

-- ============================================================================
-- DEVICE FINGERPRINTS TABLE
-- ============================================================================
-- Tracks unique device fingerprints for analytics and fraud detection

CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash TEXT NOT NULL UNIQUE,
  device_info JSONB NOT NULL DEFAULT '{}',
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_sessions INTEGER DEFAULT 1,
  unique_users INTEGER DEFAULT 1,
  is_suspicious BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- ============================================================================
-- USER FOOTPRINTS VIEW
-- ============================================================================
-- Aggregated view of user activity across devices and locations

CREATE OR REPLACE VIEW user_footprints AS
SELECT 
  u.id as user_id,
  u.email,
  u.display_name,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT s.device_fingerprint) as unique_devices,
  COUNT(DISTINCT s.ip_address) as unique_ip_addresses,
  COUNT(DISTINCT (s.location_info->>'country')) as unique_countries,
  MIN(s.created_at) as first_session,
  MAX(s.last_active) as last_session,
  AVG(s.session_duration_minutes) as avg_session_duration,
  SUM(s.session_duration_minutes) as total_session_time,
  COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as sessions_last_7_days,
  COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as sessions_last_30_days,
  -- Most used device info
  (
    SELECT s2.device_info 
    FROM user_sessions s2 
    WHERE s2.user_id = u.id 
    GROUP BY s2.device_info 
    ORDER BY COUNT(*) DESC 
    LIMIT 1
  ) as most_used_device,
  -- Most common location
  (
    SELECT s3.location_info 
    FROM user_sessions s3 
    WHERE s3.user_id = u.id AND s3.location_info IS NOT NULL
    GROUP BY s3.location_info 
    ORDER BY COUNT(*) DESC 
    LIMIT 1
  ) as most_common_location,
  -- Engagement level based on activity
  CASE 
    WHEN COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) >= 5 THEN 'High'
    WHEN COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) >= 3 THEN 'Medium'
    ELSE 'Low'
  END as engagement_level
FROM users u
LEFT JOIN user_sessions s ON u.id = s.user_id
GROUP BY u.id, u.email, u.display_name;

-- ============================================================================
-- DEVICE ANALYTICS VIEW
-- ============================================================================
-- Analytics view for device and browser statistics

CREATE OR REPLACE VIEW device_analytics AS
SELECT 
  (device_info->>'device_type') as device_type,
  (device_info->>'browser') as browser,
  (device_info->>'os') as operating_system,
  (location_info->>'country') as country,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_sessions,
  AVG(session_duration_minutes) as avg_session_duration,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as sessions_last_7_days,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as sessions_last_30_days
FROM user_sessions
WHERE device_info IS NOT NULL
GROUP BY 
  (device_info->>'device_type'),
  (device_info->>'browser'),
  (device_info->>'os'),
  (location_info->>'country');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_fingerprint ON user_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active);

-- Device fingerprints indexes
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_last_seen ON device_fingerprints(last_seen);

-- JSONB indexes for better query performance (using btree for text extraction)
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_type ON user_sessions ((device_info->>'device_type'));
CREATE INDEX IF NOT EXISTS idx_user_sessions_browser ON user_sessions ((device_info->>'browser'));
CREATE INDEX IF NOT EXISTS idx_user_sessions_os ON user_sessions ((device_info->>'os'));
CREATE INDEX IF NOT EXISTS idx_user_sessions_country ON user_sessions ((location_info->>'country'));

-- GIN indexes for full JSONB content search
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_info_gin ON user_sessions USING GIN (device_info);
CREATE INDEX IF NOT EXISTS idx_user_sessions_location_info_gin ON user_sessions USING GIN (location_info);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to create a new user session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_ip_address INET,
  p_user_agent TEXT,
  p_device_info JSONB,
  p_location_info JSONB DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_session_token TEXT;
BEGIN
  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert new session
  INSERT INTO user_sessions (
    user_id, 
    session_token, 
    ip_address, 
    user_agent, 
    device_info, 
    location_info, 
    device_fingerprint
  ) VALUES (
    p_user_id, 
    v_session_token, 
    p_ip_address, 
    p_user_agent, 
    p_device_info, 
    p_location_info, 
    p_device_fingerprint
  ) RETURNING id INTO v_session_id;
  
  -- Update or create device fingerprint record
  IF p_device_fingerprint IS NOT NULL THEN
    INSERT INTO device_fingerprints (fingerprint_hash, device_info, total_sessions, unique_users)
    VALUES (p_device_fingerprint, p_device_info, 1, 1)
    ON CONFLICT (fingerprint_hash) DO UPDATE SET
      last_seen = NOW(),
      total_sessions = device_fingerprints.total_sessions + 1,
      device_info = CASE 
        WHEN device_fingerprints.device_info = '{}' THEN p_device_info
        ELSE device_fingerprints.device_info
      END;
  END IF;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(p_session_id UUID) 
RETURNS VOID AS $$
BEGIN
  UPDATE user_sessions 
  SET last_active = NOW() 
  WHERE id = p_session_id AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end a session
CREATE OR REPLACE FUNCTION end_user_session(p_session_id UUID) 
RETURNS VOID AS $$
BEGIN
  UPDATE user_sessions 
  SET 
    ended_at = NOW(),
    is_active = FALSE,
    last_active = NOW()
  WHERE id = p_session_id AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if device fingerprint exists
CREATE OR REPLACE FUNCTION check_returning_device(p_fingerprint TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM device_fingerprints 
    WHERE fingerprint_hash = p_fingerprint
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_sessions() 
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- End sessions that have been inactive for more than 24 hours
  UPDATE user_sessions 
  SET 
    ended_at = last_active,
    is_active = FALSE
  WHERE 
    is_active = TRUE 
    AND last_active < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Delete very old session records (older than 1 year)
  DELETE FROM user_sessions 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY user_sessions_select_own ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY user_sessions_insert_own ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY user_sessions_update_own ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin access to all sessions
CREATE POLICY user_sessions_admin_access ON user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid()
    )
  );

-- Enable RLS on device_fingerprints (admin only)
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY device_fingerprints_admin_only ON device_fingerprints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically update last_active timestamp
CREATE OR REPLACE FUNCTION update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_last_active
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_active();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_sessions IS 'Tracks individual user sessions with device and location information';
COMMENT ON TABLE device_fingerprints IS 'Tracks unique device fingerprints for analytics and fraud detection';
COMMENT ON VIEW user_footprints IS 'Aggregated view of user activity across devices and locations';
COMMENT ON VIEW device_analytics IS 'Analytics view for device and browser statistics';

COMMENT ON FUNCTION create_user_session IS 'Creates a new user session with device tracking';
COMMENT ON FUNCTION update_session_activity IS 'Updates the last_active timestamp for a session';
COMMENT ON FUNCTION end_user_session IS 'Ends a user session';
COMMENT ON FUNCTION check_returning_device IS 'Checks if a device fingerprint has been seen before';
COMMENT ON FUNCTION cleanup_old_sessions IS 'Cleans up old and inactive sessions';