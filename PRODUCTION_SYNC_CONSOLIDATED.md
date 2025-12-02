# Production Database Sync - Consolidated Guide

## 📊 Analysis of Existing Guides

I found **4 different production deployment guides**:
1. `PRODUCTION_DEPLOYMENT_GUIDE.md` - Focuses on v0.3.0 AI features only
2. `DEPLOYMENT_WORKFLOW.md` - Full workflow with Supabase CLI
3. `SAFE_DEPLOYMENT_GUIDE.md` - Step-by-step with preview testing
4. `SIMPLE_DEPLOYMENT_GUIDE.md` - Manual SQL approach (no CLI)

**Problem:** They all focus on different subsets of migrations and may be outdated.

---

## 🎯 Current Situation (November 30, 2025)

### What We Know:
- ✅ Dev database has all v0.3.0 features
- ✅ Production database is missing many tables
- ✅ Code is on `develop` branch (not yet in production)
- ✅ Environment variables added to Vercel (GROQ, DEEPSEEK, CRON_SECRET)

### What We Need to Do:
1. **Compare** dev vs production databases
2. **Identify** missing tables/functions in production
3. **Run** only the necessary migrations
4. **Verify** everything works
5. **Deploy** code to production (separate step)

---

## 🔍 Step 1: Compare Databases (DO THIS FIRST)

### Run in DEV Database:
```sql
-- Get all public tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Run in PRODUCTION Database:
```sql
-- Get all public tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Create a Comparison List:
Copy both results and compare side-by-side. Note which tables are **missing in production**.

---

## 📋 Complete Migration List (v0.3.0)

Based on all guides, here are ALL migrations that might be needed:

### Core System Tables
- [ ] `users` - Should already exist
- [ ] `topics` - Should already exist
- [ ] `messages` - Should already exist
- [ ] `admin_roles` - Check if exists

### Email System (NEW in v0.3.0)
- [ ] `email_templates`
- [ ] `email_campaigns`
- [ ] `email_campaign_sends`
- [ ] `user_email_preferences`
- [ ] `automated_email_log`

### AI System (NEW in v0.3.0)
- [ ] `ai_chat_history`
- [ ] `ai_feedback`
- [ ] `ai_user_preferences`
- [ ] `ai_usage`
- [ ] `proactive_ai_events`

### Tier & Credits System (NEW in v0.3.0)
- [ ] `credit_purchases`
- [ ] `subscriptions`
- [ ] `payments`

### Admin System (NEW in v0.3.0)
- [ ] `admin_audit_log`
- [ ] `user_reports`
- [ ] `content_flags`
- [ ] `admin_notifications` (check if exists)

### Recovery Features (NEW in v0.3.0)
- [ ] `sobriety_trackers`
- [ ] `daily_checkins`

### Other Features (NEW in v0.3.0)
- [ ] `archived_sessions`
- [ ] `platform_settings`

---

## 🚀 Step 2: Run Missing Migrations

**IMPORTANT:** Only run migrations for tables that are **missing** in production.

### Migration Files (in order):

1. **Email System**
   - `database/migrations/add-email-templates.sql`
   - `database/migrations/add-automated-email-scheduler.sql`
   - `database/migrations/add-executive-email-template.sql`
   - `database/migrations/add-custom-blank-template.sql`
   - `database/migrations/add-new-features-announcement-email.sql`

2. **AI System**
   - `database/migrations/add-ai-chat-history.sql`
   - `database/migrations/add-ai-feedback.sql`
   - `database/migrations/add-ai-provider-tracking.sql`
   - `database/migrations/007_ai_user_preferences.sql`
   - `database/migrations/RUN-THIS-ai-analytics-setup.sql` (if ai_usage missing)

3. **Tier & Credits**
   - `database/migrations/add-tier-system.sql`
   - `database/migrations/add-credits-system.sql`
   - `database/migrations/add-subscription-system.sql`

