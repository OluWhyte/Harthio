-- Check admin status for a specific user
-- Replace 'a155ff75-fc3e-4476-aea6-acd7a468b41f' with your actual user ID

SELECT 
  ar.id,
  ar.user_id,
  ar.role,
  ar.is_active,
  ar.created_at,
  u.email,
  u.display_name,
  u.first_name,
  u.last_name
FROM admin_roles ar
JOIN users u ON ar.user_id = u.id
WHERE ar.user_id = 'a155ff75-fc3e-4476-aea6-acd7a468b41f'
  AND ar.is_active = true;

-- Also check if the admin_roles table exists and has data
SELECT COUNT(*) as total_admins FROM admin_roles WHERE is_active = true;

-- Check the table structure
\d admin_roles;