# Production Database Migrations

## 🎯 Required Migrations (Run in Order)

These are the **ONLY** migrations needed for production v0.3:

### 1. **combined.sql** (Base Schema)
**Status**: ✅ Required  
**Purpose**: Creates all core tables and functions
- Tables: users, topics, messages, join_requests, notifications
- Functions: add_join_request, approve_join_request, reject_join_request
- RLS policies for all tables
- Realtime subscriptions

### 2. **daily-checkins.sql** (Recovery Feature)
**Status**: ✅ Required  
**Purpose**: Daily check-in system for recovery tracking
- Table: daily_checkins
- RLS policies
- User can only see their own check-ins

### 3. **sobriety-trackers.sql** (Recovery Feature)
**Status**: ✅ Required  
**Purpose**: Sobriety milestone tracking
- Table: sobriety_trackers
- RLS policies
- Tracks sobriety start dates and milestones

### 4. **visual-journey.sql** (Recovery Feature)
**Status**: ✅ Required  
**Purpose**: Visual progress tracking with photos
- Table: visual_journey
- Storage bucket: journey-photos
- RLS policies for privacy

### 5. **fix-topics-and-rpc.sql** (Bug Fix)
**Status**: ✅ Required  
**Purpose**: Adds missing updated_at column
- Adds `updated_at` column to topics table
- Creates trigger for auto-updating
- Security validations

### 6. **sync-functions-from-production.sql** (Function Sync)
**Status**: ✅ Required for Dev Database  
**Purpose**: Syncs exact production function definitions
- Drops and recreates all join request functions
- Exact copy from production (tested and working)
- Fixes "ambiguous column" errors
- **Run this if join requests fail in dev**

---

## 📁 Other Files (Not Needed for Production)

### Monitoring (Optional - for debugging)
- `monitoring/health-check-queries.sql` - Check database health
- `monitoring/security-audit.sql` - Audit security settings

### Security Fixes (Already Applied in combined.sql)
- All files in `security-fixes/` - These were iterative fixes during development
- **Don't run these** - they're already incorporated into combined.sql

### Experimental/Future Features (Not in v0.3)
- `add-recovery-goals.sql` - Future feature
- `blog-schema.sql` - Not implemented
- `device-tracking-schema.sql` - Not implemented
- `create-topics-archive.sql` - Not implemented
- `enable-pg-cron.sql` - Not needed yet

### Root Level (Legacy/Unused)
- `admin-notifications-table.sql` - Old version
- `email-campaigns-schema.sql` - Not implemented
- `performance-optimizations.sql` - Not needed yet
- `user-management-system.sql` - Already in combined.sql
- `waitlist-email-template.sql` - Not used

---

## 🚀 Quick Setup for New Database

Run these files in Supabase SQL Editor (in order):

```sql
-- 1. Base schema (all core tables)
-- Run: database/migrations/combined.sql

-- 2. Daily check-ins
-- Run: database/migrations/daily-checkins.sql

-- 3. Sobriety trackers
-- Run: database/migrations/sobriety-trackers.sql

-- 4. Visual journey
-- Run: database/migrations/visual-journey.sql

-- 5. Add updated_at column
-- Run: database/migrations/fix-topics-and-rpc.sql

-- 6. Sync functions from production (if join requests fail)
-- Run: database/migrations/sync-functions-from-production.sql
```

That's it! Your database is ready for v0.3.

---

## 🧹 Cleanup Recommendation

Consider moving unused files to an `archive/` folder:
- All `security-fixes/` (already in combined.sql)
- Experimental features not in v0.3
- Legacy root-level files

Keep only:
- `migrations/` (the 5 required files)
- `monitoring/` (useful for debugging)
- `setup/` (admin setup)
