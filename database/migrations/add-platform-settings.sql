-- ============================================================================
-- PLATFORM SETTINGS - Admin Control Panel
-- ============================================================================
-- Allows admins to toggle features on/off without code deployment
-- Safe to run multiple times (idempotent)

-- ============================================================================
-- 1. CREATE PLATFORM SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Only admins can update settings" ON public.platform_settings;

-- Anyone can read settings (needed for feature checks)
CREATE POLICY "Anyone can read settings" ON public.platform_settings
    FOR SELECT
    USING (true);

-- Only admins can update settings
CREATE POLICY "Only admins can update settings" ON public.platform_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE admin_roles.user_id = auth.uid()
            AND admin_roles.is_active = true
        )
    );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key 
ON public.platform_settings(setting_key);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_settings_updated_at();

-- ============================================================================
-- 2. INSERT DEFAULT SETTINGS
-- ============================================================================

-- Pro tier enforcement (OFF by default for launch)
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'pro_tier_enabled',
    '{"enabled": false, "message": "Pro tier is currently disabled. All users have free access to all features."}'::jsonb,
    'Controls whether Pro tier restrictions are enforced. When disabled, all users get Pro features for free.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- AI rate limiting (OFF by default for launch)
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'ai_rate_limiting_enabled',
    '{"enabled": false, "free_limit": 3, "pro_limit": -1}'::jsonb,
    'Controls AI message rate limiting. When disabled, all users get unlimited AI messages.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Tracker limits (OFF by default for launch)
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'tracker_limits_enabled',
    '{"enabled": false, "free_limit": 1, "pro_limit": 20}'::jsonb,
    'Controls tracker creation limits. When disabled, all users can create unlimited trackers.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Maintenance mode
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'maintenance_mode',
    '{"enabled": false, "message": "We are performing scheduled maintenance. Please check back soon."}'::jsonb,
    'Enables maintenance mode banner across the platform.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Trial mode (OFF by default for launch)
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'trial_mode_enabled',
    '{"enabled": false, "trial_days": 14, "message": "Free trials are currently disabled."}'::jsonb,
    'Controls whether new users can start free trials. When disabled, users must pay immediately for Pro.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Feature flags
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'feature_flags',
    '{"visual_journey": false, "ai_topic_helper": false, "voice_input": false}'::jsonb,
    'Feature flags for experimental features.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Get setting value
CREATE OR REPLACE FUNCTION get_platform_setting(p_setting_key TEXT)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
BEGIN
    SELECT setting_value
    INTO v_value
    FROM public.platform_settings
    WHERE setting_key = p_setting_key;
    
    RETURN COALESCE(v_value, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if Pro tier is enforced
CREATE OR REPLACE FUNCTION is_pro_tier_enforced()
RETURNS BOOLEAN AS $$
DECLARE
    v_setting JSONB;
BEGIN
    v_setting := get_platform_setting('pro_tier_enabled');
    RETURN COALESCE((v_setting->>'enabled')::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get effective user tier (considers platform settings)
CREATE OR REPLACE FUNCTION get_effective_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_actual_tier TEXT;
    v_pro_enforced BOOLEAN;
BEGIN
    -- Check if Pro tier is enforced
    v_pro_enforced := is_pro_tier_enforced();
    
    -- If not enforced, everyone gets Pro
    IF NOT v_pro_enforced THEN
        RETURN 'pro';
    END IF;
    
    -- Otherwise, return actual tier
    v_actual_tier := get_user_tier(p_user_id);
    RETURN v_actual_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. ADMIN FUNCTIONS
-- ============================================================================

-- Toggle Pro tier enforcement
CREATE OR REPLACE FUNCTION admin_toggle_pro_tier(p_enabled BOOLEAN, p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Verify admin
    SELECT EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = p_admin_id
        AND is_active = true
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        RETURN '{"success": false, "error": "Unauthorized"}'::jsonb;
    END IF;
    
    -- Update setting
    UPDATE public.platform_settings
    SET 
        setting_value = jsonb_set(
            setting_value,
            '{enabled}',
            to_jsonb(p_enabled)
        ),
        updated_by = p_admin_id
    WHERE setting_key = 'pro_tier_enabled';
    
    RETURN jsonb_build_object(
        'success', true,
        'enabled', p_enabled,
        'message', CASE 
            WHEN p_enabled THEN 'Pro tier enforcement enabled'
            ELSE 'Pro tier enforcement disabled - all users have Pro access'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

-- Check settings table
SELECT 
    setting_key,
    setting_value,
    description
FROM public.platform_settings
ORDER BY setting_key;

-- Check functions
SELECT 
    routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_platform_setting',
    'is_pro_tier_enforced',
    'get_effective_user_tier',
    'admin_toggle_pro_tier'
)
ORDER BY routine_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Platform settings migration complete!' as status,
       'Pro tier enforcement: DISABLED (all users get Pro access)' as pro_tier,
       'AI rate limiting: DISABLED (unlimited messages)' as rate_limiting,
       'Tracker limits: DISABLED (unlimited trackers)' as trackers,
       'Admins can toggle these in Admin > Settings' as admin_control;

