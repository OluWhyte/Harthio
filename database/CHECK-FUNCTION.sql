-- Check the actual upgrade_user_to_pro function code
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'upgrade_user_to_pro';
