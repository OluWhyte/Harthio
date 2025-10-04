# Setup Instructions for Requests System

## Current Status
❌ The `join_requests` table doesn't exist yet in your database.

## Quick Fix

### Option 1: Run SQL in Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `create-and-setup-requests.sql`
4. Click **Run**

### Option 2: Manual Steps
If you prefer to run step by step:

1. **Create the table:**
```sql
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
```

2. **Enable RLS:**
```sql
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
```

3. **Run the complete script:** `create-and-setup-requests.sql`

## What This Will Do

✅ **Create the secure join_requests table**  
✅ **Set up Row Level Security policies**  
✅ **Create database functions for request management**  
✅ **Clear any existing requests to start fresh**  
✅ **Set up proper indexes for performance**  

## After Running the SQL

1. **Refresh your app** - the requests page should work
2. **Test the flow:**
   - User A creates a topic
   - User B sends a request to User A's topic
   - User A sees the request in "Received" tab
   - User A approves it
   - User B sees their request in "Sent" tab

## Expected Behavior

- **Topic Authors**: See requests for their topics in "Received" tab
- **All Users**: See requests they sent in "Sent" tab  
- **Security**: Users only see their own data
- **Auto-cleanup**: When 1 request is approved, all others are cleared

The system will be fully secure and working correctly once you run the SQL!