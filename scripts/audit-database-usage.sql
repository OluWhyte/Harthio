-- Database Usage Audit
-- Run this to check which tables might be unused

-- 1. List all tables with row counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) AS column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check for empty tables
SELECT 
    tablename,
    'SELECT COUNT(*) FROM ' || tablename || ';' AS count_query
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. List all functions
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. List all triggers
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Check for unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY tablename, indexname;

-- 7. Tables that might be candidates for cleanup
-- (Empty tables or tables with very few rows)
DO $$
DECLARE
    r RECORD;
    row_count INTEGER;
BEGIN
    RAISE NOTICE 'Checking for potentially unused tables...';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        EXECUTE 'SELECT COUNT(*) FROM ' || r.tablename INTO row_count;
        
        IF row_count = 0 THEN
            RAISE NOTICE 'EMPTY TABLE: % (0 rows)', r.tablename;
        ELSIF row_count < 10 THEN
            RAISE NOTICE 'SMALL TABLE: % (% rows)', r.tablename, row_count;
        END IF;
    END LOOP;
END $$;

-- 8. Check for tables not referenced in code
-- (Manual check - compare with grep results)
COMMENT ON TABLE profiles IS 'Core user profiles - ACTIVE';
COMMENT ON TABLE sessions IS 'Video call sessions - ACTIVE';
COMMENT ON TABLE session_participants IS 'Session participants - ACTIVE';
COMMENT ON TABLE session_messages IS 'Session chat messages - ACTIVE';
COMMENT ON TABLE session_quality_logs IS 'Quality monitoring - ACTIVE';
COMMENT ON TABLE topics IS 'Session topics - ACTIVE';
COMMENT ON TABLE admin_roles IS 'Admin permissions - ACTIVE';
COMMENT ON TABLE user_ratings IS 'User ratings - ACTIVE';

-- Add comments to potentially unused tables
-- COMMENT ON TABLE <table_name> IS 'POTENTIALLY UNUSED - Check code references';
