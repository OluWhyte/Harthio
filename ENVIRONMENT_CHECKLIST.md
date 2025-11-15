# Environment Setup Checklist

Use this checklist to ensure your development and production environments are properly separated.

## Initial Setup

### 1. Create Development Supabase Project
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Name: "Harthio Development"
- [ ] Choose same region as production
- [ ] Save database password securely
- [ ] Wait for project creation (~2 minutes)

### 2. Set Up Development Database
- [ ] Copy production schema to development
  - Option A: Use Supabase CLI (`supabase db pull` then `supabase db push`)
  - Option B: Run SQL files manually in dev dashboard
- [ ] Verify tables created correctly
- [ ] Test RLS policies are working
- [ ] Create test user account

### 3. Configure Local Development
- [ ] Run `bash scripts/setup-dev-environment.sh` OR
- [ ] Manually copy `.env.development.template` to `.env.local`
- [ ] Fill in development Supabase credentials:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Add development email credentials (optional):
  - [ ] `RESEND_API_KEY`
  - [ ] `EMAIL_FROM_ADDRESS`
- [ ] Add TURN server credentials (can share with prod)
- [ ] Run `npm run check:env` to verify setup
- [ ] Run `npm run dev` and test locally

### 4. Configure Vercel Environments

#### Production Environment
- [ ] Go to Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Select "Production" environment
- [ ] Add all variables from `.env.production.template`:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (production project)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (production)
  - [ ] `NEXT_PUBLIC_APP_URL=https://harthio.com`
  - [ ] `RESEND_API_KEY` (production)
  - [ ] `EMAIL_FROM_ADDRESS` (production)
  - [ ] All other production values
- [ ] Verify all variables are set correctly
- [ ] Redeploy production to apply changes

#### Preview Environment (Recommended)
- [ ] In Vercel → Environment Variables
- [ ] Select "Preview" environment
- [ ] Add all variables from `.env.development.template`:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (development project)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (development)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (development)
  - [ ] All other development values
- [ ] Test with a preview deployment

### 5. Set Up Git Workflow
- [ ] Create `develop` branch: `git checkout -b develop`
- [ ] Push to remote: `git push -u origin develop`
- [ ] Set `develop` as default branch for PRs (optional)
- [ ] Update team on new workflow

### 6. Test Environment Separation
- [ ] Create test data in development
- [ ] Verify it doesn't appear in production
- [ ] Test local development connects to dev database
- [ ] Test production deployment uses prod database
- [ ] Test preview deployments use dev database

## Daily Development Workflow

### Starting Work
- [ ] Pull latest changes: `git pull origin develop`
- [ ] Check environment: `npm run check:env`
- [ ] Start dev server: `npm run dev`
- [ ] Verify using dev database (check console logs)

### Making Changes
- [ ] Work on feature branch: `git checkout -b feature/your-feature`
- [ ] Make changes and test locally
- [ ] Test database migrations in dev first
- [ ] Commit changes: `git commit -m "Your message"`
- [ ] Push to remote: `git push origin feature/your-feature`

### Testing
- [ ] Test locally with dev database
- [ ] Create PR to `develop` branch
- [ ] Review preview deployment (uses dev database)
- [ ] Get code review
- [ ] Merge to `develop`

### Deploying to Production
- [ ] Ensure all changes tested in dev
- [ ] Test database migrations in dev
- [ ] Create PR from `develop` to `main`
- [ ] Final review and approval
- [ ] Merge to `main` (triggers production deployment)
- [ ] Monitor production for issues
- [ ] Apply database migrations to production (if needed)

## Database Migration Workflow

### Development
- [ ] Make schema changes in dev Supabase dashboard
- [ ] Test changes thoroughly
- [ ] Generate migration file: `npm run db:generate-migration`
- [ ] Apply to dev: `npm run deploy:db`
- [ ] Test application with new schema
- [ ] Commit migration file

### Production
- [ ] Ensure migration tested in dev
- [ ] Backup production database (Supabase dashboard)
- [ ] Dry run: `npm run deploy:db:dry-run` (linked to prod)
- [ ] Review changes carefully
- [ ] Apply migration: `npm run deploy:db` OR
- [ ] Manually run SQL in production dashboard (safer)
- [ ] Verify migration successful
- [ ] Test production application

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Never commit real credentials to git
- [ ] Different passwords for dev and prod databases
- [ ] Service role keys kept secret
- [ ] Production access limited to necessary team members
- [ ] Regular key rotation schedule established
- [ ] Monitoring/alerts set up for production
- [ ] Automatic backups enabled for production

## Troubleshooting

### Wrong Database Connection
- [ ] Check `NEXT_PUBLIC_SUPABASE_URL` in environment
- [ ] Run `npm run check:env` to verify
- [ ] Clear browser localStorage and cache
- [ ] Restart dev server
- [ ] Check Vercel environment variables (for deployments)

### Environment Variables Not Working
- [ ] Restart dev server after changing `.env.local`
- [ ] Redeploy in Vercel after changing variables
- [ ] Check variable names match exactly (case-sensitive)
- [ ] Verify no typos in variable names
- [ ] Check for trailing spaces in values

### Migration Issues
- [ ] Run dry-run first: `npm run deploy:db:dry-run`
- [ ] Check SQL syntax
- [ ] Verify correct Supabase project linked
- [ ] Check database logs in Supabase dashboard
- [ ] Rollback if needed: `npm run deploy:db:rollback`

## Quick Commands Reference

```bash
# Environment
npm run check:env              # Check current environment
bash scripts/setup-dev-environment.sh  # Set up .env.local

# Development
npm run dev                    # Start dev server
npm run build                  # Test production build
npm run typecheck              # Check TypeScript

# Database
npm run deploy:db              # Deploy migrations
npm run deploy:db:dry-run      # Preview migrations
npm run deploy:db:rollback     # Rollback last migration

# Git
git checkout develop           # Switch to develop branch
git checkout -b feature/name   # Create feature branch
git push origin feature/name   # Push feature branch
```

## Support

If you encounter issues:
1. Check this checklist
2. Review `ENVIRONMENT_SETUP.md` for detailed instructions
3. Run `npm run check:env` to diagnose issues
4. Check Supabase dashboard logs
5. Review Vercel deployment logs

## Notes

- Keep this checklist updated as your setup evolves
- Document any custom configurations
- Share with new team members
- Review security practices regularly
