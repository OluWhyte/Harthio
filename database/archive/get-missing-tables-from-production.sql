-- Get CREATE statements for tables that dev is missing
-- Run this in PRODUCTION and save the output

-- Get full table definitions using pg_dump format
SELECT 
    'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' || E'\n' ||
    string_agg(
        '    ' || column_name || ' ' || 
        CASE 
            WHEN data_type = 'ARRAY' THEN udt_name || '[]'
            WHEN data_type = 'USER-DEFINED' THEN udt_name
            ELSE data_type 
        END ||
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')' 
            ELSE '' 
        END ||
        CASE WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END ||
        CASE WHEN is_nullable = 'NO' 
            THEN ' NOT NULL' 
            ELSE '' 
        END,
        ',' || E'\n'
        ORDER BY ordinal_position
    ) || E'\n' || ');' || E'\n'
    as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'session_health',
    'session_presence', 
    'session_providers',
    'session_quality_logs',
    'session_recovery_log',
    'session_recovery_states',
    'session_states',
    'signaling',
    'user_email_preferences',
    'user_permissions',
    'user_roles',
    'user_session_states',
    'user_sessions',
    'user_status',
    'security_logs',
    'device_fingerprints',
    'blog_posts',
    'blog_likes',
    'email_campaigns',
    'email_templates',
    'email_campaign_sends',
    'admin_actions',
    'admin_notifications',
    'topics_archive',
    'topics_deleted_log'
)
GROUP BY table_name
ORDER BY table_name;
