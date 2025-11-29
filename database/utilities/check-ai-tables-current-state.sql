-- Check current state of AI tables
-- Run this first to see what exists

-- Check ai_chat_history columns
SELECT 
  'ai_chat_history' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ai_chat_history'
ORDER BY ordinal_position;

-- Check ai_feedback columns
SELECT 
  'ai_feedback' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ai_feedback'
ORDER BY ordinal_position;

-- Check if proactive_ai_events exists
SELECT 
  'proactive_ai_events' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'proactive_ai_events'
ORDER BY ordinal_position;

-- Check existing views
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ai_analytics_summary', 'ai_usage_by_hour', 'ai_topics_summary');
