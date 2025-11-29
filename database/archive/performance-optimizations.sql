-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS FOR USER TRACKING
-- ============================================================================
-- Run these if you experience performance issues

-- 1. Create materialized view for better performance (refreshed periodically)
CREATE MATERIALIZED VIEW user_footprints_cached AS
SELECT 
    us.user_id,
    u.email,
    u.display_name,
    COUNT(DISTINCT us.id) as total_sessions,
    COUNT(DISTINCT us.device_fingerprint) as unique_devices,
    COUNT(DISTINCT us.ip_address) as unique_ip_addresses,
    COUNT(DISTINCT (us.location_info->>'country')) as unique_countries,
    MIN(us.created_at) as first_session,
    MAX(us.last_active) as last_session,
    AVG(us.session_duration_minutes) as avg_session_duration,
    SUM(us.session_duration_minutes) as total_session_time,
    COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as sessions_last_7_days,
    COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as sessions_last_30_days,
    'Medium'::text as engagement_level -- Simplified for performance
FROM user_sessions us
JOIN users u ON u.id = us.user_id
WHERE public.is_admin_user() = true
GROUP BY us.user_id, u.email, u.display_name;

-- Create index on materialized view
CREATE INDEX idx_user_footprints_cached_user_id ON user_footprints_cached(user_id);

-- 2. Function to refresh the materialized view (run every hour)
CREATE OR REPLACE FUNCTION refresh_user_footprints_cache()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_footprints_cached;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Simplified view without expensive subqueries
CREATE OR REPLACE VIEW user_footprints_simple AS
SELECT 
    us.user_id,
    u.email,
    u.display_name,
    COUNT(DISTINCT us.id) as total_sessions,
    COUNT(DISTINCT us.device_fingerprint) as unique_devices,
    COUNT(DISTINCT us.ip_address) as unique_ip_addresses,
    COUNT(DISTINCT (us.location_info->>'country')) as unique_countries,
    MIN(us.created_at) as first_session,
    MAX(us.last_active) as last_session,
    AVG(us.session_duration_minutes) as avg_session_duration,
    SUM(us.session_duration_minutes) as total_session_time,
    COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as sessions_last_7_days,
    COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as sessions_last_30_days,
    -- Simplified engagement calculation
    CASE 
        WHEN COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) >= 5 THEN 'High'::text
        WHEN COUNT(CASE WHEN us.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) >= 2 THEN 'Medium'::text
        ELSE 'Low'::text
    END as engagement_level
FROM user_sessions us
JOIN users u ON u.id = us.user_id
WHERE public.is_admin_user() = true
GROUP BY us.user_id, u.email, u.display_name;

-- 4. Cleanup function to remove old tracking data
CREATE OR REPLACE FUNCTION cleanup_old_tracking_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sessions older than specified days
    DELETE FROM user_sessions 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up orphaned device fingerprints
    DELETE FROM device_fingerprints 
    WHERE last_seen < NOW() - INTERVAL '1 day' * days_to_keep;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;