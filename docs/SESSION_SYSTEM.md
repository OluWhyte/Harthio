# 3-State Session System

## Overview
Implementation of a comprehensive session management system with three distinct states and proper request handling.

## Session States

### 1. Open Sessions
- **Status**: `open`
- **Behavior**: Anyone can join directly
- **Use Case**: Public conversations, open discussions

### 2. Request-to-Join Sessions  
- **Status**: `request_to_join`
- **Behavior**: Users must request permission to join
- **Use Case**: Moderated conversations, selective participation

### 3. Private Sessions
- **Status**: `private` 
- **Behavior**: Invitation-only, no public visibility
- **Use Case**: Personal conversations, confidential discussions

## Request Flow

### For Request-to-Join Sessions
1. **User A** creates session with `request_to_join` status
2. **User B** sends join request with optional message
3. **User A** receives notification and can approve/decline
4. **Upon approval**: User B can join the session
5. **Auto-cleanup**: Other pending requests are cleared when one is approved

## Database Schema

### Topics Table
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'request_to_join', 'private')),
  author_id UUID REFERENCES users(id),
  participants UUID[] DEFAULT '{}',
  max_participants INTEGER DEFAULT 2,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Join Requests Table
```sql
CREATE TABLE join_requests (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, requester_id)
);
```

## Security Features
- Row Level Security (RLS) on all tables
- Users can only see their own requests and requests for their sessions
- Automatic cleanup of conflicting requests
- Proper authorization checks for all operations

## Implementation Files
- `src/app/requests/page.tsx` - Request management interface
- `src/lib/supabase-services.ts` - Database operations
- `create-and-setup-requests.sql` - Database setup script