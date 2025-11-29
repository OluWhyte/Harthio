-- Add AI Provider Tracking to Chat History
-- Tracks which AI provider (Groq vs DeepSeek) was used for each message
-- Helps monitor costs and quality across providers

-- Add ai_provider column
ALTER TABLE public.ai_chat_history 
ADD COLUMN IF NOT EXISTS ai_provider TEXT CHECK (ai_provider IN ('groq', 'deepseek'));

-- Add index for provider analytics
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_provider 
ON public.ai_chat_history(ai_provider, created_at DESC);

-- Add comment
COMMENT ON COLUMN public.ai_chat_history.ai_provider IS 'AI provider used: groq (premium) or deepseek (cost-effective)';

-- Verify
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_chat_history'
AND column_name = 'ai_provider';

-- Success message
SELECT '✅ AI provider tracking added to chat history!' as status,
       'Groq = premium quality for crisis/Pro users' as groq,
       'DeepSeek = cost-effective for routine conversations' as deepseek;
