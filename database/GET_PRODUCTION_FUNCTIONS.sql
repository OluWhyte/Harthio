-- Run this in PRODUCTION database to get ALL working function definitions at once

SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN ('add_join_request', 'add_join_request_secure', 'approve_join_request', 'reject_join_request')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;
