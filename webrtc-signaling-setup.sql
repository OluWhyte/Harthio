-- ============================================================================
-- WEBRTC SIGNALING DATABASE SETUP
-- ============================================================================
-- This script creates the signaling infrastructure for WebRTC peer connections
-- Allows participants to exchange offers, answers, and ICE candidates securely
-- ============================================================================

-- Create signaling table for WebRTC negotiation
CREATE TABLE IF NOT EXISTS public.signaling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate', 'connection-state', 'user-joined', 'user-left')),
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create session presence table to track who's currently in sessions
CREATE TABLE IF NOT EXISTS public.session_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left')),
    UNIQUE(session_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_signaling_session_id ON public.signaling(session_id);
CREATE INDEX IF NOT EXISTS idx_signaling_recipient_id ON public.signaling(recipient_id);
CREATE INDEX IF NOT EXISTS idx_signaling_created_at ON public.signaling(created_at);
CREATE INDEX IF NOT EXISTS idx_signaling_expires_at ON public.signaling(expires_at);

-- Indexes for session presence
CREATE INDEX IF NOT EXISTS idx_session_presence_session_id ON public.session_presence(session_id);
CREATE INDEX IF NOT EXISTS idx_session_presence_user_id ON public.session_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_session_presence_status ON public.session_presence(status);
CREATE INDEX IF NOT EXISTS idx_session_presence_last_seen ON public.session_presence(last_seen);

-- Enable Row Level Security
ALTER TABLE public.signaling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only session participants can send/receive signaling data
CREATE POLICY "Participants can send signaling data" ON public.signaling
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.topics 
            WHERE id = session_id 
            AND (author_id = auth.uid() OR auth.uid() = ANY(participants))
        )
    );

CREATE POLICY "Participants can receive signaling data" ON public.signaling
    FOR SELECT USING (
        auth.uid() = recipient_id AND
        EXISTS (
            SELECT 1 FROM public.topics 
            WHERE id = session_id 
            AND (author_id = auth.uid() OR auth.uid() = ANY(participants))
        )
    );

CREATE POLICY "Senders can update their signaling data" ON public.signaling
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Participants can delete expired signaling data" ON public.signaling
    FOR DELETE USING (
        (auth.uid() = sender_id OR auth.uid() = recipient_id) AND
        expires_at < NOW()
    );

-- RLS Policies for session presence
CREATE POLICY "Users can manage their own presence" ON public.session_presence
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Session participants can view presence" ON public.session_presence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.topics 
            WHERE id = session_id 
            AND (author_id = auth.uid() OR auth.uid() = ANY(participants))
        )
    );

-- Function to clean up expired signaling data
CREATE OR REPLACE FUNCTION cleanup_expired_signaling()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.signaling 
    WHERE expires_at < NOW();
    
    -- Also cleanup old presence records (older than 2 hours)
    DELETE FROM public.session_presence 
    WHERE last_seen < NOW() - INTERVAL '2 hours';
END;
$$;

-- Function to handle user joining a session
CREATE OR REPLACE FUNCTION join_session(
    p_session_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Insert or update presence
    INSERT INTO public.session_presence (session_id, user_id, status, last_seen)
    VALUES (p_session_id, p_user_id, 'active', NOW())
    ON CONFLICT (session_id, user_id) 
    DO UPDATE SET 
        status = 'active',
        last_seen = NOW(),
        joined_at = CASE 
            WHEN session_presence.status = 'left' THEN NOW() 
            ELSE session_presence.joined_at 
        END;
    
    RETURN TRUE;
END;
$$;

-- Function to handle user leaving a session
CREATE OR REPLACE FUNCTION leave_session(
    p_session_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Update presence to left
    UPDATE public.session_presence 
    SET status = 'left', last_seen = NOW()
    WHERE session_id = p_session_id AND user_id = p_user_id;
    
    -- Clean up signaling data for this user
    DELETE FROM public.signaling 
    WHERE session_id = p_session_id 
    AND (sender_id = p_user_id OR recipient_id = p_user_id);
    
    RETURN TRUE;
END;
$$;

-- Create a scheduled job to clean up expired signaling data every 10 minutes
-- Note: This requires pg_cron extension, which may not be available on all Supabase plans
-- If not available, the cleanup will happen manually via the application
DO $$
BEGIN
    -- Try to create the cron job, ignore if pg_cron is not available
    BEGIN
        PERFORM cron.schedule('cleanup-signaling', '*/10 * * * *', 'SELECT cleanup_expired_signaling();');
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'pg_cron extension not available, signaling cleanup will be handled by application';
    END;
END;
$$;

-- Enable real-time subscriptions for signaling and presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.signaling;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_presence;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signaling TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_presence TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_signaling() TO authenticated;

-- Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION join_session(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_session(UUID, UUID) TO authenticated;

-- Verify the setup
SELECT 
    schemaname, 
    tablename,
    'signaling table created' as status
FROM pg_tables 
WHERE tablename = 'signaling' AND schemaname = 'public'
UNION ALL
SELECT 
    schemaname, 
    tablename,
    'presence table created' as status
FROM pg_tables 
WHERE tablename = 'session_presence' AND schemaname = 'public';

SELECT 
    schemaname, 
    tablename,
    'real-time enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename IN ('signaling', 'session_presence');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ WebRTC signaling database setup completed successfully!';
    RAISE NOTICE '📡 Real-time subscriptions enabled for signaling and presence tables';
    RAISE NOTICE '🔒 Row Level Security policies configured';
    RAISE NOTICE '👥 User presence tracking enabled';
    RAISE NOTICE '🧹 Automatic cleanup scheduled (if pg_cron available)';
    RAISE NOTICE '🔄 Leave/rejoin functionality implemented';
END;
$$;