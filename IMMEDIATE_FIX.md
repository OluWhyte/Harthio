# Immediate Fix for Array Comparison Error

## The Error

```
Error: Failed to add join request: operator does not exist: uuid = uuid[]
```

## Quick Fix

**Run this SQL in your Supabase dashboard immediately:**

```sql
-- Drop and recreate the add_join_request function with correct array handling
DROP FUNCTION IF EXISTS add_join_request(UUID, UUID, TEXT, TEXT);

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

GRANT EXECUTE ON FUNCTION add_join_request(UUID, UUID, TEXT, TEXT) TO authenticated;
```

## What Was Wrong

The function was trying to compare a single UUID with a UUID array incorrectly. The fix:

**Before (broken):**

```sql
IF requester_id = ANY((SELECT participants FROM public.topics WHERE id = topic_id)) THEN
```

**After (fixed):**

```sql
SELECT author_id, participants INTO topic_author_id, topic_participants FROM public.topics WHERE id = topic_id;
IF requester_id = ANY(topic_participants) THEN
```

## After Running This

The "Request to Join" functionality should work immediately. Users will be able to send join requests without the array comparison error.
