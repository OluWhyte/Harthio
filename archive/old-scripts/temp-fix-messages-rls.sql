-- Temporary Fix for Messages RLS Issue
-- This allows message sending while we debug the root cause

-- QUICK FIX: Temporarily disable RLS (use this for immediate testing)
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- After running this, your messages should work immediately
-- Remember to run fix-session-messaging-rls.sql later for proper security

-- Option 2: Add a more permissive policy (SAFER - keeps some security)
/*
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can send messages in their topics only" ON public.messages;
DROP POLICY IF EXISTS "Users can read messages in their topics only" ON public.messages;

-- Create more permissive policies for debugging
CREATE POLICY "Allow authenticated users to send messages (temp)" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Allow authenticated users to read messages (temp)" ON public.messages
  FOR SELECT
  TO authenticated
  USING (true);
*/

-- Note: Remember to re-enable proper RLS after debugging!