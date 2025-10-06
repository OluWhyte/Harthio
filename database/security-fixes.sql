-- Fix Message Security Policies
-- Allow both author and participants to view and send messages

-- Drop existing policies
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

-- Create improved policies that include both author and participants
CREATE POLICY "Session members can view messages" ON public.messages
    FOR SELECT USING (
        -- Allow sender to see their own messages
        auth.uid() = sender_id OR 
        -- Allow author of the topic to see messages
        auth.uid() = (SELECT author_id FROM public.topics WHERE id = topic_id) OR
        -- Allow approved participants to see messages
        auth.uid() = ANY((SELECT participants FROM public.topics WHERE id = topic_id)::uuid[])
    );

-- Allow both author and participants to send messages
CREATE POLICY "Session members can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        -- Must be the sender
        auth.uid() = sender_id AND
        (
            -- Must be the author of the topic
            auth.uid() = (SELECT author_id FROM public.topics WHERE id = topic_id) OR
            -- OR must be an approved participant
            auth.uid() = ANY((SELECT participants FROM public.topics WHERE id = topic_id)::uuid[])
        )
    );

-- Also fix the ratings policy to include author
DROP POLICY IF EXISTS "Users can create ratings for sessions they participated in" ON public.ratings;

CREATE POLICY "Session members can create ratings" ON public.ratings
    FOR INSERT WITH CHECK (
        auth.uid() = rater_id AND
        auth.uid() != user_id AND
        (
            -- Must be the author of the topic
            auth.uid() = (SELECT author_id FROM public.topics WHERE id = topic_id) OR
            -- OR must be an approved participant
            auth.uid() = ANY((SELECT participants FROM public.topics WHERE id = topic_id)::uuid[])
        )
    );