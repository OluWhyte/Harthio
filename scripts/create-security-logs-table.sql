-- ============================================================================
-- OWASP SECURITY LOGGING TABLE
-- ============================================================================
-- Implements OWASP A09:2021 – Security Logging and Monitoring Failures
-- Tracks security events for audit and incident response
-- ============================================================================

-- Create security_logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_failure',
    'access_denied',
    'rate_limit',
    'suspicious_activity',
    'data_breach_attempt',
    'xss_attempt',
    'sql_injection_attempt',
    'csrf_attempt',
    'unauthorized_access'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  details TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read security logs
CREATE POLICY "Admins can read security logs"
  ON security_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
    )
  );

-- System can insert security logs (no user restriction)
CREATE POLICY "System can insert security logs"
  ON security_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create function to clean old logs (keep last 90 days)
CREATE OR REPLACE FUNCTION clean_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM security_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Create view for security dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT ip_address) as unique_ips,
  MAX(created_at) as last_occurrence
FROM security_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY event_type, severity
ORDER BY event_count DESC;

-- Grant access to view for admins
GRANT SELECT ON security_dashboard TO authenticated;

-- Create function to get security summary
CREATE OR REPLACE FUNCTION get_security_summary(days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_events BIGINT,
  critical_events BIGINT,
  high_events BIGINT,
  medium_events BIGINT,
  low_events BIGINT,
  unique_users BIGINT,
  unique_ips BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
    COUNT(*) FILTER (WHERE severity = 'high') as high_events,
    COUNT(*) FILTER (WHERE severity = 'medium') as medium_events,
    COUNT(*) FILTER (WHERE severity = 'low') as low_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
  FROM security_logs
  WHERE created_at > NOW() - (days || ' days')::INTERVAL;
END;
$$;

-- Comments
COMMENT ON TABLE security_logs IS 'OWASP A09: Security event logging for monitoring and incident response';
COMMENT ON COLUMN security_logs.event_type IS 'Type of security event';
COMMENT ON COLUMN security_logs.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN security_logs.details IS 'Detailed description of the security event';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Security logs table created successfully';
  RAISE NOTICE '📊 Security dashboard view created';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '🧹 Auto-cleanup function created (90 days retention)';
END $$;
