-- Admin Roles Table
-- Enhanced with permissions for granular access control

CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'super_admin')),
    permissions TEXT[] DEFAULT ARRAY['read'],
    is_active BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES auth.users(id),
    notes TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can read admin roles" ON admin_roles
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admin_roles WHERE is_active = true)
    );

CREATE POLICY "Admins can manage admin roles" ON admin_roles
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM admin_roles)
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_is_active ON admin_roles(is_active);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_admin_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_roles_updated_at
    BEFORE UPDATE ON admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_roles_updated_at();
