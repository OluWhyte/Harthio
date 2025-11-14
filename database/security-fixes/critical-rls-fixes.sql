-- ============================================================================
-- CRITICAL SECURITY FIXES - RLS Policy Vulnerabilities
-- ============================================================================
-- This file fixes multiple critical security vulnerabilities where tables
-- have overly permissive RLS policies allowing unauthorized access.
-- ============================================================================

-- ============================================================================
-- FIX 1: TOPICS TABLE - Only authors and admins can update
-- ============================================================================
DROP POLICY IF EXISTS "Users can update topics with restrictions" ON public.topics;
DROP POLICY IF EXISTS "Topic authors can update their topics" ON public.topics;

CREATE POLICY "Topic authors and admins can update topics" ON public.topics
    FOR UPDATE 
    USING (
        auth.uid() = author_id OR
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE admin_roles.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = author_id OR
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE admin_roles.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FIX 2: SESSION_HEALTH TABLE - Remove dangerous "allow all" policy
-- ============================================================================
DROP POLICY IF EXISTS "allow_all_session_health" ON public.session_health;

-- Keep the more restrictive policy that already exists
-- "Users can manage their health status" is sufficient

-- ============================================================================
-- FIX 3: SESSION_STATES TABLE - Restrict to session participants only
-- ============================================================================
DROP POLICY IF EXISTS "allow_all_session_states" ON public.session_states;

CREATE POLICY "Session participants can manage session states" ON public.session_states
    FOR ALL
    USING (
        session_id IN (
            SELECT id FROM topics 
            WHERE author_id = auth.uid() 
               OR auth.uid() = ANY(participants)
        )
        OR EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE admin_roles.user_id = auth.uid()
        )
    )
    WITH CHECK (
        session_id IN (
            SELECT id FROM topics 
            WHERE author_id = auth.uid() 
               OR auth.uid() = ANY(participants)
        )
        OR EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE admin_roles.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FIX 4: USER_SESSION_STATES TABLE - Restrict to own sessions only
-- ============================================================================
DROP POLICY IF EXISTS "allow_all_user_session_states" ON public.user_session_states;

CREATE POLICY "Users can manage their own session states" ON public.user_session_states
    FOR ALL
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE admin_roles.user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE admin_roles.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FIX 5: BLOG_LIKES - Add IP validation (optional but recommended)
-- ============================================================================
-- Note: This requires the ip_address column to be NOT NULL
-- Uncomment if you want to enforce this:
-- ALTER TABLE blog_likes ALTER COLUMN ip_address SET NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify topics policy
SELECT 'TOPICS UPDATE POLICY:' as check_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'topics' AND cmd = 'UPDATE';

-- Verify session_health policies
SELECT 'SESSION_HEALTH POLICIES:' as check_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'session_health'
ORDER BY policyname;

-- Verify session_states policies
SELECT 'SESSION_STATES POLICIES:' as check_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'session_states'
ORDER BY policyname;

-- Verify user_session_states policies
SELECT 'USER_SESSION_STATES POLICIES:' as check_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_session_states'
ORDER BY policyname;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Fixed 4 critical vulnerabilities:
-- 1. Topics: Now only authors and admins can update
-- 2. Session Health: Removed "allow all" policy
-- 3. Session States: Restricted to participants and admins
-- 4. User Session States: Restricted to own sessions and admins
-- ============================================================================
