-- ============================================================================
-- Daily Check-ins Feature
-- ============================================================================
-- Simple table for tracking daily mood check-ins

CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    mood TEXT NOT NULL CHECK (mood IN ('struggling', 'okay', 'good', 'great')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one check-in per user per day (using unique index with expression)
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_checkins_user_date_unique 
ON public.daily_checkins(user_id, DATE(created_at AT TIME ZONE 'UTC'));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_created 
ON public.daily_checkins(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Users can view their own check-ins
CREATE POLICY "Users can view own check-ins" ON public.daily_checkins
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own check-ins
CREATE POLICY "Users can create own check-ins" ON public.daily_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-ins (same day only)
CREATE POLICY "Users can update own check-ins" ON public.daily_checkins
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
    );

-- Grant permissions
GRANT ALL ON public.daily_checkins TO authenticated;

-- Verification
SELECT 'Daily check-ins table created successfully!' as status;
