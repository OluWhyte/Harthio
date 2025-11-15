# Dev/Prod Separation Setup

## What You Need

1. **One extra Supabase project** (for development/testing)
2. **Git branches** (develop + main)
3. **Vercel environment variables** (separate for preview vs production)

## Setup Steps

### Step 1: Create Dev Supabase Project (5 min)

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: **"Harthio Development"**
4. Same region as production
5. Save the password!
6. Wait ~2 minutes for setup

### Step 2: Copy Database Schema to Dev

In your dev Supabase dashboard → SQL Editor, run:
- `database/schema.sql`
- `database/setup-rls.sql`
- `database/setup-functions.sql`

Or use Supabase CLI to copy from production.

### Step 3: Configure Vercel Environment Variables

**For Preview Deployments (develop branch):**

Vercel Dashboard → Settings → Environment Variables → Select **"Preview"**

Add these with your **DEV** Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_DEV_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key
```

**For Production (main branch):**

Already configured, but verify in **"Production"** environment:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROD_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
```

### Step 4: Branches Already Created ✅

- `develop` branch → Uses dev database (via Preview env vars)
- `main` branch → Uses prod database (via Production env vars)  

## Daily Workflow

```bash
# 1. Work on develop branch
git checkout develop
# Make your changes

# 2. Push to see preview deployment (uses DEV database)
git add .
git commit -m "Your changes"
git push origin develop

# 3. Test on preview URL
# Vercel creates: harthio-git-develop.vercel.app

# 4. When ready, merge to production
git checkout main
git merge develop
git push origin main
# Goes live at harthio.com (uses PROD database)
```

## How It Works

**develop branch:**
- Vercel uses "Preview" environment variables
- Connects to DEV Supabase
- Safe to test and break things

**main branch:**
- Vercel uses "Production" environment variables  
- Connects to PROD Supabase
- Live site at harthio.com

## Database Migrations

**Test in dev first:**
```bash
# Link to dev project
supabase link --project-ref YOUR_DEV_PROJECT_ID

# Make changes and test
npm run deploy:db

# Test on preview URL
```

**Then apply to production:**
```bash
# Link to prod project
supabase link --project-ref YOUR_PROD_PROJECT_ID

# Apply same migration
npm run deploy:db
```

## Summary

✅ **One extra database** (dev Supabase)  
✅ **Two branches** (develop + main)  
✅ **Vercel handles the rest** (automatic deployments)  
✅ **Safe testing** (dev database isolated from prod)
