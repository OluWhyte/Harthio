-- ============================================================================
-- Complete Production Functions Migration
-- ============================================================================
-- This adds ALL 56 functions from production to dev
-- Run this ONCE in dev Supabase SQL editor

-- Note: This is a large file but ensures dev matches production exactly
-- Safe to run multiple times (uses CREATE OR REPLACE)

-- Function 1: _ensure_same_user
CREATE OR REPLACE FUNCTION public._ensure_same_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;
end;
$function$;

-- Function 2: add_join_request
CREATE OR REPLACE FUNCTION public.add_join_request(p_topic_id uuid, p_requester_id uuid, p_requester_name text, p_message text DEFAULT ''::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_author_id UUID;
    v_participants UUID[];
BEGIN
    SELECT t.author_id, t.participants 
    INTO v_author_id, v_participants
    FROM public.topics t
    WHERE t.id = p_topic_id;
    
    IF v_author_id IS NULL THEN
        RAISE EXCEPTION 'Topic not found';
    END IF;
    
    IF v_author_id = p_requester_id THEN
        RAISE EXCEPTION 'Cannot request to join your own topic';
    END IF;
    
    IF v_participants IS NOT NULL AND p_requester_id = ANY(v_participants) THEN
        RAISE EXCEPTION 'User is already a participant';
    END IF;
    
    INSERT INTO public.join_requests (topic_id, requester_id, requester_name, message, status)
    VALUES (p_topic_id, p_requester_id, p_requester_name, p_message, 'pending')
    ON CONFLICT (topic_id, requester_id) 
    DO UPDATE SET 
        requester_name = EXCLUDED.requester_name,
        message = EXCLUDED.message,
        status = 'pending',
        updated_at = NOW();
    
    RETURN TRUE;
END;
$function$;

