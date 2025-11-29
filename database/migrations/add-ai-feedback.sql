-- AI Feedback System
-- Allows users to rate AI responses with thumbs up/down
-- Critical for AI quality improvement and safety monitoring

-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  reason TEXT CHECK (reason IN ('not_helpful', 'incorrect', 'misunderstood', 'inappropriate', 'other')),
  reason_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_date ON ai_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_reason ON ai_feedback(reason) WHERE feedback_type = 'negative';

-- Row Level Security
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON ai_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON ai_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can view all feedback (for future admin dashboard)
-- Note: Uncomment this when admin system is implemented
-- CREATE POLICY "Admins can view all feedback"
--   ON ai_feedback
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE user_profiles.user_id = auth.uid()
--       AND user_profiles.is_admin = true
--     )
--   );

-- Grant permissions
GRANT SELECT, INSERT ON ai_feedback TO authenticated;

-- Comments
COMMENT ON TABLE ai_feedback IS 'Stores user feedback on AI responses for quality improvement';
COMMENT ON COLUMN ai_feedback.message_id IS 'Unique identifier for the message (timestamp-based)';
COMMENT ON COLUMN ai_feedback.user_message IS 'The user message that prompted the AI response';
COMMENT ON COLUMN ai_feedback.ai_response IS 'The AI response being rated';
COMMENT ON COLUMN ai_feedback.feedback_type IS 'positive (thumbs up) or negative (thumbs down)';
COMMENT ON COLUMN ai_feedback.reason IS 'Category of negative feedback';
COMMENT ON COLUMN ai_feedback.reason_details IS 'Free text explanation from user';
