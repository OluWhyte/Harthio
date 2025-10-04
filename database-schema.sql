-- ============================================================================
-- HARTHIO DATABASE SCHEMA
-- ============================================================================
-- Consolidated database schema for Harthio platform
-- This file replaces all previous schema files and provides a single source
-- of truth for the database structure.
--
-- Features:
-- - User management with automatic profile creation
-- - Session/topic management with participant tracking
-- - Real-time messaging system
-- - User rating system with constraints
-- - Row Level Security (RLS) for data protection
-- - Performance optimized with proper indexes
--
-- Version: 2.0
-- Last Updated: 2025-09-22
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table
-- ----------------------------------------------------------------------------
-- Extends Supabase auth.users with application-specific profile data
-- Automatically populated via trigger when users sign up
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    headline TEXT,
    phone_number TEXT,
    phone_country_code TEXT DEFAULT '+1',
    phone_verified BOOLEAN DEFAULT FALSE,
    country TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Topics Table
-- ----------------------------------------------------------------------------
-- Manages conversation sessions with scheduling and participant management
-- Topics are public sessions that users can request to join
CREATE TABLE public.topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    participants UUID[] DEFAULT '{}',
    requests JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Messages Table
-- ----------------------------------------------------------------------------
-- Handles real-time chat messages within sessions
-- Only participants can view and send messages
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Ratings Table
-- ----------------------------------------------------------------------------
-- User feedback system for post-session ratings
-- Five-category rating system with 1-5 scale
CREATE TABLE public.ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rater_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    politeness INTEGER CHECK (politeness >= 1 AND politeness <= 5) NOT NULL,
    relevance INTEGER CHECK (relevance >= 1 AND relevance <= 5) NOT NULL,
    problem_solved INTEGER CHECK (problem_solved >= 1 AND problem_solved <= 5) NOT NULL,
    communication INTEGER CHECK (communication >= 1 AND communication <= 5) NOT NULL,
    professionalism INTEGER CHECK (professionalism >= 1 AND professionalism <= 5) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, rater_id, topic_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Performance optimization indexes for frequently queried columns

-- Topics indexes
CREATE INDEX idx_topics_author_id ON public.topics(author_id);
CREATE INDEX idx_topics_start_time ON public.topics(start_time);
CREATE INDEX idx_topics_participants ON public.topics USING GIN(participants);

-- Messages indexes
CREATE INDEX idx_messages_topic_id ON public.messages(topic_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Ratings indexes
CREATE INDEX idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX idx_ratings_topic_id ON public.ratings(topic_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Updated At Trigger Function
-- ----------------------------------------------------------------------------
-- Generic function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- User Profile Creation Function
-- ----------------------------------------------------------------------------
-- Automatically creates user profile when new user signs up via Supabase Auth
-- Extracts basic information from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract names from metadata
    DECLARE
        first_name_val TEXT := NEW.raw_user_meta_data->>'first_name';
        last_name_val TEXT := NEW.raw_user_meta_data->>'last_name';
        display_name_val TEXT;
    BEGIN
        -- Auto-generate display name from first and last name
        IF first_name_val IS NOT NULL AND last_name_val IS NOT NULL THEN
            display_name_val := TRIM(first_name_val || ' ' || last_name_val);
        ELSIF first_name_val IS NOT NULL THEN
            display_name_val := first_name_val;
        ELSIF last_name_val IS NOT NULL THEN
            display_name_val := last_name_val;
        ELSE
            display_name_val := SPLIT_PART(NEW.email, '@', 1);
        END IF;

        INSERT INTO public.users (id, email, display_name, first_name, last_name, phone_country_code, phone_verified)
        VALUES (
            NEW.id,
            NEW.email,
            display_name_val,
            first_name_val,
            last_name_val,
            '+1',
            FALSE
        );
    END;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth process
        RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables for data protection
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Users Table Policies
-- ----------------------------------------------------------------------------
-- All authenticated users can view profiles (public information)
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can only insert their own profile (via trigger)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Topics Table Policies
-- ----------------------------------------------------------------------------
-- All users can view topics (public sessions)
CREATE POLICY "Anyone can view topics" ON public.topics
    FOR SELECT USING (true);

-- Authenticated users can create topics (must be author)
CREATE POLICY "Authenticated users can create topics" ON public.topics
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Only topic authors can update their topics
CREATE POLICY "Topic authors can update their topics" ON public.topics
    FOR UPDATE USING (auth.uid() = author_id);

-- Only topic authors can delete their topics
CREATE POLICY "Topic authors can delete their topics" ON public.topics
    FOR DELETE USING (auth.uid() = author_id);

-- ----------------------------------------------------------------------------
-- Messages Table Policies
-- ----------------------------------------------------------------------------
-- Only participants can view messages in their sessions
CREATE POLICY "Participants can view messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = ANY((SELECT participants FROM public.topics WHERE id = topic_id)::uuid[])
    );

-- Only participants can send messages in their sessions
CREATE POLICY "Participants can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        auth.uid() = ANY((SELECT participants FROM public.topics WHERE id = topic_id)::uuid[])
    );

-- ----------------------------------------------------------------------------
-- Ratings Table Policies
-- ----------------------------------------------------------------------------
-- All users can view ratings (public reputation)
CREATE POLICY "Users can view ratings" ON public.ratings
    FOR SELECT USING (true);

-- Users can rate others only in sessions they participated in
-- Cannot rate themselves
CREATE POLICY "Users can create ratings for sessions they participated in" ON public.ratings
    FOR INSERT WITH CHECK (
        auth.uid() = rater_id AND
        auth.uid() != user_id AND
        auth.uid() = ANY((SELECT participants FROM public.topics WHERE id = topic_id)::uuid[])
    );

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Grant necessary permissions for Supabase client access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.topics TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
GRANT ALL ON public.ratings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- ============================================================================
-- VALIDATION
-- ============================================================================
-- Simple validation queries to confirm setup
SELECT 
    'Database schema deployed successfully!' as status,
    NOW() as deployed_at;

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================