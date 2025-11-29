-- Get ALL functions and views from production
-- Run this in PRODUCTION Supabase SQL editor

-- 1. Get all custom functions
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
ORDER BY p.proname;

-- 2. Get all views
SELECT 
    schemaname,
    viewname,
    'CREATE OR REPLACE VIEW ' || schemaname || '.' || viewname || ' AS ' || definition || ';' as create_statement
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- 3. Count summary
SELECT 
    'Functions' as type,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
UNION ALL
SELECT 
    'Views' as type,
    COUNT(*) as count
FROM pg_views
WHERE schemaname = 'public';
