-- AI User Preferences System
-- Tracks user preferences for personalized AI responses
-- Learns from user feedback to improve AI interactions over time

-- Create ai_user_preferences table
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_tone TEXT DEFAULT 'supportive' CHECK (preferred_tone IN ('casual', 'supportive', 'direct', 'empathetic')),
  preferred_response_length TEXT DEFAULT 'medium' CHECK (preferred_response_length IN ('brief', 'medium', 'detailed')),
  effective_techniques TEXT[] DEFAULT ARRAY[]::TEXT[],
  trigger_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  prefers_questions BOOLEAN DEFAULT true,
  prefers_direct_advice BOOLEAN DEFAULT false,
  check_in_frequency TEXT DEFAULT 'daily' CHECK (check_in_frequency IN ('daily', 'weekly', 'as_needed')),
  positive_response_patterns JSONB DEFAULT '[]'::JSONB,
  negative_response_patterns JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_user_id ON ai_user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_tone ON ai_user_preferences(preferred_tone);

-- Row Level Security
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own AI preferences"
  ON ai_user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own AI preferences"
  ON ai_user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own AI preferences"
  ON ai_user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON ai_user_preferences TO authenticated;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_ai_user_preferences_updated_at
  BEFORE UPDATE ON ai_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_user_preferences_updated_at();

-- Comments for documentation
COMMENT ON TABLE ai_user_preferences IS 'Stores user preferences for personalized AI interactions';
COMMENT ON COLUMN ai_user_preferences.preferred_tone IS 'User preferred communication tone: casual, supportive, direct, or empathetic';
COMMENT ON COLUMN ai_user_preferences.preferred_response_length IS 'Preferred AI response length: brief (1-2 sentences), medium (2-3), or detailed (3-5)';
COMMENT ON COLUMN ai_user_preferences.effective_techniques IS 'Array of techniques that work well for this user (e.g., breathing, grounding)';
COMMENT ON COLUMN ai_user_preferences.trigger_topics IS 'Array of topics to handle carefully (e.g., family, work)';
COMMENT ON COLUMN ai_user_preferences.prefers_questions IS 'Whether user engages better with exploratory questions';
COMMENT ON COLUMN ai_user_preferences.prefers_direct_advice IS 'Whether user prefers direct advice over exploration';
COMMENT ON COLUMN ai_user_preferences.positive_response_patterns IS 'JSONB array of response patterns that received positive feedback';
COMMENT ON COLUMN ai_user_preferences.negative_response_patterns IS 'JSONB array of response patterns that received negative feedback';
