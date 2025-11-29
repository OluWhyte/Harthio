-- ============================================================================
-- AI Analytics - Add Missing Fields Only
-- Safe to run on existing tables - only adds columns that don't exist
-- ============================================================================
-- Run this if ai_chat_history and ai_feedback tables already exist
-- This script ONLY adds the new analytics fields
-- ============================================================================

-- ============================================================================
-- PART 1: Add analytics fields to ai_chat_history
-- ============================================================================

-- Add new columns (IF NOT EXISTS is safe)
ALTER TABLE public.ai_chat_history
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS token_count INTEGER,
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS api_error TEXT,
ADD COLUMN IF NOT EXISTS cost_usd DECIMAL(10, 6),
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sentiment TEXT,
ADD COLUMN IF NOT EXISTS topic_tags TEXT[],
ADD COLUMN IF NOT EXISTS intervention_type TEXT;

-- Add constraints if they don't exist
DO $$ 
BEGIN
  -- Add sentiment constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ai_chat_history_sentiment_check'
  ) THEN
    ALTER TABLE public.ai_chat_history
    ADD CONSTRAINT ai_chat_history_sentiment_check 
    CHECK (sentiment IN ('positive', 'neutral', 'negative', 'crisis'));
  END IF;

  -- Add intervention_type constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ai_chat_history_intervention_type_check'
  ) THEN
    ALTER TABLE public.ai_chat_history
    ADD CONSTRAINT ai_chat_history_intervention_type_check 
    CHECK (intervention_type IN ('crisis', 'idle', 'struggling', 'session_assist', 'none'));
  END IF;
END $$;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_ai_chat_session ON public.ai_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_completed ON public.ai_chat_history(completed);
CREATE INDEX IF NOT EXISTS idx_ai_chat_intervention ON public.ai_chat_history(intervention_type) WHERE intervention_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_chat_sentiment ON public.ai_chat_history(sentiment);
CREATE INDEX IF NOT EXISTS idx_ai_chat_api_error ON public.ai_chat_history(api_error) WHERE api_error IS NOT NULL;

-- Add comments
COMMENT ON COLUMN ai_chat_history.response_time_ms IS 'Time taken for AI to generate response in milliseconds';
COMMENT ON COLUMN ai_chat_history.token_count IS 'Number of tokens used in this message';
COMMENT ON COLUMN ai_chat_history.model_used IS 'AI model identifier (e.g., llama-3.3-70b-versatile, deepseek-chat)';
COMMENT ON COLUMN ai_chat_history.cost_usd IS 'Estimated cost of this API call in USD';
COMMENT ON COLUMN ai_chat_history.session_id IS 'Groups messages into conversation sessions';
COMMENT ON COLUMN ai_chat_history.completed IS 'Whether conversation reached natural conclusion';
COMMENT ON COLUMN ai_chat_history.sentiment IS 'Detected sentiment of the message';
COMMENT ON COLUMN ai_chat_history.topic_tags IS 'Array of detected topics/themes';
COMMENT ON COLUMN ai_chat_history.intervention_type IS 'Type of proactive AI intervention if applicable';

-- ============================================================================
-- PART 2: Add analytics fields to ai_feedback
-- ============================================================================

ALTER TABLE public.ai_feedback
ADD COLUMN IF NOT EXISTS rating INTEGER,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS session_id UUID;

-- Add rating constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ai_feedback_rating_check'
  ) THEN
    ALTER TABLE public.ai_feedback
    ADD CONSTRAINT ai_feedback_rating_check 
    CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON public.ai_feedback(rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_feedback_session ON public.ai_feedback(session_id);

-- Add comments
COMMENT ON COLUMN ai_feedback.rating IS 'Optional 1-5 star rating';
COMMENT ON COLUMN ai_feedback.response_time_ms IS 'Response time at feedback submission';
COMMENT ON COLUMN ai_feedback.session_id IS 'Link to conversation session';

-- ============================================================================
-- PART 3: Create proactive_ai_events table (if not exists)
-- ============================================================================

-- Create table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proactive_ai_events') THEN
    CREATE TABLE public.proactive_ai_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK (event_type IN ('crisis_detection', 'idle_intervention', 'struggling_pattern', 'session_assist')),
      trigger_reason TEXT NOT NULL,
      ai_message TEXT NOT NULL,
      user_response TEXT,
      was_helpful BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      session_id UUID,
      metadata JSONB
    );
  END IF;
END $$;

