-- ============================================================================
-- ADD RECOVERY GOALS FIELD TO USERS TABLE
-- ============================================================================
-- Adds recovery_goals field to support v0.3 recovery-focused features
-- ============================================================================

-- Add recovery_goals column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS recovery_goals TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.recovery_goals IS 'User recovery goals and aspirations (max 500 characters)';

-- No RLS changes needed - existing user policies cover this field
