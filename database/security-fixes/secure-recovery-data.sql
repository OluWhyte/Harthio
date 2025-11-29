-- ============================================================================
-- SECURITY FIX: Row Level Security for Recovery Data
-- ============================================================================
-- Ensures users can only access their own sobriety trackers and mood check-ins
-- Prevents data leaks between users

-- ============================================================================
-- 1. SOBRIETY TRACKERS - Row Level Security
-- ============================================================================

-- Enable RLS on sobriety_trackers
ALTER TABLE public.sobriety_trackers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own trackers" ON public.sobriety_trackers;
DROP POLICY IF EXISTS "Users can create own trackers" ON public.sobriety_trackers;
DROP POLICY IF EXISTS "Users can update own trackers" ON public.sobriety_trackers;
DROP POLICY IF EXISTS "Users can delete own trackers" ON public.sobriety_trackers;

-- Policy: Users can only view their own trackers
CREATE POLICY "Users can view own trackers" ON public.sobriety_trackers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only create trackers for themselves
CREATE POLICY "Users can create own trackers" ON public.sobriety_trackers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own trackers
CREATE POLICY "Users can update own trackers" ON public.sobriety_trackers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own trackers
CREATE POLICY "Users can delete own trackers" ON public.sobriety_trackers
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 2. DAILY CHECK-INS - Row Level Security
-- ============================================================================

-- Enable RLS on daily_checkins
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own checkins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can create own checkins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can delete own checkins" ON public.daily_checkins;

-- Policy: Users can only view their own check-ins
CREATE POLICY "Users can view own checkins" ON public.daily_checkins
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only create check-ins for themselves
CREATE POLICY "Users can create own checkins" ON public.daily_checkins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own check-ins
CREATE POLICY "Users can update own checkins" ON public.daily_checkins
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own check-ins
CREATE POLICY "Users can delete own checkins" ON public.daily_checkins
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 3. RELAPSE HISTORY - Already Secured (from visual-journey.sql)
-- ============================================================================
-- tracker_relapses table already has RLS policies ✅

-- ============================================================================
-- 4. ADMIN ACCESS (Optional - if you want admins to see all data)
-- ============================================================================

-- Create admin role check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for sobriety_trackers
DROP POLICY IF EXISTS "Admins can view all trackers" ON public.sobriety_trackers;
CREATE POLICY "Admins can view all trackers" ON public.sobriety_trackers
    FOR SELECT
    USING (is_admin());

-- Admin policies for daily_checkins
DROP POLICY IF EXISTS "Admins can view all checkins" ON public.daily_checkins;
CREATE POLICY "Admins can view all checkins" ON public.daily_checkins
    FOR SELECT
    USING (is_admin());

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('sobriety_trackers', 'daily_checkins', 'tracker_relapses')
ORDER BY tablename;

-- Check policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('sobriety_trackers', 'daily_checkins', 'tracker_relapses')
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. TEST SECURITY (Run as different users to verify)
-- ============================================================================

-- Test 1: Try to view another user's tracker (should return 0 rows)
-- SELECT * FROM sobriety_trackers WHERE user_id != auth.uid();

-- Test 2: Try to insert tracker for another user (should fail)
-- INSERT INTO sobriety_trackers (user_id, ...) VALUES ('other-user-id', ...);

-- Test 3: Try to update another user's tracker (should fail)
-- UPDATE sobriety_trackers SET tracker_name = 'Hacked' WHERE user_id != auth.uid();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Row Level Security enabled for recovery data!' as status,
       'Users can only access their own trackers and check-ins' as security,
       'Admins can view all data (if admin role exists)' as admin_access;
