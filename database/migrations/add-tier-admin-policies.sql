-- ============================================================================
-- TIER SYSTEM - ADMIN POLICIES
-- ============================================================================
-- Adds admin policies for subscription tier management
-- Run this AFTER add-tier-system.sql

-- ============================================================================
-- 1. ADMIN HELPER FUNCTION (if not exists)
-- ============================================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. ADMIN POLICIES FOR USERS TABLE (Subscription Management)
-- ============================================================================

-- Drop existing admin policies if any
DROP POLICY IF EXISTS "Admins can view all user subscriptions" ON public.users;
DROP POLICY IF EXISTS "Admins can update user subscriptions" ON public.users;

-- Admins can view all user subscription info
CREATE POLICY "Admins can view all user subscriptions" ON public.users
    FOR SELECT
    USING (
        is_admin() OR auth.uid() = id
    );

-- Admins can update user subscription tiers
CREATE POLICY "Admins can update user subscriptions" ON public.users
    FOR UPDATE
    USING (
        is_admin() OR auth.uid() = id
    )
    WITH CHECK (
        is_admin() OR auth.uid() = id
    );

-- ============================================================================
-- 3. ADMIN POLICIES FOR AI_USAGE TABLE (View Usage Stats)
-- ============================================================================

-- Drop existing admin policy if any
DROP POLICY IF EXISTS "Admins can view all AI usage" ON public.ai_usage;

-- Admins can view all AI usage for monitoring
CREATE POLICY "Admins can view all AI usage" ON public.ai_usage
    FOR SELECT
    USING (is_admin());

-- ============================================================================
-- 4. ADMIN POLICIES FOR PROACTIVE_AI_EVENTS TABLE (View Analytics)
-- ============================================================================

-- Drop existing admin policy if any
DROP POLICY IF EXISTS "Admins can view all proactive events" ON public.proactive_ai_events;

-- Admins can view all proactive AI events for analytics
CREATE POLICY "Admins can view all proactive events" ON public.proactive_ai_events
    FOR SELECT
    USING (is_admin());

-- ============================================================================
-- 5. ADMIN VIEW FOR SUBSCRIPTION MANAGEMENT
-- ============================================================================

-- Create or replace admin view for subscription management
CREATE OR REPLACE VIEW admin_subscription_overview AS
SELECT 
    u.id as user_id,
    u.email,
    u.display_name,
    u.subscription_tier,
    u.is_trial_active,
    u.trial_start_date,
    u.trial_end_date,
    u.subscription_start_date,
    u.subscription_end_date,
    u.created_at as user_created_at,
    
    -- AI Usage Stats (today)
    COALESCE(ai.message_count, 0) as messages_today,
    COALESCE(ai.topic_helper_count, 0) as topic_helpers_today,
    
    -- Trial Status
    CASE 
        WHEN u.is_trial_active AND u.trial_end_date > NOW() THEN 'Active Trial'
        WHEN u.is_trial_active AND u.trial_end_date <= NOW() THEN 'Trial Expired'
        WHEN u.trial_start_date IS NOT NULL THEN 'Trial Used'
        ELSE 'No Trial'
    END as trial_status,
    
    -- Days remaining in trial
    CASE 
        WHEN u.is_trial_active AND u.trial_end_date > NOW() 
        THEN EXTRACT(DAY FROM (u.trial_end_date - NOW()))::INTEGER
        ELSE 0
    END as trial_days_remaining,
    
    -- Subscription Status
    CASE 
        WHEN u.subscription_tier = 'pro' AND u.is_trial_active THEN 'Pro (Trial)'
        WHEN u.subscription_tier = 'pro' THEN 'Pro (Paid)'
        ELSE 'Free'
    END as subscription_status

FROM public.users u
LEFT JOIN public.ai_usage ai ON u.id = ai.user_id AND ai.usage_date = CURRENT_DATE
ORDER BY u.created_at DESC;

-- Grant access to admins only
GRANT SELECT ON admin_subscription_overview TO authenticated;

-- Add RLS to view (admins only)
ALTER VIEW admin_subscription_overview SET (security_invoker = true);

-- ============================================================================
-- 6. ADMIN FUNCTIONS FOR SUBSCRIPTION MANAGEMENT
-- ============================================================================

-- Function to manually upgrade user to Pro (admin only)
CREATE OR REPLACE FUNCTION admin_upgrade_user_to_pro(
    p_user_id UUID,
    p_admin_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if caller is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can upgrade users';
    END IF;
    
    -- Upgrade user
    UPDATE public.users
    SET 
        subscription_tier = 'pro',
        subscription_start_date = NOW(),
        is_trial_active = false
    WHERE id = p_user_id;
    
    -- Log action
    INSERT INTO public.admin_actions (admin_id, action_type, target_user_id, details)
    VALUES (
        auth.uid(),
        'upgrade_to_pro',
        p_user_id,
        jsonb_build_object('note', p_admin_note, 'timestamp', NOW())
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually downgrade user to Free (admin only)
CREATE OR REPLACE FUNCTION admin_downgrade_user_to_free(
    p_user_id UUID,
    p_admin_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if caller is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can downgrade users';
    END IF;
    
    -- Downgrade user
    UPDATE public.users
    SET 
        subscription_tier = 'free',
        subscription_end_date = NOW(),
        is_trial_active = false
    WHERE id = p_user_id;
    
    -- Log action
    INSERT INTO public.admin_actions (admin_id, action_type, target_user_id, details)
    VALUES (
        auth.uid(),
        'downgrade_to_free',
        p_user_id,
        jsonb_build_object('note', p_admin_note, 'timestamp', NOW())
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extend trial (admin only)
CREATE OR REPLACE FUNCTION admin_extend_trial(
    p_user_id UUID,
    p_days INTEGER,
    p_admin_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_end_date TIMESTAMPTZ;
BEGIN
    -- Check if caller is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can extend trials';
    END IF;
    
    -- Get current trial end date
    SELECT trial_end_date INTO v_current_end_date
    FROM public.users
    WHERE id = p_user_id;
    
    -- Extend trial
    UPDATE public.users
    SET 
        trial_end_date = COALESCE(v_current_end_date, NOW()) + (p_days || ' days')::INTERVAL,
        is_trial_active = true
    WHERE id = p_user_id;
    
    -- Log action
    INSERT INTO public.admin_actions (admin_id, action_type, target_user_id, details)
    VALUES (
        auth.uid(),
        'extend_trial',
        p_user_id,
        jsonb_build_object('days', p_days, 'note', p_admin_note, 'timestamp', NOW())
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

-- Check that admin policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'ai_usage', 'proactive_ai_events')
AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;

-- Check that admin functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'admin_%'
AND routine_name IN (
    'admin_upgrade_user_to_pro',
    'admin_downgrade_user_to_free',
    'admin_extend_trial'
)
ORDER BY routine_name;

-- Check that admin view was created
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'admin_subscription_overview';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Admin policies and tools created!' as status,
       'Admins can now manage user subscriptions' as admin_access,
       'Admin view created for subscription overview' as admin_view,
       'Admin functions created for tier management' as admin_functions;
