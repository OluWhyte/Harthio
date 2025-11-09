-- Check ONLY if the session tables exist
-- Run this in Supabase SQL Editor

SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - NEED TO CREATE'
  END as status
FROM (
  VALUES 
    ('user_session_states'),
    ('session_states'), 
    ('session_health')
) AS t(table_name)
ORDER BY table_name;