4. **Admin System**
   - `database/migrations/admin-roles.sql` (if missing)
   - `database/migrations/add-admin-audit-system.sql`
   - `database/migrations/add-admin-views.sql`

5. **Recovery Features**
   - `database/migrations/sobriety-trackers.sql`
   - `database/migrations/daily-checkins.sql`

6. **Other**
   - `database/migrations/add-session-archive-system.sql`
   - `database/migrations/add-platform-settings.sql`

7. **Security Fixes** (run last)
   - `database/migrations/fix-email-templates-rls.sql`
   - `database/migrations/fix-admin-roles-rls.sql`

---

## ✅ Step 3: Verification

After running migrations, verify in production:

```sql
-- Check all new tables exist
SELECT 
  tablename,
  '✅' as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'email_templates',
  'email_campaigns',
  'automated_email_log',
  'ai_chat_history',
  'ai_feedback',
  'ai_user_preferences',
  'ai_usage',
  'proactive_ai_events',
  'credit_purchases',
  'subscriptions',
  'payments',
  'admin_audit_log',
  'user_reports',
  'content_flags',
  'sobriety_trackers',
  'daily_checkins',
  'archived_sessions',
  'platform_settings'
)
ORDER BY tablename;

-- Count (should match number of tables you added)
SELECT COUNT(*) as new_tables_added
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'email_templates',
  'email_campaigns',
  'automated_email_log',
  'ai_chat_history',
  'ai_feedback',
  'ai_user_preferences',
  'ai_usage',
  'proactive_ai_events',
  'credit_purchases',
  'subscriptions',
  'payments',
  'admin_audit_log',
  'user_reports',
  'content_flags',
  'sobriety_trackers',
  'daily_checkins',
  'archived_sessions',
  'platform_settings'
);
```

---

## 🎯 Step 4: What to Do Next

After database sync is complete:

1. **Test in production** (without deploying new code yet)
   - Existing features should still work
   - New tables should be empty but accessible

2. **Deploy code to production** (separate decision)
   - Merge `develop` → `main`
   - Vercel will auto-deploy
   - New features will go live

3. **Monitor**
   - Check logs for errors
   - Test new features
   - Monitor AI costs

---

## 🆘 Rollback Plan

If something goes wrong:

### Database Rollback
```sql
-- Drop new tables (in reverse order)
DROP TABLE IF EXISTS automated_email_log CASCADE;
DROP TABLE IF EXISTS email_campaign_sends CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS user_email_preferences CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;

DROP TABLE IF EXISTS ai_feedback CASCADE;
DROP TABLE IF EXISTS ai_chat_history CASCADE;
DROP TABLE IF EXISTS ai_user_preferences CASCADE;
DROP TABLE IF EXISTS proactive_ai_events CASCADE;
DROP TABLE IF EXISTS ai_usage CASCADE;

-- etc...
```

### Or Restore from Backup
- Supabase Dashboard → Database → Backups → Restore

---

## 📝 Recommendation

**Before running ANY migrations:**

1. ✅ **Backup production database** (Supabase Dashboard → Backups)
2. ✅ **Run Step 1** (compare databases) and share results
3. ✅ **Create a custom migration plan** based on what's actually missing
4. ✅ **Run migrations during low-traffic time** (early morning)

---

## ✅ COMPARISON COMPLETE

**Results:**
- Dev tables: **48**
- Production tables: **34**
- **Missing: 14 tables**

### Missing Tables:
1. admin_audit_log
2. ai_chat_history
3. ai_feedback
4. ai_usage
5. ai_user_preferences
6. automated_email_log
7. content_flags
8. credit_purchases
9. payments
10. platform_settings
11. proactive_ai_events
12. subscriptions
13. tracker_relapses
14. user_reports

---

## 🚀 MIGRATION CHECKLIST (Run in Order)

