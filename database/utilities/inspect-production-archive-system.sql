-- ============================================================================
-- PRODUCTION ARCHIVE SYSTEM INSPECTION
-- ============================================================================
-- READ-ONLY queries to document the production archiving system
-- Run these against your PRODUCTION database to understand the flow
-- DO NOT run any INSERT/UPDATE/DELETE commands
-- ============================================================================

-- ============================================================================
-- 1. CHECK IF topics_archive TABLE EXISTS
-- ============================================================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'topics_archive';

-- ============================================================================
-- 2. GET topics_archive TABLE STRUCTURE
-- ============================================================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'topics_archive'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. GET ALL TRIGGERS ON topics TABLE
-- ============================================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'topics'
ORDER BY trigger_name;

-- ============================================================================
-- 4. GET ALL FUNCTIONS RELATED TO ARCHIVING
-- ============================================================================
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%archive%' 
    OR routine_name LIKE '%topic%'
    OR routine_definition LIKE '%topics_archive%'
  )
ORDER BY routine_name;

-- ============================================================================
-- 5. GET INDEXES ON topics_archive TABLE
-- ============================================================================
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'topics_archive'
ORDER BY indexname;

-- ============================================================================
-- 6. GET RLS POLICIES ON topics_archive TABLE
-- ============================================================================
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
WHERE tablename = 'topics_archive'
ORDER BY policyname;

-- ============================================================================
-- 7. CHECK FOR SCHEDULED JOBS (pg_cron)
-- ============================================================================
-- Note: This requires pg_cron extension
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
FROM cron.job
WHERE command LIKE '%archive%' OR command LIKE '%topic%';

-- ============================================================================
-- 8. SAMPLE DATA FROM topics_archive (LIMIT 5)
-- ============================================================================
SELECT 
    id,
    title,
    author_id,
    start_time,
    end_time,
    participants,
    created_at,
    archived_at,
    archive_reason
FROM topics_archive
ORDER BY archived_at DESC
LIMIT 5;

-- ============================================================================
-- 9. COUNT RECORDS IN BOTH TABLES
-- ============================================================================
SELECT 
    'topics' as table_name,
    COUNT(*) as record_count
FROM topics
UNION ALL
SELECT 
    'topics_archive' as table_name,
    COUNT(*) as record_count
FROM topics_archive;

-- ============================================================================
-- 10. CHECK FOR FOREIGN KEY CONSTRAINTS
-- ============================================================================
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'topics_archive';

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. Connect to your PRODUCTION Supabase database
-- 2. Run each query section separately
-- 3. Copy the results to a text file for documentation
-- 4. Share the results so we can recreate the exact system in dev
-- 5. DO NOT modify anything - these are read-only queries
-- ============================================================================
