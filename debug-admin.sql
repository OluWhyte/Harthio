-- Debug admin setup
-- This file helps debug admin-related issues

-- Check if admin users exist
SELECT id, email, is_admin, created_at 
FROM users 
WHERE is_admin = true;

-- Check admin permissions
SELECT * FROM admin_permissions;

-- Check blog posts and their authors
SELECT bp.*, u.email as author_email, u.is_admin as author_is_admin
FROM blog_posts bp
LEFT JOIN users u ON bp.author_id = u.id
ORDER BY bp.created_at DESC;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;