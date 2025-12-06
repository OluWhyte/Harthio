-- Run this in PRODUCTION to check tracker creation permissions

-- 1. Check INSERT policy for sobriety_trackers
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'sobriety_trackers' AND cmd = 'INSERT';

-- 2. Test if current user can insert (replace with your user ID)
-- This will show if RLS is blocking inserts
SELECT 
    auth.uid() as current_user_id,
    EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sobriety_trackers' 
        AND cmd = 'INSERT'
    ) as has_insert_policy;

-- 3. Check if the with_check condition exists
SELECT 
    policyname,
    with_check
FROM pg_policies
WHERE tablename = 'sobriety_trackers' AND cmd = 'INSERT';
