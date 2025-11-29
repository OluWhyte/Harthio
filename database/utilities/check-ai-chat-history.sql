-- Check if ai_chat_history table exists and is properly configured

-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'ai_chat_history'
) as table_exists;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ai_chat_history'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ai_chat_history'
  AND schemaname = 'public';

-- Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'ai_chat_history'
  AND schemaname = 'public';

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'ai_chat_history'
  AND schemaname = 'public';

-- Count existing messages (if any)
SELECT COUNT(*) as message_count FROM public.ai_chat_history;
