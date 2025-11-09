-- Create session quality logs table for post-call analysis
-- This table stores aggregated quality metrics per session (one row per session)

CREATE TABLE IF NOT EXISTS session_quality_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Session identification
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Connection quality metrics (aggregated)
  avg_latency INTEGER NOT NULL, -- milliseconds
  max_latency INTEGER NOT NULL,
  min_latency INTEGER NOT NULL,
  avg_packet_loss DECIMAL(5,2) NOT NULL, -- percentage
  max_packet_loss DECIMAL(5,2) NOT NULL,
  avg_bandwidth INTEGER NOT NULL, -- kbps
  min_bandwidth INTEGER NOT NULL,
  max_bandwidth INTEGER NOT NULL,
  
  -- Video quality metrics
  avg_frame_rate INTEGER NOT NULL,
  min_frame_rate INTEGER NOT NULL,
  resolutions TEXT[] NOT NULL, -- array of resolution strings
  
  -- Connection stability metrics
  quality_changes INTEGER NOT NULL DEFAULT 0,
  connection_drops INTEGER NOT NULL DEFAULT 0,
  recovery_attempts INTEGER NOT NULL DEFAULT 0,
  
  -- Overall session quality
  overall_quality TEXT NOT NULL CHECK (overall_quality IN ('excellent', 'good', 'fair', 'poor', 'failed')),
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  
  -- Duration metrics
  session_duration INTEGER NOT NULL, -- milliseconds
  quality_duration INTEGER NOT NULL, -- milliseconds of good+ quality
  
  -- Timestamps
  session_started TIMESTAMPTZ NOT NULL,
  session_ended TIMESTAMPTZ NOT NULL,
  
  -- Context information
  provider TEXT NOT NULL CHECK (provider IN ('p2p', 'daily', 'fallback')),
  device_info JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for efficient querying
  CONSTRAINT fk_session_quality_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_session_quality_logs_session_id ON session_quality_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_quality_logs_user_id ON session_quality_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_quality_logs_created_at ON session_quality_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_quality_logs_overall_quality ON session_quality_logs(overall_quality);
CREATE INDEX IF NOT EXISTS idx_session_quality_logs_provider ON session_quality_logs(provider);

-- Create composite index for admin analytics
CREATE INDEX IF NOT EXISTS idx_session_quality_logs_analytics 
ON session_quality_logs(created_at DESC, overall_quality, provider);

-- Enable RLS
ALTER TABLE session_quality_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own session quality logs
CREATE POLICY "Users can view own session quality logs" ON session_quality_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only the system can insert session quality logs (via service role)
CREATE POLICY "System can insert session quality logs" ON session_quality_logs
  FOR INSERT WITH CHECK (true);

-- Admins can view all session quality logs
CREATE POLICY "Admins can view all session quality logs" ON session_quality_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

COMMENT ON TABLE session_quality_logs IS 'Aggregated session quality metrics for post-call analysis. One row per session.';
COMMENT ON COLUMN session_quality_logs.session_id IS 'Reference to the video session';
COMMENT ON COLUMN session_quality_logs.quality_score IS 'Overall quality score from 0-100 based on aggregated metrics';
COMMENT ON COLUMN session_quality_logs.quality_duration IS 'Total milliseconds where quality was good or excellent';
COMMENT ON COLUMN session_quality_logs.device_info IS 'Browser and device information for debugging';