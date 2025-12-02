# Production Migration Checklist - v0.3.0

## 📊 Comparison Results
- ✅ Dev tables: **48**
- ✅ Production tables: **34**
- ❌ **Missing in production: 14 tables**

---

## ⚠️ BEFORE YOU START
- [ ] **Backup production database** (Supabase Dashboard → Database → Backups → Create backup)
- [ ] **Confirm low traffic time** (recommended: early morning)
- [ ] **Have rollback plan ready**

---

## 🚀 Migration Steps (Run in Order)

### Step 1: Admin System (3 tables)
**File**: `database/migrations/add-admin-audit-system.sql`

Creates:
- ✅ admin_audit_log
- ✅ user_reports
- ✅ content_flags

**How to run:**
1. Open Supabase Dashboard → Production Project → SQL Editor
2. Copy entire content from `database/migrations/add-admin-audit-system.sql`
3. Paste and click **Run**
4. Verify: Should see "✅ Created" messages

---

### Step 2: AI System (5 tables)
Run these in order:

#### 2a. AI Chat History
**File**: `database/migrations/add-ai-chat-history.sql`
- Creates: ai_chat_history

#### 2b. AI Feedback
**File**: `database/migrations/add-ai-feedback.sql`
- Creates: ai_feedback

#### 2c. AI User Preferences
**File**: `database/migrations/007_ai_user_preferences.sql`
- Creates: ai_user_preferences

#### 2d. AI Tier System
**File**: `database/migrations/add-tier-system.sql`
- Creates: ai_usage, proactive_ai_events

---

### Step 3: Credits & Subscriptions (3 tables)

#### 3a. Credits System
**File**: `database/migrations/add-credits-system.sql`
- Creates: credit_purchases

#### 3b. Subscription System
**File**: `database/migrations/add-subscription-system.sql`
- Creates: subscriptions, payments

---

### Step 4: Platform Settings (1 table)
**File**: `database/migrations/add-platform-settings.sql`
- Creates: platform_settings

---

### Step 5: Automated Email Scheduler (1 table)
**File**: `database/migrations/add-automated-email-scheduler.sql`
- Creates: automated_email_log

---

### Step 6: Tracker Relapses (1 table)
**File**: `database/migrations/sobriety-trackers.sql`
- Should create: tracker_relapses
- ⚠️ Note: sobriety_trackers already exists, this might just add the relapses table

---

## ✅ Verification

After running all migrations, run this in Production SQL Editor:

```sql
-- Check all new tables exist
SELECT tablename, '✅ EXISTS' as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'admin_audit_log',
  'ai_chat_history',
  'ai_feedback',
  'ai_usage',
  'ai_user_preferences',
  'automated_email_log',
  'content_flags',
  'credit_purchases',
  'payments',
  'platform_settings',
  'proactive_ai_events',
  'subscriptions',
  'tracker_relapses',
  'user_reports'
)
ORDER BY tablename;

-- Count (should be 14)
SELECT COUNT(*) as new_tables_added
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'admin_audit_log',
  'ai_chat_history',
  'ai_feedback',
  'ai_usage',
  'ai_user_preferences',
  'automated_email_log',
  'content_flags',
  'credit_purchases',
  'payments',
  'platform_settings',
  'proactive_ai_events',
  'subscriptions',
  'tracker_relapses',
  'user_reports'
);
```

**Expected result**: 14 tables with "✅ EXISTS" status

---

## 🆘 If Something Goes Wrong

### Rollback Option 1: Restore Backup
1. Supabase Dashboard → Database → Backups
2. Find backup created before migration
3. Click "Restore"

### Rollback Option 2: Drop New Tables
```sql
-- Drop in reverse order
DROP TABLE IF EXISTS automated_email_log CASCADE;
DROP TABLE IF EXISTS tracker_relapses CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS credit_purchases CASCADE;
DROP TABLE IF EXISTS proactive_ai_events CASCADE;
DROP TABLE IF EXISTS ai_usage CASCADE;
DROP TABLE IF EXISTS ai_user_preferences CASCADE;
DROP TABLE IF EXISTS ai_feedback CASCADE;
DROP TABLE IF EXISTS ai_chat_history CASCADE;
DROP TABLE IF EXISTS content_flags CASCADE;
DROP TABLE IF EXISTS user_reports CASCADE;
DROP TABLE IF EXISTS admin_audit_log CASCADE;
```

---

## 📋 Quick Summary

**Total migrations to run**: 8 files
**Total tables to create**: 14 tables
**Estimated time**: 15-20 minutes
**Risk level**: Low (all tables are new, no data modifications)

---

## ✅ After Migration Complete

- [ ] Run verification query (should show 14 tables)
- [ ] Test existing features still work (login, sessions, etc.)
- [ ] Production database now matches dev
- [ ] Ready to deploy v0.3.0 code

---

## 🎯 Next Steps After Database Sync

1. **Test production** (existing features should still work)
2. **Deploy code** (merge develop → main, Vercel will auto-deploy)
3. **Test new features** (AI chat, email campaigns, etc.)
4. **Monitor logs** for errors

---

**Ready to start? Begin with Step 1!**
