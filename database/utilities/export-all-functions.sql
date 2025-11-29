-- Export ALL functions from production as a complete migration
-- Run this in PRODUCTION Supabase SQL editor
-- Copy the entire output and save as sync-all-production-functions.sql

SELECT string_agg(
  '-- Function: ' || p.proname || E'\n' ||
  pg_get_functiondef(p.oid) || E';\n\n',
  ''
  ORDER BY p.proname
) as complete_migration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f';
