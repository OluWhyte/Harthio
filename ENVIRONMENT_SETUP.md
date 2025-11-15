# Dev/Prod Separation - CONFIGURED ✅

## Setup Complete!

Your environment is now configured with:
- **develop branch** → Preview URL → **Dev Database** (scnbnmqokchmnnoehnjr.supabase.co)
- **main branch** → harthio.com → **Production Database**

## Daily Workflow

```bash
# 1. Work on develop branch
git checkout develop

# 2. Make changes and push
git add .
git commit -m "Your changes"
git push origin develop

# 3. Vercel creates preview URL automatically
# Test at: harthio-git-develop-yourname.vercel.app
# Uses DEV database - safe to test!

# 4. When ready, merge to production
git checkout main
git merge develop
git push origin main
# Goes live at harthio.com with PROD database
```

## What's Protected Now

✅ **Production database is safe** - Preview uses separate dev database  
✅ **Test freely** - Break things in dev without affecting users  
✅ **Database changes** - Test migrations in dev first  
✅ **Automatic deployments** - Vercel handles everything  

## Database Migrations

```bash
# Test in dev first
git checkout develop
npm run deploy:db:dry-run
npm run deploy:db
# Push and test on preview URL

# Then apply to production
git checkout main
npm run deploy:db
git push origin main
```

## Summary

- **develop** = Safe testing with dev database
- **main** = Production with prod database
- No more worrying about breaking production!