-- Indexes (only create if table and column exist)
CREATE INDEX IF NOT EXISTS idx_proactive_events_user ON public.proactive_ai_events(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_events_type ON public.proactive_ai_events(event_type);
CREATE INDEX IF NOT EXISTS idx_proactive_events_date ON public.proactive_ai_events(created_at DESC);

-- Create index on was_helpful only if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proactive_ai_events' 
    AND column_name = 'was_helpful'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_proactive_events_helpful ON public.proactive_ai_events(was_helpful) WHERE was_helpful IS NOT NULL;
  END IF;
END $$;

-- RLS
ALTER TABLE public.proactive_ai_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own proactive events" ON public.proactive_ai_events;
CREATE POLICY "Users can view own proactive events"
  ON public.proactive_ai_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own proactive events" ON public.proactive_ai_events;
CREATE POLICY "Users can insert own proactive events"
  ON public.proactive_ai_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.proactive_ai_events TO authenticated;

COMMENT ON TABLE proactive_ai_events IS 'Tracks proactive AI interventions and their effectiveness';

-- ============================================================================
-- PART 4: Create/Replace Analytics Views
-- ============================================================================

-- Drop existing views first (safe to recreate)
DROP VIEW IF EXISTS public.ai_analytics_summary;
DROP VIEW IF EXISTS public.ai_usage_by_hour;
DROP VIEW IF EXISTS public.ai_topics_summary;

-- Analytics Summary View
CREATE VIEW public.ai_analytics_summary AS
SELECT
  -- Usage Metrics
  COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as active_users_24h,
  COUNT(DISTINCT session_id) as total_conversations,
  COUNT(*) as total_messages,
  ROUND(AVG(CASE WHEN role = 'assistant' THEN response_time_ms END)) as avg_response_time_ms,
  
  -- Quality Metrics
  (SELECT COUNT(*) FROM ai_feedback WHERE feedback_type = 'positive') as positive_feedback_count,
  (SELECT COUNT(*) FROM ai_feedback WHERE feedback_type = 'negative') as negative_feedback_count,
  (SELECT ROUND(AVG(rating), 2) FROM ai_feedback WHERE rating IS NOT NULL) as avg_rating,
  COUNT(*) FILTER (WHERE completed = true) as completed_conversations,
  
  -- Cost Metrics
  ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd,
  ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_message,
  SUM(token_count) as total_tokens,
  
  -- Intervention Metrics
  (SELECT COUNT(*) FROM proactive_ai_events) as total_interventions,
  (SELECT COUNT(*) FROM proactive_ai_events WHERE was_helpful = true) as successful_interventions,
  (SELECT COUNT(*) FROM proactive_ai_events WHERE event_type = 'crisis_detection') as crisis_interventions,
  
  -- System Health
  COUNT(*) FILTER (WHERE api_error IS NOT NULL) as api_errors,
  COUNT(DISTINCT DATE(created_at)) as days_active
  
FROM public.ai_chat_history
WHERE role = 'assistant';

GRANT SELECT ON public.ai_analytics_summary TO authenticated;
COMMENT ON VIEW ai_analytics_summary IS 'Aggregated AI performance metrics for dashboard';

-- Hourly Usage View
CREATE VIEW public.ai_usage_by_hour AS
SELECT
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as message_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as conversations,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms
FROM public.ai_chat_history
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND role = 'assistant'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

GRANT SELECT ON public.ai_usage_by_hour TO authenticated;
COMMENT ON VIEW ai_usage_by_hour IS 'Hourly usage patterns for peak time analysis';

-- Topic Analysis View
CREATE VIEW public.ai_topics_summary AS
SELECT
  unnest(topic_tags) as topic,
  COUNT(*) as mention_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as conversations
FROM public.ai_chat_history
WHERE topic_tags IS NOT NULL
  AND array_length(topic_tags, 1) > 0
GROUP BY unnest(topic_tags)
ORDER BY mention_count DESC
LIMIT 50;

GRANT SELECT ON public.ai_topics_summary TO authenticated;
COMMENT ON VIEW ai_topics_summary IS 'Most discussed topics in AI conversations';

-- ============================================================================
-- PART 5: Add/Update Admin Policies
-- ============================================================================

-- Admin can view all AI chat history
DROP POLICY IF EXISTS "Admins can view all chat history" ON public.ai_chat_history;
CREATE POLICY "Admins can view all chat history"
  ON public.ai_chat_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin')
      AND admin_roles.is_active = true
    )
  );

-- Admin can view all feedback
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.ai_feedback;
CREATE POLICY "Admins can view all feedback"
  ON public.ai_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin')
      AND admin_roles.is_active = true
    )
  );

-- Admin can view all proactive events
DROP POLICY IF EXISTS "Admins can view all proactive events" ON public.proactive_ai_events;
CREATE POLICY "Admins can view all proactive events"
  ON public.proactive_ai_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin')
      AND admin_roles.is_active = true
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'AI Analytics Fields Added Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New fields added to ai_chat_history:';
  RAISE NOTICE '  ✓ response_time_ms';
  RAISE NOTICE '  ✓ token_count';
  RAISE NOTICE '  ✓ model_used';
  RAISE NOTICE '  ✓ api_error';
  RAISE NOTICE '  ✓ cost_usd';
  RAISE NOTICE '  ✓ session_id';
  RAISE NOTICE '  ✓ completed';
  RAISE NOTICE '  ✓ sentiment';
  RAISE NOTICE '  ✓ topic_tags';
  RAISE NOTICE '  ✓ intervention_type';
  RAISE NOTICE '';
  RAISE NOTICE 'New fields added to ai_feedback:';
  RAISE NOTICE '  ✓ rating';
  RAISE NOTICE '  ✓ response_time_ms';
  RAISE NOTICE '  ✓ session_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables/Views created:';
  RAISE NOTICE '  ✓ proactive_ai_events';
  RAISE NOTICE '  ✓ ai_analytics_summary';
  RAISE NOTICE '  ✓ ai_usage_by_hour';
  RAISE NOTICE '  ✓ ai_topics_summary';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Visit /admin-v2/ai to see dashboard';
  RAISE NOTICE '============================================';
END $$;

-- Verification query
SELECT 
  'ai_chat_history' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'ai_chat_history'
  AND column_name IN ('response_time_ms', 'token_count', 'cost_usd', 'sentiment', 'topic_tags', 'session_id')
ORDER BY column_name;
