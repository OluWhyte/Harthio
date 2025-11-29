# Credits System Troubleshooting

## Issue: Account Status Card Stuck on Loading

### Symptoms:
- Profile page (`/me`) shows loading spinner forever
- "Account Status" section never displays
- Console may show errors

---

## Root Cause

The credits system requires database columns that may not exist yet:
- `users.ai_credits` (integer)
- `users.credits_expire_at` (timestamp)

If these columns don't exist, the `creditsService.getCreditBalance()` call fails silently.

---

## Solution: Run Database Migration

### Step 1: Check if Migration is Needed

Run this in Supabase SQL Editor:

```sql
-- Check if credits columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('ai_credits', 'credits_expire_at');
```

**Expected result:**
```
ai_credits         | integer
credits_expire_at  | timestamp with time zone
```

**If empty:** You need to run the migration!

---

### Step 2: Run the Migration

**File:** `database/migrations/add-credits-system.sql`

**In Supabase SQL Editor, run:**

```sql
-- Add credit columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_expire_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(ai_credits, credits_expire_at);

-- Create credit_purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10,2) NOT NULL,
  credits_purchased INTEGER NOT NULL,
  payment_method TEXT,
  payment_id TEXT UNIQUE,
  payment_gateway TEXT,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own credit purchases"
  ON credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created ON credit_purchases(created_at DESC);
```

---

### Step 3: Verify Migration

```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('ai_credits', 'credits_expire_at');

-- Check table exists
SELECT * FROM credit_purchases LIMIT 1;

-- Should return empty result (no error)
```

---

### Step 4: Test in App

1. Refresh the profile page (`/me`)
2. Account Status card should now display
3. Should show "Free Plan" with upgrade buttons

---

## Alternative: Temporary Fix (If Can't Run Migration)

If you can't run the migration right now, you can temporarily disable the credits feature:

**File:** `src/app/(authenticated)/me/page.tsx`

Comment out the credits loading:

```typescript
useEffect(() => {
  const loadTierAndBalance = async () => {
    if (!user?.id) return;
    
    setLoadingBalance(true);
    try {
      const userTier = await getUserTier(user.id);
      // const balance = await creditsService.getCreditBalance(user.id);
      
      setTier(userTier);
      setCreditBalance({ credits: 0, expiresAt: null, isExpired: false }); // Default
    } catch (error) {
      console.error('Error loading tier:', error);
      setTier('free');
      setCreditBalance({ credits: 0, expiresAt: null, isExpired: false });
    } finally {
      setLoadingBalance(false);
    }
  };

  loadTierAndBalance();
}, [user]);
```

This will show the Free Plan card without trying to load credits.

---

## Debugging Steps

### 1. Check Browser Console

Open DevTools (F12) and look for errors:

```
Error getting credit balance: ...
```

### 2. Check Network Tab

Look for failed requests to Supabase:
- Status 400/500 = Database error
- Look at response body for details

### 3. Check Supabase Logs

In Supabase Dashboard:
- Go to Logs
- Filter by "Postgres"
- Look for column errors

---

## Common Errors

### Error: "column users.ai_credits does not exist"

**Solution:** Run the migration (Step 2 above)

### Error: "relation credit_purchases does not exist"

**Solution:** Run the full migration including table creation

### Error: "permission denied for table users"

**Solution:** Check RLS policies, ensure user is authenticated

---

## Quick Test After Fix

### Test 1: Profile Page Loads
```
1. Go to /me
2. Should see "Account Status" card
3. Should show "Free Plan" (if no credits)
```

### Test 2: Manually Add Credits
```sql
UPDATE users 
SET ai_credits = 50,
    credits_expire_at = NOW() + INTERVAL '30 days'
WHERE email = 'your-email@example.com';
```

Refresh page, should show:
- "Credits Balance"
- "50 AI messages left"
- Expiry date

### Test 3: Credits Page Works
```
1. Go to /credits
2. Should show balance (0 or 50)
3. Should show 3 credit packs
4. Should show Pro comparison
```

---

## Next Steps After Migration

1. **Test the full flow:**
   - Profile page loads ✅
   - Credits page loads ✅
   - Rate limit message shows ✅

2. **Test with credits:**
   - Manually add credits via SQL
   - Verify balance displays correctly
   - Test credit deduction (send AI message)

3. **Move to Phase 3:**
   - Build admin panel for credits
   - Add payment integration
   - Full end-to-end testing

---

## Status Checklist

- [ ] Database migration run
- [ ] Profile page loads without errors
- [ ] Credits page displays correctly
- [ ] Can manually add credits via SQL
- [ ] Credits display in profile
- [ ] Ready for Phase 3 (Admin Panel)

---

**Most likely issue:** Database migration not run yet
**Quick fix:** Run `database/migrations/add-credits-system.sql` in Supabase
**Time to fix:** 2 minutes

