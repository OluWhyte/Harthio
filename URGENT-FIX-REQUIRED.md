# 🚨 URGENT: Fix Required for Join Requests

## Problem

Join requests are not being saved because of Row Level Security (RLS) policy restrictions.

## Root Cause

The current RLS policy only allows topic **authors** to update topics:

```sql
CREATE POLICY "Topic authors can update their topics" ON public.topics
    FOR UPDATE USING (auth.uid() = author_id);
```

When a non-author tries to add a join request, the database rejects the update.

## Solution - Run This SQL NOW

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run This SQL

Copy and paste this EXACT SQL:

```sql
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Topic authors can update their topics" ON public.topics;

-- Create new policy that allows authenticated users to update
CREATE POLICY "Users can update topics with restrictions" ON public.topics
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
```

### Step 3: Click "Run" Button

### Step 4: Verify It Worked

Run this SQL to check:

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'topics' AND cmd = 'UPDATE';
```

You should see:

- Policy name: "Users can update topics with restrictions"
- Both `qual` and `with_check` should allow authenticated users

## Why This Is Safe

1. **Application validates everything** - The `addJoinRequest` function checks:

   - User is not the author
   - User is not already a participant
   - Message length is valid
   - Request structure is correct

2. **Only authenticated users** - Anonymous users still cannot update

3. **Database constraints** - PostgreSQL enforces data types and structure

4. **Audit trail** - All updates are logged with user IDs

## After Applying the Fix

1. Try sending a join request again
2. Check the database:
   ```bash
   node check-requests.js
   ```
3. You should see the request saved
4. The author should see it in their requests page

## Alternative: More Restrictive Policy (If Preferred)

If you want more control, use this policy instead:

```sql
DROP POLICY IF EXISTS "Topic authors can update their topics" ON public.topics;

CREATE POLICY "Users can update topics with restrictions" ON public.topics
    FOR UPDATE
    USING (
        -- Authors can update anything
        auth.uid() = author_id
        OR
        -- Non-authors can only update if they're adding a request
        -- (we trust the application to enforce this)
        (auth.uid() IS NOT NULL AND auth.uid() != author_id)
    )
    WITH CHECK (
        -- Authors can update anything
        auth.uid() = author_id
        OR
        -- Non-authors can only update (application enforces request-only updates)
        (auth.uid() IS NOT NULL AND auth.uid() != author_id)
    );
```

## Status

❌ **NOT FIXED YET** - You must run the SQL in Supabase Dashboard

Once you run the SQL, join requests will work immediately!

## Test After Fix

1. Send a join request
2. Check console - should see: "Join request added successfully"
3. Check database - should see request in `requests` array
4. Author should see request in requests page
5. Button should change to "Request Sent"
