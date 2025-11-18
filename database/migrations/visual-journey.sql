-- ============================================================================
-- Visual Recovery Journey - Gamification Enhancement
-- ============================================================================
-- Adds visual progress tracking with 3-phase journey (Bridge → Phoenix → Mountain)

-- Add visual journey columns to sobriety_trackers
ALTER TABLE public.sobriety_trackers 
ADD COLUMN IF NOT EXISTS chosen_image TEXT DEFAULT 'bridge' CHECK (chosen_image IN ('bridge', 'phoenix', 'mountain')),
ADD COLUMN IF NOT EXISTS current_phase INT DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 3),
ADD COLUMN IF NOT EXISTS pieces_unlocked INT DEFAULT 0 CHECK (pieces_unlocked BETWEEN 0 AND 30),
ADD COLUMN IF NOT EXISTS total_pieces INT DEFAULT 30,
ADD COLUMN IF NOT EXISTS days_per_piece INT DEFAULT 3;

-- Add relapse tracking columns
ALTER TABLE public.sobriety_trackers
ADD COLUMN IF NOT EXISTS total_attempts INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_best_days INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sober_days INT DEFAULT 0;

-- Create relapse history table
CREATE TABLE IF NOT EXISTS public.tracker_relapses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracker_id UUID REFERENCES public.sobriety_trackers(id) ON DELETE CASCADE NOT NULL,
    relapse_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    days_achieved INT NOT NULL,
    pieces_lost INT NOT NULL,
    pieces_remaining INT NOT NULL,
    lessons_learned TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for relapse history
CREATE INDEX IF NOT EXISTS idx_tracker_relapses_tracker 
ON public.tracker_relapses(tracker_id, relapse_date DESC);

-- Row Level Security for relapses
ALTER TABLE public.tracker_relapses ENABLE ROW LEVEL SECURITY;

-- Users can view their own relapse history
CREATE POLICY "Users can view own relapse history" ON public.tracker_relapses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sobriety_trackers 
            WHERE id = tracker_relapses.tracker_id 
            AND user_id = auth.uid()
        )
    );

-- Users can create their own relapse records
CREATE POLICY "Users can create own relapse records" ON public.tracker_relapses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sobriety_trackers 
            WHERE id = tracker_relapses.tracker_id 
            AND user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.tracker_relapses TO authenticated;

-- Verification
SELECT 'Visual journey enhancement added successfully!' as status;
