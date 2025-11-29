-- ============================================================================
-- Sync Production Tables to Dev
-- ============================================================================
-- Adds all tables that exist in production but missing in dev
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ============================================================================
-- ADMIN TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_actions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES auth.users(id),
    target_user_id uuid REFERENCES auth.users(id),
    action_type text NOT NULL,
    action_details jsonb DEFAULT '{}'::jsonb NOT NULL,
    reason text,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    severity text DEFAULT 'medium'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- BLOG TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    slug text UNIQUE NOT NULL,
    excerpt text,
    content text NOT NULL,
    featured_image_url text,
    category text DEFAULT 'Product Updates'::text,
    status text DEFAULT 'draft'::text CHECK (status IN ('draft', 'published', 'archived')),
    author_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS blog_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
    ip_address inet NOT NULL,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(blog_post_id, ip_address)
);

-- ============================================================================
-- EMAIL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    html_content text NOT NULL,
    text_content text NOT NULL,
    description text,
    category character varying(50) DEFAULT 'general'::character varying,
    variables jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(255) NOT NULL,
    template_id uuid REFERENCES email_templates(id),
    from_email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    audience_filter character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    total_recipients integer DEFAULT 0,
    sent_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_campaign_sends (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid REFERENCES email_campaigns(id),
    user_id uuid REFERENCES auth.users(id),
    email character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    sent_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_email_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) UNIQUE,
    unsubscribed_marketing boolean DEFAULT false,
    unsubscribed_all boolean DEFAULT false,
    unsubscribed_at timestamp with time zone,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- SECURITY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    ip_address text,
    user_agent text,
    details text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_fingerprints (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint_hash text UNIQUE NOT NULL,
    device_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    first_seen timestamp with time zone DEFAULT now(),
    last_seen timestamp with time zone DEFAULT now(),
    total_sessions integer DEFAULT 1,
    unique_users integer DEFAULT 1,
    is_suspicious boolean DEFAULT false,
    notes text
);

-- ============================================================================
-- USER MANAGEMENT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    session_token text UNIQUE NOT NULL,
    ip_address inet NOT NULL,
    user_agent text,
    device_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    location_info jsonb,
    device_fingerprint text,
    created_at timestamp with time zone DEFAULT now(),
    last_active timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone,
    is_active boolean DEFAULT true,
    session_duration_minutes integer
);

CREATE TABLE IF NOT EXISTS user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    role text NOT NULL,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    permission text NOT NULL,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_status (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) UNIQUE,
    status text DEFAULT 'active'::text NOT NULL CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
    reason text,
    changed_by uuid REFERENCES auth.users(id),
    changed_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- SESSION/WEBRTC TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS signaling (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid NOT NULL,
    sender_id uuid NOT NULL REFERENCES auth.users(id),
    recipient_id uuid NOT NULL REFERENCES auth.users(id),
    type text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '01:00:00'::interval)
);

