-- ============================================================================
-- TIER SYSTEM & RATE LIMITING - Database Migration
-- ============================================================================
-- Adds subscription tiers, trial tracking, and AI usage rate limiting
-- Safe to run multiple times (idempotent)

-- ============================================================================
-- 1. ADD SUBSCRIPTION TIER TO USERS TABLE
-- ============================================================================

-- Add subscription_tier column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' 
CHECK (subscription_tier IN ('free', 'pro'));

-- Add trial tracking columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT false;

-- Add subscription tracking columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Create index for faster tier checks
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier 
ON public.users(subscription_tier);

-- Update existing users to free tier
UPDATE public.users 
SET subscription_tier = 'free' 
WHERE subscription_tier IS NULL;

-- ============================================================================
-- 2. AI USAGE TRACKING TABLE (Rate Limiting)
-- ============================================================================

-- Track daily AI message usage for rate limiting
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INT NOT NULL DEFAULT 0,
    topic_helper_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per day
    UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON public.ai_usage;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update own usage" ON public.ai_usage
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date 
ON public.ai_usage(user_id, usage_date);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_usage_updated_at ON public.ai_usage;
CREATE TRIGGER ai_usage_updated_at
    BEFORE UPDATE ON public.ai_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_usage_updated_at();

-- ============================================================================
-- 3. ATOMIC INCREMENT FUNCTIONS (Prevent Race Conditions)
-- ============================================================================

-- Increment AI message count atomically
CREATE OR REPLACE FUNCTION increment_ai_message_usage(
    p_user_id UUID,
    p_usage_date DATE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.ai_usage (user_id, usage_date, message_count, topic_helper_count)
    VALUES (p_user_id, p_usage_date, 1, 0)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET 
        message_count = ai_usage.message_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment topic helper count atomically
CREATE OR REPLACE FUNCTION increment_topic_helper_usage(
    p_user_id UUID,
    p_usage_date DATE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.ai_usage (user_id, usage_date, message_count, topic_helper_count)
    VALUES (p_user_id, p_usage_date, 0, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET 
        topic_helper_count = ai_usage.topic_helper_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. PROACTIVE AI EVENTS TRACKING (Optional - for analytics)
-- ============================================================================

-- Track proactive AI events for analytics
CREATE TABLE IF NOT EXISTS public.proactive_ai_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'session_browsing', 'mood_change', etc.
    prompt_shown BOOLEAN DEFAULT false,
    user_clicked BOOLEAN DEFAULT false,
    action_taken TEXT, -- 'open_chat', 'dismiss', etc.
    user_tier TEXT NOT NULL, -- 'free' or 'pro'
    metadata JSONB, -- Additional context
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proactive_ai_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own events" ON public.proactive_ai_events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.proactive_ai_events;

-- Users can view their own events
CREATE POLICY "Users can view own events" ON public.proactive_ai_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own events" ON public.proactive_ai_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_proactive_events_user 
ON public.proactive_ai_events(user_id);

CREATE INDEX IF NOT EXISTS idx_proactive_events_type 
ON public.proactive_ai_events(event_type);

CREATE INDEX IF NOT EXISTS idx_proactive_events_created 
ON public.proactive_ai_events(created_at);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Get user's current tier (handles trial logic)
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_tier TEXT;
    v_is_trial_active BOOLEAN;
    v_trial_end_date TIMESTAMPTZ;
BEGIN
    SELECT 
        subscription_tier,
        is_trial_active,
        trial_end_date
    INTO 
        v_tier,
        v_is_trial_active,
        v_trial_end_date
    FROM public.users
    WHERE id = p_user_id;
    
    -- If no user found, return free
    IF v_tier IS NULL THEN
        RETURN 'free';
    END IF;
    
    -- Check if trial is active and not expired
    IF v_is_trial_active AND v_trial_end_date IS NOT NULL THEN
        IF v_trial_end_date > NOW() THEN
            RETURN 'pro'; -- Trial users get Pro access
        ELSE
            -- Trial expired, update database
            UPDATE public.users
            SET is_trial_active = false
            WHERE id = p_user_id;
            
            RETURN v_tier;
        END IF;
    END IF;
    
    RETURN v_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can create tracker (free = 1, pro = 20)
CREATE OR REPLACE FUNCTION can_create_tracker(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_tier TEXT;
    v_tracker_count INT;
    v_max_trackers INT;
BEGIN
    -- Get user tier
    v_tier := get_user_tier(p_user_id);
    
    -- Set max trackers based on tier
    IF v_tier = 'pro' THEN
        v_max_trackers := 20;
    ELSE
        v_max_trackers := 1;
    END IF;
    
    -- Count existing trackers
    SELECT COUNT(*)
    INTO v_tracker_count
    FROM public.sobriety_trackers
    WHERE user_id = p_user_id;
    
    -- Return true if under limit
    RETURN v_tracker_count < v_max_trackers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Check that columns were added
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name IN ('subscription_tier', 'trial_start_date', 'trial_end_date', 'is_trial_active')
ORDER BY column_name;

-- Check that ai_usage table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_usage', 'proactive_ai_events')
ORDER BY table_name;

-- Check that indexes were created
SELECT 
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('users', 'ai_usage', 'proactive_ai_events')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check that functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'increment_ai_message_usage',
    'increment_topic_helper_usage',
    'get_user_tier',
    'can_create_tracker'
)
ORDER BY routine_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Tier system migration complete!' as status,
       'Users table updated with subscription tiers' as users_table,
       'AI usage tracking table created' as rate_limiting,
       'Proactive AI events table created' as analytics,
       'Helper functions created' as functions;
