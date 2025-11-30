-- ============================================================================
-- AUTOMATED EMAIL SCHEDULER
-- ============================================================================
-- Tracks automated email sends to prevent duplicates and enable scheduling

-- Create table to track automated email sends
CREATE TABLE IF NOT EXISTS automated_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- 'welcome', 'day_3', 'week_1', 'inactive'
  template_id UUID REFERENCES email_templates(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'skipped'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_automated_email_log_user_type ON automated_email_log(user_id, email_type);
CREATE INDEX IF NOT EXISTS idx_automated_email_log_sent_at ON automated_email_log(sent_at);

-- Enable RLS
ALTER TABLE automated_email_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admins can view automated email logs"
  ON automated_email_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Function to check if user has received a specific email type
CREATE OR REPLACE FUNCTION has_received_email(p_user_id UUID, p_email_type VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM automated_email_log
    WHERE user_id = p_user_id
    AND email_type = p_email_type
    AND status = 'sent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users who should receive welcome email (0-24 hours old)
CREATE OR REPLACE FUNCTION get_users_for_welcome_email()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.display_name,
    u.created_at
  FROM users u
  WHERE 
    -- Created in last 24 hours
    u.created_at >= NOW() - INTERVAL '24 hours'
    -- Haven't received welcome email yet
    AND NOT has_received_email(u.id, 'welcome')
    -- Not unsubscribed from marketing
    AND NOT EXISTS (
      SELECT 1 FROM user_email_preferences uep
      WHERE uep.user_id = u.id
      AND (uep.unsubscribed_marketing = true OR uep.unsubscribed_all = true)
    )
  ORDER BY u.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users who should receive day 3 follow-up (1-3 days old)
CREATE OR REPLACE FUNCTION get_users_for_day3_email()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.display_name,
    u.created_at
  FROM users u
  WHERE 
    -- Created between 1-3 days ago
    u.created_at >= NOW() - INTERVAL '3 days'
    AND u.created_at < NOW() - INTERVAL '1 day'
    -- Haven't received day 3 email yet
    AND NOT has_received_email(u.id, 'day_3')
    -- Not unsubscribed from marketing
    AND NOT EXISTS (
      SELECT 1 FROM user_email_preferences uep
      WHERE uep.user_id = u.id
      AND (uep.unsubscribed_marketing = true OR uep.unsubscribed_all = true)
    )
  ORDER BY u.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users who should receive week 1 check-in (3-7 days old)
CREATE OR REPLACE FUNCTION get_users_for_week1_email()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.display_name,
    u.created_at
  FROM users u
  WHERE 
    -- Created between 3-7 days ago
    u.created_at >= NOW() - INTERVAL '7 days'
    AND u.created_at < NOW() - INTERVAL '3 days'
    -- Haven't received week 1 email yet
    AND NOT has_received_email(u.id, 'week_1')
    -- Not unsubscribed from marketing
    AND NOT EXISTS (
      SELECT 1 FROM user_email_preferences uep
      WHERE uep.user_id = u.id
      AND (uep.unsubscribed_marketing = true OR uep.unsubscribed_all = true)
    )
  ORDER BY u.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users who should receive inactive email (30+ days old, no activity)
CREATE OR REPLACE FUNCTION get_users_for_inactive_email()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.display_name,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE 
    -- Created more than 30 days ago
    u.created_at < NOW() - INTERVAL '30 days'
    -- No activity in last 30 days
    AND u.updated_at < NOW() - INTERVAL '30 days'
    -- Haven't received inactive email in last 35 days (to avoid spam)
    AND NOT EXISTS (
      SELECT 1 FROM automated_email_log ael
      WHERE ael.user_id = u.id
      AND ael.email_type = 'inactive'
      AND ael.sent_at >= NOW() - INTERVAL '35 days'
    )
    -- Not unsubscribed from marketing
    AND NOT EXISTS (
      SELECT 1 FROM user_email_preferences uep
      WHERE uep.user_id = u.id
      AND (uep.unsubscribed_marketing = true OR uep.unsubscribed_all = true)
    )
  ORDER BY u.updated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log automated email send
CREATE OR REPLACE FUNCTION log_automated_email(
  p_user_id UUID,
  p_email_type VARCHAR,
  p_template_id UUID,
  p_status VARCHAR DEFAULT 'sent',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO automated_email_log (
    user_id,
    email_type,
    template_id,
    status,
    error_message
  ) VALUES (
    p_user_id,
    p_email_type,
    p_template_id,
    p_status,
    p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify setup
SELECT 
  'automated_email_log table' as component,
  '✅ Created' as status
UNION ALL
SELECT 
  'Email scheduler functions' as component,
  '✅ Created' as status;
