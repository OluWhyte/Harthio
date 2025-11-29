-- Compare tables between dev and production
-- Run this in BOTH databases and compare results

-- List all tables in public schema
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count tables
SELECT COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';

-- Get table names only (easy to compare)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
