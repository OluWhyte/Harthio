-- Sync join request functions from production
-- This replaces dev functions with exact production versions

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.add_join_request(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_join_request_secure(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.approve_join_request(UUID, UUID);
DROP FUNCTION IF EXISTS public.reject_join_request(UUID, UUID);

-- ============================================================================
-- 1. add_join_request (uses join_requests table)
-- ============================================================================
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
    
    -- Insert or update if exists (allows re-requesting after rejection)
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

-- ============================================================================
-- 2. add_join_request_secure (wrapper with extra security - uses JSONB fallback)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_join_request_secure(p_topic_id uuid, p_requester_id uuid, p_requester_name text, p_message text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_requests JSONB;
  v_new_request JSONB;
  v_updated_requests JSONB;
  v_author_id UUID;
  v_participants UUID[];
BEGIN
  -- SECURITY CHECK 1: Only authenticated users can add requests
  IF p_requester_id != auth.uid() THEN
    RAISE EXCEPTION 'Security violation: Cannot add request for another user';
  END IF;
  
  -- Get topic details
  SELECT author_id, requests, participants 
  INTO v_author_id, v_current_requests, v_participants
  FROM topics
  WHERE id = p_topic_id;
  
  -- Check topic exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Topic not found';
  END IF;
  
  -- SECURITY CHECK 2: Cannot request own topic
  IF v_author_id = p_requester_id THEN
    RAISE EXCEPTION 'Cannot request to join your own session';
  END IF;
  
  -- SECURITY CHECK 3: Cannot request if already participant
  IF p_requester_id = ANY(v_participants) THEN
    RAISE EXCEPTION 'Already a participant in this session';
  END IF;
  
  -- Initialize requests array if NULL
  v_current_requests := COALESCE(v_current_requests, '[]'::jsonb);
  
  -- DUPLICATE CHECK: Remove existing request from same user
  v_current_requests := (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(v_current_requests) elem
    WHERE elem->>'requesterId' != p_requester_id::text
  );
  
  -- Create new request
  v_new_request := jsonb_build_object(
    'requesterId', p_requester_id,
    'requesterName', p_requester_name,
    'message', p_message,
    'timestamp', NOW()
  );
  
  -- Add to array
  v_updated_requests := v_current_requests || v_new_request;
  
  -- Update topic (SECURITY DEFINER bypasses RLS)
  UPDATE topics
  SET requests = v_updated_requests
  WHERE id = p_topic_id;
  
  RETURN v_updated_requests;
END;
$function$;

-- ============================================================================
-- 3. approve_join_request
-- ============================================================================
CREATE OR REPLACE FUNCTION public.approve_join_request(p_topic_id uuid, p_requester_id uuid)
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
    
    IF v_author_id != auth.uid() THEN
        RAISE EXCEPTION 'Only topic author can approve requests';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM public.join_requests 
        WHERE topic_id = p_topic_id 
        AND requester_id = p_requester_id 
        AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'No pending request found';
    END IF;
    
    IF v_participants IS NULL THEN
        v_participants := ARRAY[]::UUID[];
    END IF;
    
    IF NOT (p_requester_id = ANY(v_participants)) THEN
        UPDATE public.topics 
        SET participants = array_append(participants, p_requester_id)
        WHERE id = p_topic_id;
    END IF;
    
    UPDATE public.join_requests 
    SET status = 'approved', updated_at = NOW()
    WHERE topic_id = p_topic_id 
    AND requester_id = p_requester_id;
    
    UPDATE public.join_requests 
    SET status = 'rejected', updated_at = NOW()
    WHERE topic_id = p_topic_id 
    AND requester_id != p_requester_id
    AND status = 'pending';
    
    RETURN TRUE;
END;
$function$;

-- ============================================================================
-- 4. reject_join_request
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reject_join_request(p_topic_id uuid, p_requester_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_author_id UUID;
BEGIN
    SELECT t.author_id 
    INTO v_author_id 
    FROM public.topics t
    WHERE t.id = p_topic_id;
    
    IF v_author_id IS NULL THEN
        RAISE EXCEPTION 'Topic not found';
    END IF;
    
    IF v_author_id != auth.uid() AND p_requester_id != auth.uid() THEN
        RAISE EXCEPTION 'Only topic author or requester can reject/cancel requests';
    END IF;
    
    UPDATE public.join_requests 
    SET status = 'rejected', updated_at = NOW()
    WHERE topic_id = p_topic_id 
    AND requester_id = p_requester_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;
    
    RETURN TRUE;
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_join_request(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_join_request_secure(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_join_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_join_request(UUID, UUID) TO authenticated;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Successfully synced all join request functions from production';
    RAISE NOTICE '   - add_join_request: Uses join_requests table';
    RAISE NOTICE '   - add_join_request_secure: Uses JSONB fallback (legacy support)';
    RAISE NOTICE '   - approve_join_request: Synced';
    RAISE NOTICE '   - reject_join_request: Synced';
END $$;
