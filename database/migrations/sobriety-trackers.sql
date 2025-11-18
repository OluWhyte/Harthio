-- ============================================================================
-- Sobriety Trackers Feature
-- ============================================================================
-- Track multiple recovery milestones (alcohol, smoking, drugs, etc.)

CREATE TABLE IF NOT EXISTS public.sobriety_trackers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    tracker_type TEXT NOT NULL CHECK (tracker_type IN ('alcohol', 'smoking', 'drugs', 'gambling', 'other')),
    tracker_name TEXT NOT NULL, -- Custom name like "Alcohol Free" or "Smoke Free"
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sobriety_trackers_user 
ON public.sobriety_trackers(user_id, is_active);

-- Row Level Security
ALTER TABLE public.sobriety_trackers ENABLE ROW LEVEL SECURITY;

-- Users can view their own trackers
CREATE POLICY "Users can view own trackers" ON public.sobriety_trackers
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own trackers
CREATE POLICY "Users can create own trackers" ON public.sobriety_trackers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own trackers
CREATE POLICY "Users can update own trackers" ON public.sobriety_trackers
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own trackers
CREATE POLICY "Users can delete own trackers" ON public.sobriety_trackers
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.sobriety_trackers TO authenticated;

-- Verification
SELECT 'Sobriety trackers table created successfully!' as status;
