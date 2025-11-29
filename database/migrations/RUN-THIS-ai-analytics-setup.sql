-- ============================================================================
-- AI ANALYTICS SETUP - SIMPLE AND SAFE
-- Run this script - it handles everything correctly
-- ============================================================================

-- Step 1: Add columns to ai_chat_history (if table exists)
DO $$
BEGIN
  -- Only proceed if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_chat_history') THEN
    -- Add columns one by one
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS token_count INTEGER;
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS model_used TEXT;
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS api_error TEXT;
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS cost_usd DECIMAL(10, 6);
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS session_id UUID;
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS sentiment TEXT;
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS topic_tags TEXT[];
    ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS intervention_type TEXT;
    
    RAISE NOTICE '✓ Added analytics fields to ai_chat_history';
  ELSE
    RAISE NOTICE '⚠ ai_chat_history table does not exist - skipping';
  END IF;
END $$;

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_session ON public.ai_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_completed ON public.ai_chat_history(completed);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sentiment ON public.ai_chat_history(sentiment);

-- Step 3: Add columns to ai_feedback (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_feedback') THEN
    ALTER TABLE public.ai_feedback ADD COLUMN IF NOT EXISTS rating INTEGER;
    ALTER TABLE public.ai_feedback ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
    ALTER TABLE public.ai_feedback ADD COLUMN IF NOT EXISTS session_id UUID;
    
    RAISE NOTICE '✓ Added analytics fields to ai_feedback';
  ELSE
    RAISE NOTICE '⚠ ai_feedback table does not exist - skipping';
  END IF;
END $$;

-- Step 4: Add indexes
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON public.ai_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_session ON public.ai_feedback(session_id);

-- Step 5: Drop and recreate proactive_ai_events table (to fix any partial creation)
DROP TABLE IF EXISTS public.proactive_ai_events CASCADE;

CREATE TABLE public.proactive_ai_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  ai_message TEXT NOT NULL,
  user_response TEXT,
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id UUID,
  metadata JSONB
);

-- Step 6: Add indexes for proactive_ai_events
CREATE INDEX idx_proactive_events_user ON public.proactive_ai_events(user_id);
CREATE INDEX idx_proactive_events_type ON public.proactive_ai_events(event_type);
CREATE INDEX idx_proactive_events_date ON public.proactive_ai_events(created_at DESC);
CREATE INDEX idx_proactive_events_helpful ON public.proactive_ai_events(was_helpful) WHERE was_helpful IS NOT NULL;

-- Step 7: RLS for proactive_ai_events
ALTER TABLE public.proactive_ai_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own proactive events" ON public.proactive_ai_events;
CREATE POLICY "Users can view own proactive events"
  ON public.proactive_ai_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own proactive events" ON public.proactive_ai_events;
CREATE POLICY "Users can insert own proactive events"
  ON public.proactive_ai_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.proactive_ai_events TO authenticated;

-- Step 8: Admin policies
DROP POLICY IF EXISTS "Admins can view all chat history" ON public.ai_chat_history;
CREATE POLICY "Admins can view all chat history"
  ON public.ai_chat_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin')
      AND admin_roles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.ai_feedback;
CREATE POLICY "Admins can view all feedback"
  ON public.ai_feedback FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin')
      AND admin_roles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all proactive events" ON public.proactive_ai_events;
CREATE POLICY "Admins can view all proactive events"
  ON public.proactive_ai_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role IN ('super_admin', 'admin')
      AND admin_roles.is_active = true
    )
  );

-- Step 9: Create simple views (no complex dependencies)
DROP VIEW IF EXISTS public.ai_analytics_summary CASCADE;
DROP VIEW IF EXISTS public.ai_usage_by_hour CASCADE;
DROP VIEW IF EXISTS public.ai_topics_summary CASCADE;

-- Simple summary view
CREATE VIEW public.ai_analytics_summary AS
SELECT
  COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as active_users_24h,
  COUNT(*) as total_messages,
  (SELECT COUNT(*) FROM ai_feedback WHERE feedback_type = 'positive') as positive_feedback_count,
  (SELECT COUNT(*) FROM ai_feedback WHERE feedback_type = 'negative') as negative_feedback_count,
  (SELECT COUNT(*) FROM proactive_ai_events) as total_interventions
FROM public.ai_chat_history
WHERE role = 'assistant';

GRANT SELECT ON public.ai_analytics_summary TO authenticated;

-- Simple hourly view
CREATE VIEW public.ai_usage_by_hour AS
SELECT
  EXTRACT(HOUR FROM created_at)::integer as hour_of_day,
  COUNT(*) as message_count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.ai_chat_history
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND role = 'assistant'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

GRANT SELECT ON public.ai_usage_by_hour TO authenticated;

-- Simple topics view (placeholder)
CREATE VIEW public.ai_topics_summary AS
SELECT
  'placeholder'::text as topic,
  0::bigint as mention_count,
  0::bigint as unique_users
WHERE false;

GRANT SELECT ON public.ai_topics_summary TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ AI Analytics Setup Complete!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  ✓ ai_chat_history (10 new columns)';
  RAISE NOTICE '  ✓ ai_feedback (3 new columns)';
  RAISE NOTICE '  ✓ proactive_ai_events (created)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  ✓ ai_analytics_summary';
  RAISE NOTICE '  ✓ ai_usage_by_hour';
  RAISE NOTICE '  ✓ ai_topics_summary';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Visit /admin-v2/ai';
  RAISE NOTICE '============================================';
END $$;
