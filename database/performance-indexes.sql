-- Performance Optimization Phase 2: Database Indexes
-- Based on actual Harthio database schema

-- ============================================
-- TOPICS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_topics_start_time ON topics(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_topics_author_id ON topics(author_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at DESC);

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- ============================================
-- MESSAGES TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON messages(topic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id, created_at DESC);

-- ============================================
-- RATINGS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_topic_id ON ratings(topic_id);

-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read, created_at DESC) WHERE read = false;

-- ============================================
-- JOIN REQUESTS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_join_requests_topic_id ON join_requests(topic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester_id ON join_requests(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_join_requests_pending ON join_requests(topic_id, status) WHERE status = 'pending';

-- ============================================
-- SOBRIETY TRACKERS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sobriety_trackers_user_id ON sobriety_trackers(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sobriety_trackers_active ON sobriety_trackers(user_id, is_active) WHERE is_active = true;

-- ============================================
-- AI CHAT HISTORY TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_session_id ON ai_chat_history(session_id, created_at DESC);

-- ============================================
-- AI USAGE TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, usage_date DESC);

-- ============================================
-- DAILY CHECKINS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id, created_at DESC);

-- ============================================
-- ANALYZE TABLES
-- ============================================

ANALYZE topics;
ANALYZE users;
ANALYZE messages;
ANALYZE ratings;
ANALYZE notifications;
ANALYZE join_requests;
ANALYZE sobriety_trackers;
ANALYZE ai_chat_history;
ANALYZE ai_usage;
ANALYZE daily_checkins;
