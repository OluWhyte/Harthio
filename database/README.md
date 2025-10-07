# Database Setup

This directory contains documentation for the Harthio database setup.

## Main Setup File

**`../combined.sql`** - Complete database setup file containing all necessary scripts:
- Main database schema with all tables
- Join requests system setup  
- Notifications table setup
- WebRTC signaling setup
- Performance indexes and optimizations
- Security fixes and RLS policies
- Real-time subscriptions setup
- Storage bucket setup

## Usage

### Single File Setup (Recommended)
Run the combined setup file in the Supabase SQL Editor:

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `../combined.sql`
3. Paste and execute in the SQL Editor
4. Verify all sections complete successfully

```sql
-- All database setup in one file
-- Copy contents from ../combined.sql and run
```

## What's Included

The combined.sql file includes all essential components:

| Component | Purpose | Status |
|-----------|---------|--------|
| Core Schema | Database tables and relationships | ✅ Included |
| Request System | Join request functionality | ✅ Included |
| Notifications | Notification system | ✅ Included |
| WebRTC Setup | Video calling support | ✅ Included |
| Performance | Query optimization indexes | ✅ Included |
| Security | RLS policies and security | ✅ Included |
| Real-time | Real-time subscriptions | ✅ Included |
| Storage | File storage buckets | ✅ Included |

## Verification

After running the combined.sql file, verify the setup by checking:
- All tables are created
- RLS policies are active
- Real-time is enabled for required tables
- Indexes are created for performance