-- Quick admin fix
-- Run this to quickly fix admin access issues

-- Ensure the admin user exists and has proper permissions
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@harthio.com';

-- If the user doesn't exist, create them
INSERT INTO users (id, email, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@harthio.com',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET is_admin = true;

-- Refresh RLS policies
REFRESH MATERIALIZED VIEW IF EXISTS admin_view;