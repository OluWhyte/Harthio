# Fix Missing user_session_states Table

## Problem
The console shows this error:
```
relation "user_session_states" does not exist
```

## Solution
You need to run the `simple-session-setup.sql` script in your Supabase SQL Editor.

## Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the Setup Script**
   - Copy the contents of `scripts/simple-session-setup.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

3. **Verify Success**
   - You should see: `Setup complete! Tables and functions created.`
   - The console errors should disappear

## What This Creates
- `user_session_states` table (fixes the main error)
- `session_states` table (for session coordination)
- `session_health` table (for health monitoring)
- Required functions: `heartbeat_ping`, `update_user_session_state`, etc.
- Proper RLS policies and permissions

## Alternative: Quick Test
If you want to test without the full setup, you can run just this minimal command in Supabase SQL Editor:

```sql
-- Minimal fix - just create the missing table
CREATE TABLE IF NOT EXISTS user_session_states (
  session_id UUID,
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT 'User',
  connection_state TEXT DEFAULT 'connecting',
  current_provider TEXT DEFAULT 'none',
  is_audio_muted BOOLEAN DEFAULT FALSE,
  is_video_off BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reconnect_attempts INTEGER DEFAULT 0,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);

-- Enable RLS and create permissive policy
ALTER TABLE user_session_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_user_session_states" ON user_session_states FOR ALL USING (true);
GRANT ALL ON user_session_states TO authenticated;
```

After running either script, refresh your session page and the console errors should be gone! 🎯