### Step 1: Admin System
**File**: `database/migrations/add-admin-audit-system.sql`
- Creates: admin_audit_log, user_reports, content_flags

### Step 2: AI System
Run in order:
1. `database/migrations/add-ai-chat-history.sql`
2. `database/migrations/add-ai-feedback.sql`
3. `database/migrations/007_ai_user_preferences.sql`
4. `database/migrations/add-tier-system.sql` (creates ai_usage, proactive_ai_events)

### Step 3: Credits & Subscriptions
1. `database/migrations/add-credits-system.sql`
2. `database/migrations/add-subscription-system.sql` (creates subscriptions, payments)

### Step 4: Platform Settings
**File**: `database/migrations/add-platform-settings.sql`

### Step 5: Automated Email Scheduler
**File**: `database/migrations/add-automated-email-scheduler.sql`

### Step 6: Tracker Relapses
**File**: `database/migrations/sobriety-trackers.sql`

### Step 7: Email Templates (IMPORTANT!)
Run in order:
1. `database/migrations/add-email-templates.sql` (4 base templates)
2. `database/migrations/add-executive-email-template.sql`
3. `database/migrations/add-custom-blank-template.sql`
4. `database/migrations/add-new-features-announcement-email.sql` (V0.3.0)

**Note:** Production already has `email_templates` table, but it might be empty or have old templates.

### Step 8: RLS & Security Fixes (Run LAST)
1. `database/migrations/fix-email-templates-rls.sql`
2. `database/migrations/fix-admin-roles-rls.sql`

**What these do:**
- Fix Row Level Security policies
- Ensure only admins can access email templates
- Ensure admin roles are properly secured

---

## 🔧 IMPORTANT: What Gets Created

**The migrations will create:**
- ✅ Database tables (14 new tables)
- ✅ Database functions (RPC functions for AI, credits, etc.)
- ✅ RLS policies (security rules)
- ✅ Indexes (for performance)
- ✅ Email templates (7 templates total)
- ✅ Admin access controls

**But you ALSO need to deploy:**

### 1. Cron Job (Automated Emails)
- Already configured in `vercel.json`
- Will work automatically when you deploy code to production
- Requires `CRON_SECRET` in Vercel (already added)

### 2. Code Deployment
After database migration, you need to:
1. Merge `develop` → `main`
2. Push to GitHub
3. Vercel auto-deploys to production
4. New API routes and functions go live

### 3. Environment Variables
Already added to Vercel:
- ✅ CRON_SECRET
- ✅ GROQ_API_KEY_DEV
- ✅ DEEPSEEK_API_KEY_PROD

**So the answer is:** The migrations will fix the database, but you still need to deploy the code separately for the cron jobs and new features to work.

---

## 📋 Complete Deployment Plan

### Phase 1: Database (Tomorrow)
1. Backup production database
2. Run 12 migration files (20-25 min):
   - 6 files for tables/functions
   - 4 files for email templates
   - 2 files for RLS/security
3. Verify 14 new tables exist
4. Verify 7 email templates exist
5. Test existing features still work

### Phase 2: Code Deployment (After Phase 1)
1. Merge `develop` → `main`
2. Push to GitHub
3. Vercel auto-deploys
4. Cron job starts working
5. New features go live

### Phase 3: Verification
1. Test AI chat
2. Test email campaigns
3. Test recovery trackers
4. Check cron job runs at 7 AM
5. Monitor logs

---

## 🆘 Rollback Plan

### Database Rollback
```sql
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

### Code Rollback
- Vercel Dashboard → Deployments → Previous version → Promote to Production

---

## 📝 Summary

**Tomorrow's Task:**
- Run database migrations (Phase 1)
- Takes 15-20 minutes
- Low risk (only creates new tables)

**After Database Sync:**
- Deploy code (Phase 2)
- Takes 2-3 minutes
- Cron jobs and new features go live

**Total Time:** ~25 minutes

Rest well! Everything is ready for tomorrow. 🌙

