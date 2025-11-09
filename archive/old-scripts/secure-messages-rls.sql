-- ============================================================================
-- SECURE: Messages RLS Policy - Only Topic Participants
-- ============================================================================
-- This ensures only users with access to a topic can send/read messages in it

-- Step 1: Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop the permissive policies we created earlier
DROP POLICY IF EXISTS "Allow authenticated users to send messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to edit their own messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to delete their own messages" ON public.messages;

-- Step 3: Create secure policies that check topic participation

-- Policy 1: Users can INSERT messages only in topics they have access to
CREATE POLICY "Users can send messages in their topics only" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated and sender_id must match their auth.uid()
    auth.uid() = sender_id AND
    -- User must be either the topic author OR in the participants array
    EXISTS (
      SELECT 1 FROM topics t 
      WHERE t.id = topic_id 
      AND (
        t.author_id = auth.uid() OR 
        auth.uid() = ANY(t.participants)
      )
    )
  );

-- Policy 2: Users can SELECT messages only from topics they have access to
CREATE POLICY "Users can read messages in their topics only" ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    -- User must be either the topic author OR in the participants array
    EXISTS (
      SELECT 1 FROM topics t 
      WHERE t.id = topic_id 
      AND (
        t.author_id = auth.uid() OR 
        auth.uid() = ANY(t.participants)
      )
    )
  );

-- Policy 3: Users can UPDATE only their own messages (and only in topics they have access to)
CREATE POLICY "Users can edit their own messages in their topics" ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    -- Must be their own message
    auth.uid() = sender_id AND
    -- Must be in a topic they have access to
    EXISTS (
      SELECT 1 FROM topics t 
      WHERE t.id = topic_id 
      AND (
        t.author_id = auth.uid() OR 
        auth.uid() = ANY(t.participants)
      )
    )
  )
  WITH CHECK (
    -- Can only update to keep themselves as sender
    auth.uid() = sender_id
  );

-- Policy 4: Users can DELETE only their own messages (and only in topics they have access to)
CREATE POLICY "Users can delete their own messages in their topics" ON public.messages
  FOR DELETE
  TO authenticated
  USING (
    -- Must be their own message
    auth.uid() = sender_id AND
    -- Must be in a topic they have access to
    EXISTS (
      SELECT 1 FROM topics t 
      WHERE t.id = topic_id 
      AND (
        t.author_id = auth.uid() OR 
        auth.uid() = ANY(t.participants)
      )
    )
  );

-- Step 4: Ensure proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

-- Step 5: Test the policies
SELECT 
  'Secure RLS policies created' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'messages') as total_policies,
  'Only topic participants can send/read messages' as security_level;

-- ============================================================================
-- SECURITY MODEL:
-- ============================================================================
-- 
-- WHO CAN SEND MESSAGES:
-- ✅ Topic author (t.author_id = auth.uid())
-- ✅ Approved participants (auth.uid() = ANY(t.participants))
-- ❌ Random authenticated users (blocked)
-- ❌ Unauthenticated users (blocked)
--
-- WHO CAN READ MESSAGES:
-- ✅ Topic author 
-- ✅ Approved participants
-- ❌ Everyone else (blocked)
--
-- WHO CAN EDIT/DELETE MESSAGES:
-- ✅ Message sender (only their own messages)
-- ✅ Only if they still have access to the topic
-- ❌ Other users (blocked)
--
-- EXAMPLE SCENARIO:
-- - Topic created by User A (author)
-- - User B requests to join and gets approved (added to participants)
-- - User A and User B can send/read messages in this topic
-- - User C (random authenticated user) CANNOT send/read messages
-- - If User B gets removed from participants, they lose message access
-- 
-- ============================================================================