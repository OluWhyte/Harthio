-- ============================================================================
-- UPGRADE USER TO FULL ADMIN
-- ============================================================================
-- Upgrades peterlimited2000@gmail.com from editor to full admin

-- First, let's check the current status
SELECT 
    ar.id,
    ar.user_id,
    ar.role,
    ar.created_at,
    u.email,
    u.display_name
FROM admin_roles ar
JOIN users u ON u.id = ar.user_id
WHERE u.email = 'peterlimited2000@gmail.com';

-- Upgrade to full admin
UPDATE admin_roles
SET role = 'admin'
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'peterlimited2000@gmail.com'
);

-- Verify the change
SELECT 
    ar.id,
    ar.user_id,
    ar.role,
    ar.created_at,
    u.email,
    u.display_name
FROM admin_roles ar
JOIN users u ON u.id = ar.user_id
WHERE u.email = 'peterlimited2000@gmail.com';

-- Success message
SELECT '✅ User upgraded to full admin successfully!' as status;
