-- Admin Audit System
-- This migration adds comprehensive admin action logging and user management capabilities

-- Admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'user_suspend', 'user_upgrade', 'user_email', etc.
    target_type VARCHAR(50) NOT NULL, -- 'user', 'session', 'content', etc.
    target_id UUID, -- ID of the target (user_id, session_id, etc.)
    details JSONB, -- Additional action details
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User reports table for moderation
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_content_id UUID, -- Could be message_id, topic_id, etc.
    report_type VARCHAR(50) NOT NULL, -- 'harassment', 'spam', 'inappropriate', etc.
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content flags table
CREATE TABLE IF NOT EXISTS content_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'message', 'topic', 'profile', etc.
    content_id UUID NOT NULL,
    flag_type VARCHAR(50) NOT NULL, -- 'ai_detected', 'user_reported', 'admin_flagged'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    reason TEXT,
    flagged_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'dismissed'
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin notifications table (check if notifications table exists first)
DO $$
BEGIN
    -- Check if notifications table exists and has notification_type column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Add missing columns to existing notifications table if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'notification_type') THEN
            ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'severity') THEN
            ALTER TABLE notifications ADD COLUMN severity VARCHAR(20) DEFAULT 'info';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target_url') THEN
            ALTER TABLE notifications ADD COLUMN target_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'expires_at') THEN
            ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        END IF;
    ELSE
        -- Create new admin_notifications table
        CREATE TABLE admin_notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            notification_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            severity VARCHAR(20) DEFAULT 'info',
            target_url TEXT,
            read_by JSONB DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE
        );
    END IF;
END $$;

-- User suspension/status tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_status VARCHAR(20) DEFAULT 'active'; -- 'active', 'suspended', 'banned'
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_expires_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_user_id);

CREATE INDEX IF NOT EXISTS idx_content_flags_status ON content_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_content ON content_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_severity ON content_flags(severity);

-- Create indexes on the notifications table (whether existing or new)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
    ELSE
        CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(notification_type);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_suspension_status ON users(suspension_status);

-- RLS Policies
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;
-- Enable RLS on notifications table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    ELSE
        ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Admin audit log policies (only admins can view) - only create if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_audit_log' 
        AND policyname = 'Admins can view all audit logs'
    ) THEN
        CREATE POLICY "Admins can view all audit logs" ON admin_audit_log
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM admin_roles 
                    WHERE admin_roles.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_audit_log' 
        AND policyname = 'System can insert audit logs'
    ) THEN
        CREATE POLICY "System can insert audit logs" ON admin_audit_log
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- User reports policies - only create if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_reports' 
        AND policyname = 'Users can view their own reports'
    ) THEN
        CREATE POLICY "Users can view their own reports" ON user_reports
            FOR SELECT USING (
                reporter_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM admin_roles 
                    WHERE admin_roles.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_reports' 
        AND policyname = 'Users can create reports'
    ) THEN
        CREATE POLICY "Users can create reports" ON user_reports
            FOR INSERT WITH CHECK (reporter_user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_reports' 
        AND policyname = 'Admins can update reports'
    ) THEN
        CREATE POLICY "Admins can update reports" ON user_reports
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM admin_roles 
                    WHERE admin_roles.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Content flags policies (admin only) - only create if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_flags' 
        AND policyname = 'Admins can manage content flags'
    ) THEN
        CREATE POLICY "Admins can manage content flags" ON content_flags
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM admin_roles 
                    WHERE admin_roles.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Admin notifications policies (admin only) - only create if they don't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Check and create policies only if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'notifications' 
            AND policyname = 'Admins can view notifications'
        ) THEN
            CREATE POLICY "Admins can view notifications" ON notifications
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM admin_roles 
                        WHERE admin_roles.user_id = auth.uid()
                    )
                );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'notifications' 
            AND policyname = 'System can create notifications'
        ) THEN
            CREATE POLICY "System can create notifications" ON notifications
                FOR INSERT WITH CHECK (true);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'notifications' 
            AND policyname = 'Admins can update notifications'
        ) THEN
            CREATE POLICY "Admins can update notifications" ON notifications
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM admin_roles 
                        WHERE admin_roles.user_id = auth.uid()
                    )
                );
        END IF;
    ELSE
        -- Create policies for admin_notifications table
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'admin_notifications' 
            AND policyname = 'Admins can view notifications'
        ) THEN
            CREATE POLICY "Admins can view notifications" ON admin_notifications
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM admin_roles 
                        WHERE admin_roles.user_id = auth.uid()
                    )
                );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'admin_notifications' 
            AND policyname = 'System can create notifications'
        ) THEN
            CREATE POLICY "System can create notifications" ON admin_notifications
                FOR INSERT WITH CHECK (true);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'admin_notifications' 
            AND policyname = 'Admins can update notifications'
        ) THEN
            CREATE POLICY "Admins can update notifications" ON admin_notifications
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM admin_roles 
                        WHERE admin_roles.user_id = auth.uid()
                    )
                );
        END IF;
    END IF;
END $$;

-- Grant permissions first
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON admin_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_flags TO authenticated;
-- Grant permissions on notifications table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
    ELSE
        GRANT SELECT, INSERT, UPDATE ON admin_notifications TO authenticated;
    END IF;
END $$;

-- Functions for audit logging
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_user_id UUID,
    p_action_type VARCHAR(50),
    p_target_type VARCHAR(50),
    p_target_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_audit_log (
        admin_user_id,
        action_type,
        target_type,
        target_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_admin_user_id,
        p_action_type,
        p_target_type,
        p_target_id,
        p_details,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
    p_notification_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'info',
    p_target_url TEXT DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    table_name TEXT;
BEGIN
    -- Determine which table to use
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        table_name := 'notifications';
    ELSE
        table_name := 'admin_notifications';
    END IF;
    
    -- Insert into the appropriate table
    IF table_name = 'notifications' THEN
        INSERT INTO notifications (
            notification_type,
            title,
            message,
            severity,
            target_url,
            expires_at
        ) VALUES (
            p_notification_type,
            p_title,
            p_message,
            p_severity,
            p_target_url,
            p_expires_at
        ) RETURNING id INTO notification_id;
    ELSE
        INSERT INTO admin_notifications (
            notification_type,
            title,
            message,
            severity,
            target_url,
            expires_at
        ) VALUES (
            p_notification_type,
            p_title,
            p_message,
            p_severity,
            p_target_url,
            p_expires_at
        ) RETURNING id INTO notification_id;
    END IF;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_notification TO authenticated;