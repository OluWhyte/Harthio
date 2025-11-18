# Database Troubleshooting Session Summary

## 🎯 Problem
Join requests were failing in dev database with errors:
- "column reference 'topic_id' is ambiguous"
- "Cannot coerce the result to a single JSON object"

## 🔍 Root Cause
Dev database functions didn't match production. Production had:
1. Proper parameter prefixing (`p_topic_id` instead of `topic_id`)
2. Proper variable prefixing (`v_author_id` instead of `author_id`)
3. Explicit table aliases (`t.id`, `jr.topic_id`)

## ✅ Solution
Created `sync-functions-from-production.sql` that:
1. Drops existing functions
2. Recreates them with exact production definitions
3. Ensures dev matches production perfectly

## 📝 Files Created This Session

### Migrations
1. **fix-topics-and-rpc.sql** - Adds updated_at column + secure wrapper
2. **sync-functions-from-production.sql** - Exact production function copies
3. **fix-ambiguous-column-names.sql** - (Deprecated - use sync instead)

### Documentation
4. **PRODUCTION_MIGRATIONS.md** - Lists only required migrations (6 files)
5. **CLEANUP_PLAN.md** - Plan to archive 20+ unused files
6. **DIAGNOSE_JOIN_REQUEST_ERROR.md** - Troubleshooting guide
7. **SESSION_SUMMARY.md** - This file

### Diagnostic Tools
8. **TEST_JOIN_REQUEST.sql** - Verify database setup
9. **GET_PRODUCTION_FUNCTIONS.sql** - Extract production functions
10. **compare-with-production.sql** - Compare dev vs production

## 🚀 How to Fix Dev Database

Run these in order in Supabase SQL Editor:

```sql
-- 1. If you haven't run base migrations
-- Run: database/migrations/combined.sql
-- Run: database/migrations/daily-checkins.sql
-- Run: database/migrations/sobriety-trackers.sql
-- Run: database/migrations/visual-journey.sql

-- 2. Add updated_at column (if missing)
-- Run: database/migrations/fix-topics-and-rpc.sql

-- 3. Sync functions from production
-- Run: database/migrations/sync-functions-from-production.sql

-- 4. Test it works
-- Run: database/TEST_JOIN_REQUEST.sql
```

## ✅ Expected Results After Fix

1. All 4 functions exist:
   - `add_join_request`
   - `add_join_request_secure`
   - `approve_join_request`
   - `reject_join_request`

2. `join_requests` table exists with 6 RLS policies

3. `topics` table has `updated_at` column

4. Join requests work in the app without errors

## 📊 Database Cleanup Needed

Found 20+ unused files:
- `security-fixes/` (11 files) - Already in combined.sql
- Experimental features (7 files) - Not in v0.3
- Legacy root files (6 files) - Old versions

**Recommendation:** Archive these to keep database/ folder clean

## 🎓 Lessons Learned

1. **Always sync from production** - Don't guess function definitions
2. **Use prefixed parameters** - Avoid ambiguous column references
3. **Document what's actually used** - 20+ unused files cause confusion
4. **Test in dev first** - Catch issues before production
5. **Keep migrations minimal** - Only 6 files needed for v0.3

## 🔄 Next Steps

1. Run `sync-functions-from-production.sql` in dev
2. Test join requests work
3. Consider archiving unused database files
4. Update DEV-DATABASE-SETUP.md with new file list
