-- Setup Admin User Script
-- Run this after creating a user account to give them admin privileges

-- Replace 'your-user-email@example.com' with the actual email of the user you want to make admin
INSERT INTO admin_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'peterlimited2000@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify the admin was created
SELECT 
    u.email,
    ar.role,
    ar.created_at
FROM admin_roles ar
JOIN auth.users u ON u.id = ar.user_id
WHERE u.email = 'peterlimited2000@gmail.com';