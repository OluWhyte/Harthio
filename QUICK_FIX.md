# Quick Fix for 166 TypeScript Errors

## The Problem
Your `src/lib/database.types.ts` file is empty, causing all Supabase queries to fail type checking.

## The Solution (2 commands)

```bash
# 1. Login to Supabase (opens browser)
npx supabase login

# 2. Generate types
npx supabase gen types typescript --project-id scnbnmqokchmnnoehnjr > src/lib/database.types.ts
```

## Verify It Worked

```bash
npm run typecheck
```

Expected: 0 errors (or ~10 errors instead of 166)

## If Commands Don't Work

Use Supabase Dashboard:
1. Visit: https://supabase.com/dashboard/project/scnbnmqokchmnnoehnjr/settings/api
2. Scroll to "Generate Types"
3. Copy the TypeScript code
4. Paste into `src/lib/database.types.ts`

---

**That's it!** This fixes 150+ of the 166 errors.

See `TYPESCRIPT_ERRORS_FIXED.md` for complete details.
