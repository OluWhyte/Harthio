-- Run this first to see what we have
SELECT 'ai_chat_history columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ai_chat_history'
ORDER BY ordinal_position;

SELECT 'ai_feedback columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ai_feedback'
ORDER BY ordinal_position;

SELECT 'proactive_ai_events exists?' as info;
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'proactive_ai_events'
) as table_exists;

SELECT 'proactive_ai_events columns (if exists):' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'proactive_ai_events'
ORDER BY ordinal_position;
