-- AI Chat History Table
-- Stores conversation history between users and Harthio AI
-- Allows continuity across sessions and better context for AI

-- Create ai_chat_history table
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  cbt_flow TEXT, -- Track if message is part of CBT flow (thought-challenger, breathing, etc.)
  is_crisis BOOLEAN DEFAULT FALSE -- Flag crisis-related messages
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON public.ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON public.ai_chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_created ON public.ai_chat_history(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own chat history
CREATE POLICY "Users can view own chat history"
  ON public.ai_chat_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert own messages"
  ON public.ai_chat_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own chat history
CREATE POLICY "Users can delete own chat history"
  ON public.ai_chat_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.ai_chat_history TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comment
COMMENT ON TABLE public.ai_chat_history IS 'Stores AI chat conversation history for continuity and context';
