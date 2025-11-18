# Dev Database Setup Guide

## 🎯 Current Status
- **Branch**: develop
- **Database**: Need to switch to dev database for testing

## 📋 Step-by-Step Instructions

### **Step 1: Get Your Dev Database Credentials**

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your **DEV project**
3. Go to **Settings → API**
4. Copy these values:
   - Project URL
   - anon/public key
   - service_role key (click "Reveal" to see it)

### **Step 2: Update .env.local**

**IMPORTANT**: We already backed up your production .env.local to `.env.local.backup`

Edit `.env.local` and replace the Supabase credentials:

```bash
# DEV DATABASE - Change back to production when done testing!
NEXT_PUBLIC_SUPABASE_URL=<your_dev_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste_your_dev_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<paste_your_dev_service_role_key>
```

Keep everything else the same (email, TURN server, etc.)

### **Step 3: Run Database Migrations in Dev Database**

Go to your **DEV Supabase project** SQL Editor and run these scripts **in order**:

#### **3.1: Run Combined Schema** (if not already done)
```sql
-- File: database/migrations/combined.sql
-- This creates all the base tables (users, topics, etc.)
```

#### **3.2: Run Daily Check-ins Migration**
```sql
-- File: database/migrations/daily-checkins.sql
-- Creates: daily_checkins table with RLS
```

#### **3.3: Run Sobriety Trackers Migration**
```sql
-- File: database/migrations/sobriety-trackers.sql
-- Creates: sobriety_trackers table with RLS
```

### **Step 4: Start Localhost**

```bash
npm run dev
```

Your localhost will now connect to the **DEV database**!

### **Step 5: Test Everything**

1. Create an account (or use existing test account)
2. Test check-ins
3. Test sobriety trackers
4. Test all new features
5. Break things! It's dev database 😊

### **Step 6: When Done Testing - Restore Production**

**IMPORTANT**: Before switching back to main branch:

```bash
# Restore production credentials
Copy-Item .env.local.backup .env.local -Force

# Or manually edit .env.local and change back to:
NEXT_PUBLIC_SUPABASE_URL=https://ntfazkgpkxaznjlcaeud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_prod_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_prod_service_role_key>
```

## 🔄 Quick Switch Commands

### **Switch to Dev Database:**
```powershell
# Backup production
Copy-Item .env.local .env.local.backup

# Edit .env.local with dev credentials
# Then restart dev server
npm run dev
```

### **Switch Back to Production:**
```powershell
# Restore production
Copy-Item .env.local.backup .env.local -Force

# Restart dev server
npm run dev
```

## 📝 Database Migration Files

All located in `database/migrations/`:

1. **combined.sql** - Base schema (users, topics, sessions, etc.)
2. **daily-checkins.sql** - Check-ins feature
3. **sobriety-trackers.sql** - Sobriety counter feature

## ✅ Checklist

- [ ] Got dev database credentials from Supabase
- [ ] Backed up production .env.local
- [ ] Updated .env.local with dev credentials
- [ ] Ran combined.sql in dev database
- [ ] Ran daily-checkins.sql in dev database
- [ ] Ran sobriety-trackers.sql in dev database
- [ ] Started localhost with `npm run dev`
- [ ] Tested features
- [ ] Restored production .env.local when done

## 🆘 Troubleshooting

**"Can't connect to database"**
- Check if dev database credentials are correct
- Verify Supabase project is active
- Check network connection

**"Table doesn't exist"**
- Run the migration scripts in order
- Check Supabase SQL Editor for errors

**"Lost production credentials"**
- Check `.env.local.backup` file
- Check Vercel dashboard → Environment Variables
- Check production Supabase project → Settings → API

## 🔒 Security Notes

- `.env.local` and `.env.local.backup` are in `.gitignore`
- Never commit database credentials
- Always restore production credentials before pushing to main


---

## 📝 Recent Database Migrations

### Recovery Goals Field (v0.3 - Profile Enhancement)
**Date:** Week 7-8  
**File:** `database/migrations/add-recovery-goals.sql`  
**Purpose:** Adds recovery_goals field to users table for v0.3 recovery-focused features

**To Apply:**
```sql
-- Option 1: Run in Supabase SQL Editor
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS recovery_goals TEXT;

COMMENT ON COLUMN public.users.recovery_goals IS 'User recovery goals and aspirations (max 500 characters)';
```

**Features Enabled:**
- Users can set recovery goals in Edit Profile page
- Goals displayed on Me/Profile overview page
- Helps users articulate and track their recovery journey
- Optional field (not required)

**UI Changes:**
- `/me/edit` - New "Recovery Journey" section with recovery_goals textarea
- `/me` - Recovery goals displayed in highlighted card if set
- Form validation: Max 500 characters
