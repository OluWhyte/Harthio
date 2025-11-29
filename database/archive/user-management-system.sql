-- ============================================================================
-- USER MANAGEMENT SYSTEM
-- ============================================================================
-- Comprehensive user management with roles, actions, and audit logging
-- ============================================================================

-- Create user_roles table (extends the basic admin_roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'therapist', 'moderator', 'suspended', 'banned')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active role per user
    UNIQUE(user_id, role, is_active)
);

-- Create user_status table for tracking user account status
CREATE TABLE IF NOT EXISTS public.user_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'banned', 'under_investigation', 'pending_verification')) DEFAULT 'active',
    reason TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_actions table for audit logging
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL CHECK (action_type IN (
        'role_granted', 'role_revoked', 'user_suspended', 'user_banned', 
        'user_unsuspended', 'user_unbanned', 'investigation_started', 
        'investigation_closed', 'account_verified', 'account_deleted',
        'permissions_modified', 'profile_updated'
    )),
    action_details JSONB NOT NULL DEFAULT '{}',
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL CHECK (permission IN (
        'create_sessions', 'join_sessions', 'send_messages', 'rate_users',
        'access_admin', 'manage_users', 'manage_content', 'view_analytics',
        'moderate_sessions', 'handle_reports', 'manage_therapists'
    )),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON public.user_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_status ON public.user_status(status);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON public.user_permissions(permission);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Admin only access to user roles" ON public.user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid()
        )
    );

-- RLS Policies for user_status
CREATE POLICY "Admin only access to user status" ON public.user_status
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid()
        )
    );

-- RLS Policies for admin_actions (admins can see all, users can see actions on themselves)
CREATE POLICY "Admin full access to admin actions" ON public.admin_actions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can see actions on themselves" ON public.admin_actions
    FOR SELECT
    USING (target_user_id = auth.uid());

-- RLS Policies for user_permissions
CREATE POLICY "Admin only access to user permissions" ON public.user_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_status TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;
GRANT ALL ON public.user_permissions TO authenticated;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_updated_at();

CREATE TRIGGER update_user_status_updated_at
    BEFORE UPDATE ON public.user_status
    FOR EACH ROW
    EXECUTE FUNCTION update_user_status_updated_at();

-- Create helper functions
CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id UUID)
RETURNS TABLE(role TEXT, granted_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT ur.role, ur.granted_at, ur.expires_at
    FROM user_roles ur
    WHERE ur.user_id = target_user_id 
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
$$;

CREATE OR REPLACE FUNCTION public.has_permission(target_user_id UUID, permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = target_user_id 
        AND up.permission = permission_name
        AND up.is_active = true
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    );
$$;

-- Create view for user management dashboard
CREATE OR REPLACE VIEW public.user_management_view AS
SELECT 
    u.id as user_id,
    u.email,
    u.display_name,
    u.created_at as user_created_at,
    us.status,
    us.reason as status_reason,
    us.changed_at as status_changed_at,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'role', ur.role,
                'granted_at', ur.granted_at,
                'expires_at', ur.expires_at
            )
        ) FILTER (WHERE ur.role IS NOT NULL), 
        '[]'::json
    ) as roles,
    COALESCE(
        JSON_AGG(
            DISTINCT up.permission
        ) FILTER (WHERE up.permission IS NOT NULL), 
        '[]'::json
    ) as permissions
FROM users u
LEFT JOIN user_status us ON u.id = us.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_active = true
GROUP BY u.id, u.email, u.display_name, u.created_at, us.status, us.reason, us.changed_at;

-- Grant access to the view
GRANT SELECT ON public.user_management_view TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.user_management_view SET (security_barrier = true);

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Initialize user status for existing users
INSERT INTO public.user_status (user_id, status)
SELECT id, 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_status)
ON CONFLICT (user_id) DO NOTHING;

-- Grant basic permissions to all active users
INSERT INTO public.user_permissions (user_id, permission, granted_by)
SELECT u.id, 'create_sessions', NULL
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_permissions up 
    WHERE up.user_id = u.id AND up.permission = 'create_sessions'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission, granted_by)
SELECT u.id, 'join_sessions', NULL
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_permissions up 
    WHERE up.user_id = u.id AND up.permission = 'join_sessions'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test the user management view
-- SELECT * FROM user_management_view LIMIT 5;

-- Test role functions
-- SELECT * FROM get_user_roles('user-id-here');
-- SELECT has_permission('user-id-here', 'create_sessions');

-- Check admin actions
-- SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT 10;