-- ============================================================================
-- CHECK AND FIX ADMIN STATUS
-- ============================================================================
-- Check and update peterlimited2000@gmail.com to full admin

-- Step 1: Check current status
SELECT 
    'Current Status' as step,
    ar.id,
    ar.user_id,
    ar.role,
    ar.created_at,
    u.email,
    u.display_name
FROM admin_roles ar
JOIN users u ON u.id = ar.user_id
WHERE u.email = 'peterlimited2000@gmail.com';

-- Step 2: Update to full admin (will work whether they're editor or already admin)
UPDATE admin_roles
SET role = 'admin'
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'peterlimited2000@gmail.com'
);

-- Step 3: Verify the update
SELECT 
    'After Update' as step,
    ar.id,
    ar.user_id,
    ar.role,
    ar.created_at,
    u.email,
    u.display_name
FROM admin_roles ar
JOIN users u ON u.id = ar.user_id
WHERE u.email = 'peterlimited2000@gmail.com';

-- Step 4: Show all admins for verification
SELECT 
    'All Admins' as step,
    ar.role,
    u.email,
    u.display_name,
    ar.created_at
FROM admin_roles ar
JOIN users u ON u.id = ar.user_id
ORDER BY ar.created_at DESC;

-- Success message
SELECT '✅ Admin status verified and updated to full admin!' as status;
