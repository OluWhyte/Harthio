# Simple Dev/Prod Separation

## The Simple Way: Use Git Branches

Instead of creating multiple databases, use **branch-based deployments**:

```
develop branch  →  Vercel Preview URL  →  Test here first
main branch     →  harthio.com         →  Production
```

## Setup (2 minutes)

### 1. Create develop branch
```bash
git checkout -b develop
git push -u origin develop
```

### 2. Work on develop branch
```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin develop
```

### 3. Vercel automatically creates preview URL
- Every push to `develop` gets a preview URL like `harthio-git-develop-yourname.vercel.app`
- Test everything there first
- Same database, but isolated testing

### 4. When ready, merge to production
```bash
git checkout main
git merge develop
git push origin main
```

## Why This Works

✅ **No extra database needed** - Use same Supabase  
✅ **Automatic preview URLs** - Vercel does it for you  
✅ **Test before production** - Preview URL is your staging  
✅ **Simple workflow** - Just use branches  

## Daily Workflow

1. Work on `develop` branch
2. Push to see preview deployment
3. Test on preview URL
4. Merge to `main` when ready
5. Production updates automatically

## Database Changes

For database changes, test carefully:

1. Make changes in Supabase dashboard
2. Test on preview URL (develop branch)
3. If it works, merge to main
4. Production gets the same database (already updated)

**OR** use migrations:
```bash
# Create migration file
npm run db:generate-migration

# Test locally
npm run deploy:db:dry-run

# Apply when ready
npm run deploy:db
```

## That's It!

No need for:
- ❌ Second Supabase project
- ❌ Complex environment configs
- ❌ Multiple databases to manage

Just use:
- ✅ Git branches
- ✅ Vercel preview URLs
- ✅ One database
