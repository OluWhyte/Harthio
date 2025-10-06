-- ============================================================================
-- ENABLE REAL-TIME SUBSCRIPTIONS
-- ============================================================================
-- This script enables real-time subscriptions for the topics table
-- so that changes are broadcast to all connected clients immediately.
-- ============================================================================

-- Enable real-time for the topics table
ALTER PUBLICATION supabase_realtime ADD TABLE public.topics;

-- Enable real-time for the users table (for profile updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Enable real-time for the messages table (for chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Verify the tables are added to real-time
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';