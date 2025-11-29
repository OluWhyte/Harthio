-- Add missing admin views and functions to dev database
-- These are needed for admin panel functionality

-- ============================================================================
-- 1. CREATE is_admin() FUNCTION (from production)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = auth.uid()
  );
END;
$function$;

-- ============================================================================
-- 2. CREATE device_analytics VIEW (from production)
-- ============================================================================

CREATE OR REPLACE VIEW public.device_analytics AS 
SELECT (device_info ->> 'device_type'::text) AS device_type,
    (device_info ->> 'browser'::text) AS browser,
    (device_info ->> 'os'::text) AS operating_system,
    (location_info ->> 'country'::text) AS country,
    count(DISTINCT user_id) AS unique_users,
    count(*) AS total_sessions,
    avg(session_duration_minutes) AS avg_session_duration,
    count(
        CASE
            WHEN (created_at >= (now() - '7 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS sessions_last_7_days,
    count(
        CASE
            WHEN (created_at >= (now() - '30 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS sessions_last_30_days
FROM user_sessions
WHERE (device_info IS NOT NULL)
GROUP BY (device_info ->> 'device_type'::text), (device_info ->> 'browser'::text), (device_info ->> 'os'::text), (location_info ->> 'country'::text);

-- ============================================================================
-- 3. CREATE security_dashboard VIEW (from production)
-- ============================================================================

CREATE OR REPLACE VIEW public.security_dashboard AS 
SELECT event_type,
    severity,
    count(*) AS event_count,
    count(DISTINCT user_id) AS affected_users,
    count(DISTINCT ip_address) AS unique_ips,
    max(created_at) AS last_occurrence
FROM security_logs
WHERE (created_at > (now() - '30 days'::interval))
GROUP BY event_type, severity
ORDER BY (count(*)) DESC;

-- ============================================================================
-- 4. CREATE user_footprints VIEW (from production)
-- ============================================================================

CREATE OR REPLACE VIEW public.user_footprints AS 
SELECT 
  u.id AS user_id,
  u.email,
  u.display_name,
  COALESCE(count(DISTINCT us.id), 0::bigint) AS total_sessions,
  COALESCE(count(DISTINCT us.device_fingerprint), 0::bigint) AS unique_devices,
  COALESCE(count(DISTINCT us.ip_address), 0::bigint) AS unique_ip_addresses,
  COALESCE(count(DISTINCT (us.location_info ->> 'country'::text)), 0::bigint) AS unique_countries,
  min(us.created_at) AS first_session,
  max(us.last_active) AS last_session,
  COALESCE(avg(us.session_duration_minutes), 0::numeric) AS avg_session_duration,
  COALESCE(sum(us.session_duration_minutes), 0::bigint) AS total_session_time,
  COALESCE(count(
    CASE
      WHEN (us.created_at >= (now() - '7 days'::interval)) THEN 1
      ELSE NULL::integer
    END), 0::bigint) AS sessions_last_7_days,
  COALESCE(count(
    CASE
      WHEN (us.created_at >= (now() - '30 days'::interval)) THEN 1
      ELSE NULL::integer
    END), 0::bigint) AS sessions_last_30_days,
  '{}'::jsonb AS most_used_device,
  '{}'::jsonb AS most_common_location,
  'Medium'::text AS engagement_level
FROM (users u
  LEFT JOIN user_sessions us ON ((u.id = us.user_id)))
GROUP BY u.id, u.email, u.display_name;

-- ============================================================================
-- 5. CREATE user_management_view VIEW (from production)
-- ============================================================================

CREATE OR REPLACE VIEW public.user_management_view AS 
SELECT 
  au.id AS user_id,
  au.email,
  u.display_name,
  u.first_name,
  u.last_name,
  au.created_at AS user_created_at,
  u.updated_at AS user_updated_at,
  COALESCE(ar.role, 'user'::text) AS "current_role",
  ar.created_at AS role_granted_at,
  NULL::timestamp with time zone AS role_expires_at,
  'active'::text AS current_status,
  NULL::text AS status_reason,
  COALESCE(u.updated_at, au.created_at) AS status_changed_at,
  (SELECT count(*) AS count
    FROM topics
    WHERE (topics.author_id = au.id)) AS total_sessions,
  au.last_sign_in_at AS last_login,
  (ar.role IS NOT NULL) AS is_admin
FROM ((auth.users au
  LEFT JOIN users u ON ((au.id = u.id)))
  LEFT JOIN admin_roles ar ON ((au.id = ar.user_id)))
WHERE is_admin();

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.device_analytics TO authenticated;
GRANT SELECT ON public.security_dashboard TO authenticated;
GRANT SELECT ON public.user_footprints TO authenticated;
GRANT SELECT ON public.user_management_view TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  'Views and functions created successfully!' as status,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'is_admin') as has_is_admin_function,
  (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public' AND viewname = 'device_analytics') as has_device_analytics,
  (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public' AND viewname = 'security_dashboard') as has_security_dashboard,
  (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public' AND viewname = 'user_footprints') as has_user_footprints,
  (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public' AND viewname = 'user_management_view') as has_user_management_view;
