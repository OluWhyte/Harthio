# Simple Dev/Prod Workflow

## Setup (Already Done ✅)

- `develop` branch created
- `main` branch is production
- Both use the **same database** (your production Supabase)

## Why This Works

You'll be careful:
- Test thoroughly on `develop` branch preview URL before merging
- Use preview deployments to catch issues
- Only merge to `main` when confident  

## Daily Workflow

```bash
# 1. Work on develop branch
git checkout develop

# 2. Make your changes and test locally
npm run dev

# 3. Push to see preview deployment
git add .
git commit -m "Your changes"
git push origin develop

# 4. Test on Vercel preview URL
# URL: harthio-git-develop-yourname.vercel.app
# Test thoroughly before merging!

# 5. When confident, merge to production
git checkout main
git merge develop
git push origin main
# Goes live at harthio.com
```

## Important Notes

⚠️ **Same Database**: Both branches use the same production database
- Be careful with database changes
- Test locally first with `npm run dev`
- Use preview URL to catch UI/logic bugs
- For risky database changes, do them during low-traffic times

✅ **What This Protects**:
- Code bugs (caught on preview URL)
- UI issues (test before production)
- Breaking changes (review on preview first)

## Database Changes

For database migrations:
```bash
# 1. Test locally first
npm run deploy:db:dry-run

# 2. Apply during low-traffic time
npm run deploy:db

# 3. Test immediately on preview URL
# 4. If good, merge to main
```

## Summary

✅ **Two branches** (develop for testing, main for production)  
✅ **Same database** (no credential hassle)  
✅ **Preview URLs** (test before going live)  
✅ **Simple workflow** (just be careful!)