CREATE TABLE IF NOT EXISTS session_states (
    session_id uuid PRIMARY KEY,
    active_provider text DEFAULT 'none'::text,
    fallback_provider text DEFAULT 'p2p'::text,
    room_info jsonb DEFAULT '{}'::jsonb,
    last_provider_change timestamp with time zone DEFAULT now(),
    reconnection_in_progress boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_providers (
    session_id uuid NOT NULL,
    provider text NOT NULL,
    selected_by uuid NOT NULL REFERENCES auth.users(id),
    selected_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (session_id, provider)
);

CREATE TABLE IF NOT EXISTS session_recovery_states (
    session_id uuid PRIMARY KEY,
    active_provider text NOT NULL,
    room_info jsonb DEFAULT '{}'::jsonb,
    participants jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_recovery_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid,
    recovery_type text NOT NULL,
    initiated_by uuid REFERENCES auth.users(id),
    trigger_reason text,
    from_state jsonb DEFAULT '{}'::jsonb,
    to_state jsonb DEFAULT '{}'::jsonb,
    success boolean,
    recovery_duration_ms integer,
    error_message text,
    user_count integer,
    avg_quality_before numeric,
    avg_quality_after numeric,
    network_conditions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS session_presence (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    joined_at timestamp with time zone DEFAULT now(),
    last_seen timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text NOT NULL CHECK (status IN ('active', 'idle', 'disconnected'))
);

CREATE TABLE IF NOT EXISTS session_health (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid,
    user_id uuid REFERENCES auth.users(id),
    connection_status text DEFAULT 'connecting'::text,
    video_quality text,
    audio_quality text,
    network_latency integer,
    packet_loss_percent numeric,
    bandwidth_kbps integer,
    device_type text,
    browser_info jsonb DEFAULT '{}'::jsonb,
    network_type text,
    last_ping timestamp with time zone DEFAULT now(),
    connected_at timestamp with time zone,
    disconnected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_quality_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    avg_latency integer NOT NULL,
    max_latency integer NOT NULL,
    min_latency integer NOT NULL,
    avg_packet_loss numeric NOT NULL,
    max_packet_loss numeric NOT NULL,
    avg_bandwidth integer NOT NULL,
    min_bandwidth integer NOT NULL,
    max_bandwidth integer NOT NULL,
    avg_frame_rate integer NOT NULL,
    min_frame_rate integer NOT NULL,
    resolutions text[] NOT NULL,
    quality_changes integer DEFAULT 0 NOT NULL,
    connection_drops integer DEFAULT 0 NOT NULL,
    recovery_attempts integer DEFAULT 0 NOT NULL,
    overall_quality text NOT NULL,
    quality_score integer NOT NULL,
    session_duration integer NOT NULL,
    quality_duration integer NOT NULL,
    session_started timestamp with time zone NOT NULL,
    session_ended timestamp with time zone NOT NULL,
    provider text NOT NULL,
    device_info jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_session_states (
    session_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    user_name text DEFAULT 'User'::text NOT NULL,
    connection_state text DEFAULT 'connecting'::text,
    current_provider text DEFAULT 'none'::text,
    is_audio_muted boolean DEFAULT false,
    is_video_off boolean DEFAULT false,
    last_seen timestamp with time zone DEFAULT now(),
    reconnect_attempts integer DEFAULT 0,
    device_info jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (session_id, user_id)
);

-- ============================================================================
-- TOPICS ARCHIVE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS topics_archive (
    id uuid PRIMARY KEY,
    title text NOT NULL,
    description text,
    author_id uuid NOT NULL REFERENCES auth.users(id),
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    participants uuid[] DEFAULT '{}'::uuid[],
    requests jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    archived_at timestamp with time zone DEFAULT now(),
    archive_reason text
);

CREATE TABLE IF NOT EXISTS topics_deleted_log (
    id uuid,
    title text,
    author_id uuid,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    participants uuid[],
    requests jsonb,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON blog_likes(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_signaling_session_id ON signaling(session_id);
CREATE INDEX IF NOT EXISTS idx_signaling_expires_at ON signaling(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_presence_session_id ON session_presence(session_id);
CREATE INDEX IF NOT EXISTS idx_session_health_session_id ON session_health(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE signaling ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recovery_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recovery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_quality_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics_deleted_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BASIC RLS POLICIES (Add more specific ones as needed)
-- ============================================================================

-- Public can read published blog posts
CREATE POLICY "Public can read published blog posts" ON blog_posts
    FOR SELECT USING (status = 'published');

-- Admins can manage everything
CREATE POLICY "Admins can manage blog posts" ON blog_posts
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM admin_roles WHERE is_active = true)
    );

-- Users can view their own data
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email preferences" ON user_email_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Signaling policies
CREATE POLICY "Users can send signaling" ON signaling
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can receive signaling" ON signaling
    FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Session presence policies
CREATE POLICY "Users can view session presence" ON session_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON session_presence
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
    '✅ Migration Complete!' as status,
    COUNT(*) as tables_added
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'admin_actions', 'admin_notifications', 'blog_posts', 'blog_likes',
    'email_templates', 'email_campaigns', 'email_campaign_sends',
    'user_email_preferences', 'security_logs', 'device_fingerprints',
    'user_sessions', 'user_roles', 'user_permissions', 'user_status',
    'signaling', 'session_states', 'session_providers', 'session_recovery_states',
    'session_recovery_log', 'session_presence', 'session_health',
    'session_quality_logs', 'user_session_states', 'topics_archive', 'topics_deleted_log'
);
