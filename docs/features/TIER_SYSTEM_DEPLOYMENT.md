# Tier System Deployment Guide

**Status:** Ready to Deploy  
**Phase:** 1 - Database Migration  
**Time:** 5-10 minutes

---

## 🎯 What This Does

This migration adds the freemium tier system to Harthio:
- Adds subscription tier tracking to user profiles
- Creates AI usage tracking for rate limiting
- Adds proactive AI event tracking
- Creates helper functions for tier checking

---

## 📋 Pre-Deployment Checklist

- [ ] Backup database (optional but recommended)
- [ ] Have Supabase dashboard access
- [ ] Confirm you're deploying to correct environment (dev/prod)

---

## 🚀 Deployment Steps

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Harthio project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy & Paste SQL**
   - Open `database/migrations/add-tier-system.sql`
   - Copy entire contents
   - Paste into SQL Editor

4. **Execute**
   - Click "Run" button
   - Wait for completion (should take 5-10 seconds)

5. **Verify**
   - Check output for success messages
   - Look for: "✅ Tier system migration complete!"

### Option 2: Command Line (If exec_sql function exists)

```bash
npm run deploy:db database/migrations/add-tier-system.sql
```

---

## ✅ Verification

After deployment, verify the changes:

### 1. Check User Profiles Table

```sql
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND column_name IN ('subscription_tier', 'trial_start_date', 'trial_end_date', 'is_trial_active')
ORDER BY column_name;
```

**Expected:** 4 rows showing the new columns

### 2. Check AI Usage Table

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'ai_usage';
```

**Expected:** 1 row with 'ai_usage'

### 3. Check Functions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'increment_ai_message_usage',
    'increment_topic_helper_usage',
    'get_user_tier',
    'can_create_tracker'
)
ORDER BY routine_name;
```

**Expected:** 4 rows showing the functions

### 4. Test Tier Function

```sql
-- Replace 'your-user-id' with an actual user ID
SELECT get_user_tier('your-user-id');
```

**Expected:** Returns 'free' or 'pro'

---

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove new columns
ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS trial_start_date,
DROP COLUMN IF EXISTS trial_end_date,
DROP COLUMN IF EXISTS is_trial_active,
DROP COLUMN IF EXISTS subscription_start_date,
DROP COLUMN IF EXISTS subscription_end_date;

-- Drop tables
DROP TABLE IF EXISTS public.proactive_ai_events;
DROP TABLE IF EXISTS public.ai_usage;

-- Drop functions
DROP FUNCTION IF EXISTS increment_ai_message_usage;
DROP FUNCTION IF EXISTS increment_topic_helper_usage;
DROP FUNCTION IF EXISTS get_user_tier;
DROP FUNCTION IF EXISTS can_create_tracker;
DROP FUNCTION IF EXISTS update_ai_usage_updated_at;
```

---

## 📊 What Happens to Existing Users

- All existing users will be set to `subscription_tier = 'free'`
- No data is lost
- Users can continue using the app normally
- Free tier limits will apply immediately

---

## 🐛 Troubleshooting

### Error: "column already exists"
**Solution:** Migration is idempotent, this is safe. The column won't be added twice.

### Error: "permission denied"
**Solution:** Make sure you're using the service role key, not anon key.

### Error: "function does not exist"
**Solution:** Run the migration again, functions will be created.

### Error: "relation does not exist"
**Solution:** Make sure user_profiles table exists. Check your database schema.

---

## 📝 Next Steps After Deployment

1. ✅ Deploy database migration (this step)
2. ⏳ Deploy admin policies (add-tier-admin-policies.sql) - RECOMMENDED
3. ⏳ Deploy backend services (tier-service.ts, ai-rate-limit-service.ts)
4. ⏳ Deploy frontend components
5. ⏳ Update AI API with rate limiting
6. ⏳ Test thoroughly
7. ⏳ Deploy to production

## 🔐 Admin Policies (Optional but Recommended)

After deploying the main migration, deploy admin policies:

**File:** `database/migrations/add-tier-admin-policies.sql`

**What it adds:**
- Admin can view all user subscriptions
- Admin can update user tiers
- Admin can view AI usage stats
- Admin view for subscription management
- Admin functions (upgrade, downgrade, extend trial)

**To deploy:**
1. Open Supabase SQL Editor
2. Copy contents of `database/migrations/add-tier-admin-policies.sql`
3. Paste and run

---

## 🎉 Success Indicators

After successful deployment, you should see:
- ✅ New columns in user_profiles table
- ✅ ai_usage table created
- ✅ proactive_ai_events table created
- ✅ 4 helper functions created
- ✅ All existing users have subscription_tier = 'free'
- ✅ No errors in Supabase logs

---

**Ready to deploy? Open Supabase SQL Editor and run the migration!** 🚀
