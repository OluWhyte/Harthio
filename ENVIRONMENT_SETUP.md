# Environment Setup Guide

This guide explains how to separate development and production environments for Harthio.

## Overview

We use separate Supabase projects and environment configurations to ensure:
- Development changes don't affect production data
- Safe testing of new features
- Independent database schemas
- Separate API keys and credentials

## Environment Structure

```
Development (Local)     →  .env.local          →  Dev Supabase Project
Staging (Vercel)        →  Vercel Environment  →  Dev Supabase Project  
Production (Vercel)     →  Vercel Environment  →  Prod Supabase Project
```

## Step 1: Create Separate Supabase Projects

### Production Project (Already exists)
- **Name**: Harthio Production
- **URL**: Your current production Supabase URL
- **Purpose**: Live production data

### Development Project (Create new)
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. **Name**: Harthio Development
4. **Database Password**: Use a strong password (save it!)
5. **Region**: Same as production for consistency
6. Wait for project to be created (~2 minutes)

## Step 2: Set Up Development Database

Once your dev project is ready:

### Option A: Copy Schema from Production (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your production project
supabase link --project-ref YOUR_PROD_PROJECT_ID

# Generate migration from production
supabase db pull

# Link to your development project
supabase link --project-ref YOUR_DEV_PROJECT_ID

# Apply schema to development
supabase db push
```

### Option B: Run SQL Files Manually
1. Go to your dev Supabase dashboard → SQL Editor
2. Run these files in order:
   - `database/schema.sql` (main schema)
   - `database/setup-rls.sql` (security policies)
   - `database/setup-functions.sql` (database functions)
   - Any migration files in `database/migrations/`

## Step 3: Configure Local Development

### Create `.env.local` for Development
```bash
# Copy template
cp env.template .env.local
```

### Fill in Development Values
```env
# Development Supabase (NEW PROJECT)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_DEV_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key

# Local development URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development email (use Resend test mode or separate account)
RESEND_API_KEY=your_dev_resend_key
EMAIL_FROM_ADDRESS=Harthio Dev <dev@harthio.com>

# WebRTC (can use same TURN servers or separate dev credentials)
NEXT_PUBLIC_METERED_DOMAIN=your-domain.metered.live
METERED_API_KEY=your_metered_api_key

# Optional: Development-specific settings
NODE_ENV=development
```

**Important**: `.env.local` is already in `.gitignore` - never commit it!

## Step 4: Configure Vercel Environments

### Production Environment (harthio.com)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Select **Production** environment
3. Add variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROD_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
   NEXT_PUBLIC_APP_URL=https://harthio.com
   (... all other production values)
   ```

### Preview/Staging Environment (Optional but Recommended)
1. In Vercel → Environment Variables
2. Select **Preview** environment
3. Add same variables as development:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_DEV_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
   (... all other dev values)
   ```

This way, preview deployments (from PRs or branches) use the dev database.

## Step 5: Update Git Workflow

### Recommended Branch Strategy

```
main (production)
  ↓
develop (development)
  ↓
feature/* (feature branches)
```

### Workflow:
1. **Development**: Work on `develop` branch or feature branches
   - Uses `.env.local` (dev database)
   - Test locally with `npm run dev`
   
2. **Preview**: Push to feature branch
   - Vercel creates preview deployment
   - Uses Preview environment variables (dev database)
   - Share preview URL for testing
   
3. **Production**: Merge to `main` branch
   - Vercel deploys to production
   - Uses Production environment variables (prod database)
   - Goes live at harthio.com

## Step 6: Database Migration Strategy

### For Development
```bash
# Make changes to dev database
# Test thoroughly
# Create migration file
npm run db:generate-migration

# Apply to dev
npm run deploy:db
```

### For Production
```bash
# After testing in dev, apply to production
# Option 1: Via Supabase Dashboard (safer)
# - Copy SQL from migration file
# - Run in production SQL editor
# - Test carefully

# Option 2: Via CLI (advanced)
supabase link --project-ref YOUR_PROD_PROJECT_ID
npm run deploy:db
```

**Always test migrations in dev first!**

## Step 7: Verify Setup

### Check Local Development
```bash
npm run dev
# Should connect to dev database
# Check browser console for Supabase URL
```

### Check Environment Variables
```bash
# Local
echo $NEXT_PUBLIC_SUPABASE_URL

# Vercel (via dashboard)
# Settings → Environment Variables → Check each environment
```

### Test Data Isolation
1. Create a test user in dev
2. Check it doesn't appear in production
3. Create a test session in dev
4. Verify production is unaffected

## Common Commands

```bash
# Development
npm run dev                    # Start dev server (uses .env.local)
npm run build                  # Test production build locally
npm run deploy:db              # Deploy to current linked Supabase

# Database
npm run deploy:db:dry-run      # Preview changes
npm run deploy:db:rollback     # Rollback last migration
npm run validate:db            # Validate schema

# Switching between projects
supabase link --project-ref YOUR_DEV_PROJECT_ID
supabase link --project-ref YOUR_PROD_PROJECT_ID
```

## Security Best Practices

1. **Never commit** `.env.local` or any file with real credentials
2. **Use different passwords** for dev and prod databases
3. **Rotate keys regularly**, especially after team changes
4. **Limit access**: Only give prod access to necessary team members
5. **Monitor production**: Set up alerts for unusual activity
6. **Backup regularly**: Enable Supabase automatic backups for production

## Troubleshooting

### "Using wrong database"
- Check `NEXT_PUBLIC_SUPABASE_URL` in your environment
- Clear browser cache and localStorage
- Restart dev server

### "Environment variables not updating"
- Restart dev server after changing `.env.local`
- In Vercel, redeploy after changing environment variables
- Check variable names match exactly (case-sensitive)

### "Migration failed"
- Run `npm run deploy:db:dry-run` first
- Check for syntax errors in SQL
- Verify you're linked to correct project
- Check database logs in Supabase dashboard

## Quick Reference

| Environment | Branch | Database | URL |
|------------|--------|----------|-----|
| Local Dev | any | Dev Supabase | localhost:3000 |
| Preview | feature/* | Dev Supabase | *.vercel.app |
| Production | main | Prod Supabase | harthio.com |

## Next Steps

1. ✅ Create dev Supabase project
2. ✅ Set up `.env.local` with dev credentials
3. ✅ Configure Vercel environment variables
4. ✅ Test local development
5. ✅ Create `develop` branch
6. ✅ Update team documentation
7. ✅ Set up database backups
8. ✅ Configure monitoring/alerts
