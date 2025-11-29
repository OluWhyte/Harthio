-- ============================================================================
-- ADMIN NOTIFICATIONS TABLE
-- ============================================================================
-- Stores security notifications and alerts for the admin dashboard
-- ============================================================================

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('security_alert', 'system_alert', 'user_report', 'general')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_severity ON public.admin_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only admin users can access notifications
CREATE POLICY "Admin only access to notifications" ON public.admin_notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM admin_roles ar 
            WHERE ar.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.admin_notifications TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_notifications_updated_at
    BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_notifications_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test the table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'admin_notifications' 
-- ORDER BY ordinal_position;

-- Test RLS policy
-- SELECT * FROM admin_notifications LIMIT 1;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample notification (only works if you're an admin)
-- INSERT INTO public.admin_notifications (title, message, type, severity, metadata)
-- VALUES (
--     'Security Alert: Multiple Auth Failures',
--     'Detected 5 authentication failures from IP 192.168.1.100 on /api/validate-session',
--     'security_alert',
--     'medium',
--     '{"ip": "192.168.1.100", "endpoint": "/api/validate-session", "count": 5}'
-- );