-- Add missing columns to sobriety_trackers table in PRODUCTION
-- These columns are required by the tracker creation code

-- CRITICAL: These two columns are inserted by createTracker()
ALTER TABLE public.sobriety_trackers
ADD COLUMN IF NOT EXISTS chosen_image TEXT,
ADD COLUMN IF NOT EXISTS piece_unlock_order INTEGER[];

-- OPTIONAL: These are for future gamification features (not currently inserted)
ALTER TABLE public.sobriety_trackers
ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS pieces_unlocked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pieces INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS days_per_piece INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS total_attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_best_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sober_days INTEGER DEFAULT 0;

-- Verification
SELECT 'Gamification columns added successfully!' as status;

-- Check the updated schema
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'sobriety_trackers'
ORDER BY ordinal_position;
