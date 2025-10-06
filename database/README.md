# Database Scripts

This folder contains all SQL scripts for setting up and maintaining the Harthio database.

## Setup Scripts (Run in Order)

1. **`schema.sql`** - Main database schema with all tables
2. **`setup-requests.sql`** - Join requests system setup
3. **`setup-notifications.sql`** - Notifications table setup
4. **`setup-webrtc.sql`** - WebRTC signaling setup
5. **`enable-realtime.sql`** - Enable real-time subscriptions

## Performance Scripts

- **`performance-indexes.sql`** - Database performance indexes
- **`optimize-indexes.sql`** - Additional optimization indexes

## Security Scripts

- **`security-fixes.sql`** - Message security and RLS policies

## Storage Scripts

- **`setup-storage.sql`** - Supabase storage bucket setup

## Usage

### Development Setup
Run these scripts in your Supabase SQL Editor in order:

```sql
-- 1. Main schema
\i schema.sql

-- 2. Features
\i setup-requests.sql
\i setup-notifications.sql
\i setup-webrtc.sql

-- 3. Performance
\i performance-indexes.sql

-- 4. Security
\i security-fixes.sql

-- 5. Enable real-time
\i enable-realtime.sql
```

### Production Setup
Use the same order but verify each script completes successfully before running the next.

## File Descriptions

| File | Purpose | Required |
|------|---------|----------|
| `schema.sql` | Core database tables | ✅ Yes |
| `setup-requests.sql` | Join request system | ✅ Yes |
| `setup-notifications.sql` | Notification system | ✅ Yes |
| `setup-webrtc.sql` | Video calling support | ✅ Yes |
| `performance-indexes.sql` | Query optimization | 🔧 Recommended |
| `security-fixes.sql` | Security enhancements | 🔒 Important |
| `enable-realtime.sql` | Real-time features | ✅ Yes |
| `setup-storage.sql` | File storage | 📁 Optional |