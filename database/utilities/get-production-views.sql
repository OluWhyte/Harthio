-- Get all view definitions from production
-- Run this in PRODUCTION Supabase SQL editor

SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('user_footprints', 'user_management_view')
ORDER BY viewname;

-- Alternative: Get the CREATE VIEW statements
SELECT 
    'CREATE OR REPLACE VIEW ' || schemaname || '.' || viewname || ' AS ' || definition || ';' as create_statement
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('user_footprints', 'user_management_view')
ORDER BY viewname;
