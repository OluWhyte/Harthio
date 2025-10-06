-- ============================================================================
-- CREATE AND SETUP REQUESTS SYSTEM
-- ============================================================================
-- This script creates the join_requests table and sets up the correct system
-- ============================================================================

-- Step 1: Create the join_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    requester_name TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic_id, requester_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_join_requests_topic_id ON public.join_requests(topic_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester_id ON public.join_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.join_requests(status);

-- Step 3: Enable RLS
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "Topic authors can view requests for their topics" ON public.join_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.join_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON public.join_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.join_requests;
DROP POLICY IF EXISTS "Topic authors can update requests for their topics" ON public.join_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.join_requests;

-- Step 5: Create RLS policies
CREATE POLICY "Topic authors can view requests for their topics" ON public.join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.topics 
            WHERE topics.id = join_requests.topic_id 
            AND topics.author_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own requests" ON public.join_requests
    FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "Users can create their own requests" ON public.join_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own requests" ON public.join_requests
    FOR UPDATE USING (auth.uid() = requester_id);

CREATE POLICY "Topic authors can update requests for their topics" ON public.join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.topics 
            WHERE topics.id = join_requests.topic_id 
            AND topics.author_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own requests" ON public.join_requests
    FOR DELETE USING (auth.uid() = requester_id);

-- Step 6: Grant permissions
GRANT ALL ON public.join_requests TO anon, authenticated;

-- Step 7: Clear all existing requests (now that table exists)
DELETE FROM public.join_requests WHERE true;
UPDATE public.topics SET requests = '[]' WHERE true;

-- Step 8: Drop existing functions if they exist
DROP FUNCTION IF EXISTS add_join_request(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS approve_join_request(UUID, UUID);
DROP FUNCTION IF EXISTS reject_join_request(UUID, UUID);

-- Step 9: Create corrected database functions
CREATE OR REPLACE FUNCTION add_join_request(
    topic_id UUID,
    requester_id UUID,
    requester_name TEXT,
    message TEXT DEFAULT ''
)
RETURNS BOOLEAN AS $$
DECLARE
    topic_author_id UUID;
    topic_participants UUID[];
BEGIN
    -- Get topic info
    SELECT author_id, participants INTO topic_author_id, topic_participants
    FROM public.topics 
    WHERE id = topic_id;
    
    -- Check if topic exists
    IF topic_author_id IS NULL THEN
        RAISE EXCEPTION 'Topic not found';
    END IF;
    
    -- Check if user is trying to request their own topic
    IF topic_author_id = requester_id THEN
        RAISE EXCEPTION 'Cannot request to join your own topic';
    END IF;
    
    -- Check if user is already a participant (correct array comparison)
    IF requester_id = ANY(topic_participants) THEN
        RAISE EXCEPTION 'User is already a participant';
    END IF;
    
    -- Insert the request (replace existing if any)
    INSERT INTO public.join_requests (topic_id, requester_id, requester_name, message)
    VALUES (topic_id, requester_id, requester_name, message)
    ON CONFLICT (topic_id, requester_id) DO UPDATE SET
        message = EXCLUDED.message,
        status = 'pending',
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_join_request(
    topic_id UUID,
    requester_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    topic_author_id UUID;
    current_participants UUID[];
BEGIN
    -- Get topic info
    SELECT author_id, participants INTO topic_author_id, current_participants
    FROM public.topics 
    WHERE id = topic_id;
    
    -- Check if topic exists
    IF topic_author_id IS NULL THEN
        RAISE EXCEPTION 'Topic not found';
    END IF;
    
    -- Check if current user is the topic author
    IF topic_author_id != auth.uid() THEN
        RAISE EXCEPTION 'Only topic author can approve requests';
    END IF;
    
    -- Check if request exists and is pending
    IF NOT EXISTS (
        SELECT 1 FROM public.join_requests 
        WHERE topic_id = approve_join_request.topic_id 
        AND requester_id = approve_join_request.requester_id 
        AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'No pending request found';
    END IF;
    
    -- Add user to participants if not already there
    IF NOT (requester_id = ANY(current_participants)) THEN
        UPDATE public.topics 
        SET participants = array_append(participants, requester_id)
        WHERE id = topic_id;
    END IF;
    
    -- Approve the specific request
    UPDATE public.join_requests 
    SET status = 'approved', updated_at = NOW()
    WHERE topic_id = approve_join_request.topic_id 
    AND requester_id = approve_join_request.requester_id;
    
    -- IMPORTANT: Clear all other pending requests for this topic
    UPDATE public.join_requests 
    SET status = 'rejected', updated_at = NOW()
    WHERE topic_id = approve_join_request.topic_id 
    AND requester_id != approve_join_request.requester_id
    AND status = 'pending';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_join_request(
    topic_id UUID,
    requester_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    topic_author_id UUID;
BEGIN
    -- Get topic author
    SELECT author_id INTO topic_author_id 
    FROM public.topics 
    WHERE id = topic_id;
    
    -- Check if topic exists
    IF topic_author_id IS NULL THEN
        RAISE EXCEPTION 'Topic not found';
    END IF;
    
    -- Check if current user is the topic author OR the requester (for cancellation)
    IF topic_author_id != auth.uid() AND requester_id != auth.uid() THEN
        RAISE EXCEPTION 'Only topic author or requester can reject/cancel requests';
    END IF;
    
    -- Update request status to rejected
    UPDATE public.join_requests 
    SET status = 'rejected', updated_at = NOW()
    WHERE topic_id = reject_join_request.topic_id 
    AND requester_id = reject_join_request.requester_id;
    
    -- If no rows were affected, the request doesn't exist
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_join_request(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_join_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_join_request(UUID, UUID) TO authenticated;

-- Step 11: Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_join_requests_updated_at ON public.join_requests;
CREATE TRIGGER update_join_requests_updated_at 
    BEFORE UPDATE ON public.join_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Join requests system created and setup successfully!' as status;