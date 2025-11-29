-- Clear Test User Data (Keep User Accounts)
-- Simple script that deletes from tables that actually exist
-- Run this in Supabase SQL Editor

-- WARNING: This will delete ALL user data. Make sure you're in the correct environment!

BEGIN;

-- Clear all user-generated data tables
DELETE FROM ai_chat_history;
DELETE FROM ai_feedback;
DELETE FROM ai_usage;
DELETE FROM daily_checkins;
DELETE FROM join_requests;
DELETE FROM messages;
DELETE FROM notifications;
DELETE FROM proactive_ai_events;
DELETE FROM ratings;
DELETE FROM sobriety_trackers;
DELETE FROM topics;
DELETE FROM tracker_relapses;

-- Note: We keep the 'users' table intact (user accounts preserved)

-- Show what's left
SELECT 'ai_chat_history' as table_name, COUNT(*) as count FROM ai_chat_history
UNION ALL SELECT 'ai_feedback', COUNT(*) FROM ai_feedback
UNION ALL SELECT 'ai_usage', COUNT(*) FROM ai_usage
UNION ALL SELECT 'daily_checkins', COUNT(*) FROM daily_checkins
UNION ALL SELECT 'join_requests', COUNT(*) FROM join_requests
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'proactive_ai_events', COUNT(*) FROM proactive_ai_events
UNION ALL SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL SELECT 'sobriety_trackers', COUNT(*) FROM sobriety_trackers
UNION ALL SELECT 'topics', COUNT(*) FROM topics
UNION ALL SELECT 'tracker_relapses', COUNT(*) FROM tracker_relapses
UNION ALL SELECT 'users', COUNT(*) FROM users
ORDER BY table_name;

COMMIT;

-- If you want to rollback instead of committing, run:
-- ROLLBACK;
