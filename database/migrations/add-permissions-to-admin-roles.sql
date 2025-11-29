-- Add enhanced columns to existing admin_roles table in production
-- Safe to run - uses IF NOT EXISTS logic

DO $$ 
BEGIN
    -- Add permissions column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_roles' AND column_name = 'permissions'
    ) THEN
        ALTER TABLE admin_roles ADD COLUMN permissions TEXT[] DEFAULT ARRAY['read'];
        UPDATE admin_roles SET permissions = ARRAY['all'] WHERE role IN ('admin', 'super_admin');
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_roles' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE admin_roles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add granted_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_roles' AND column_name = 'granted_by'
    ) THEN
        ALTER TABLE admin_roles ADD COLUMN granted_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add notes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_roles' AND column_name = 'notes'
    ) THEN
        ALTER TABLE admin_roles ADD COLUMN notes TEXT;
    END IF;
    
    -- Add last_login_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_roles' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE admin_roles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_roles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE admin_roles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_admin_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_roles_updated_at ON admin_roles;
CREATE TRIGGER admin_roles_updated_at
    BEFORE UPDATE ON admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_roles_updated_at();

-- Add index for is_active
CREATE INDEX IF NOT EXISTS idx_admin_roles_is_active ON admin_roles(is_active);

-- Verify
SELECT 
    u.email,
    ar.role,
    ar.permissions,
    ar.created_at
FROM admin_roles ar
JOIN auth.users u ON u.id = ar.user_id;
