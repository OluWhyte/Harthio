# Credits Backend Testing Guide

## Step 1: Run Database Migration

**In Supabase SQL Editor, run:**
```sql
-- File: database/migrations/add-credits-system.sql
-- Copy and paste the entire file
```

**Verify tables created:**
```sql
-- Check users table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('ai_credits', 'credits_expire_at');

-- Should return:
-- ai_credits | integer
-- credits_expire_at | timestamp with time zone

-- Check credit_purchases table exists
SELECT * FROM credit_purchases LIMIT 1;

-- Should return empty result (no error)
```

---

## Step 2: Manually Add Credits to Test User

**Get your user ID:**
```sql
SELECT id, email FROM users WHERE email = 'your-email@example.com';
```

**Add 50 credits valid for 30 days:**
```sql
UPDATE users 
SET ai_credits = 50,
    credits_expire_at = NOW() + INTERVAL '30 days'
WHERE id = 'YOUR-USER-ID-HERE';
```

**Verify credits added:**
```sql
SELECT 
  email,
  ai_credits,
  credits_expire_at,
  subscription_tier
FROM users 
WHERE id = 'YOUR-USER-ID-HERE';

-- Should show:
-- ai_credits: 50
-- credits_expire_at: (30 days from now)
-- subscription_tier: free (or pro if you're testing Pro)
```

---

## Step 3: Test Rate Limiting Logic

**Test 1: Free user with NO credits**
```sql
-- Reset a test user to free with no credits
UPDATE users 
SET ai_credits = 0,
    credits_expire_at = NULL,
    subscription_tier = 'free'
WHERE id = 'TEST-USER-ID';

-- Expected behavior:
-- ✅ Can send 3 AI messages today
-- ❌ 4th message blocked
```

**Test 2: Free user WITH credits**
```sql
-- Give test user 10 credits
UPDATE users 
SET ai_credits = 10,
    credits_expire_at = NOW() + INTERVAL '30 days',
    subscription_tier = 'free'
WHERE id = 'TEST-USER-ID';

-- Expected behavior:
-- ✅ Can send 10 AI messages (uses credits, not daily limit)
-- ✅ No daily limit while credits exist
-- ❌ 11th message blocked (falls back to free tier)
```

**Test 3: Pro user WITH credits**
```sql
-- Give Pro user credits
UPDATE users 
SET ai_credits = 50,
    credits_expire_at = NOW() + INTERVAL '30 days',
    subscription_tier = 'pro'
WHERE id = 'TEST-USER-ID';

-- Expected behavior:
-- ✅ Unlimited messages (Pro takes priority)
-- ✅ Credits NOT deducted (saved for after Pro expires)
-- ✅ Credits remain at 50 after sending messages
```

**Test 4: Expired credits**
```sql
-- Give user expired credits
UPDATE users 
SET ai_credits = 100,
    credits_expire_at = NOW() - INTERVAL '1 day',
    subscription_tier = 'free'
WHERE id = 'TEST-USER-ID';

-- Expected behavior:
-- ❌ Credits ignored (expired)
-- ✅ Falls back to free tier (3/day limit)
```

---

## Step 4: Test in Your App

### 4.1 Test Free User (No Credits)
1. Make sure you're on free tier with no credits
2. Send 3 AI messages
3. Try to send 4th message
4. **Expected:** Rate limit message appears

### 4.2 Test Free User (With Credits)
1. Run SQL to add 10 credits:
```sql
UPDATE users 
SET ai_credits = 10,
    credits_expire_at = NOW() + INTERVAL '30 days'
WHERE email = 'your-email@example.com';
```

2. Restart your dev server (to clear any caches)
3. Send AI messages
4. **Expected:** 
   - Can send 10 messages
   - No daily limit
   - Credits decrease with each message

### 4.3 Check Logs
Look for these console logs in your terminal:

```
[Rate Limit] Settings loaded: { rateLimitingEnabled: true, proTierEnabled: true }
[Rate Limit] User tier: free
[Rate Limit] User has credits: 10
[Rate Limit] Deducted 1 credit. Remaining: 9
```

---

## Step 5: Verify Credit Deduction

**Before sending message:**
```sql
SELECT ai_credits FROM users WHERE id = 'YOUR-USER-ID';
-- Result: 10
```

**Send 1 AI message in the app**

**After sending message:**
```sql
SELECT ai_credits FROM users WHERE id = 'YOUR-USER-ID';
-- Result: 9 ✅
```

**Send 9 more messages**

**After 10 messages:**
```sql
SELECT ai_credits FROM users WHERE id = 'YOUR-USER-ID';
-- Result: 0 ✅
```

**Try to send 11th message:**
- Should fall back to free tier
- Check daily usage count

---

## Step 6: Test Credit Stacking

**User has 20 credits expiring Dec 1:**
```sql
UPDATE users 
SET ai_credits = 20,
    credits_expire_at = '2025-12-01'
WHERE id = 'YOUR-USER-ID';
```

**Simulate buying 50 more credits (30 days validity):**
```sql
-- This is what the addCredits() function does
UPDATE users 
SET ai_credits = 20 + 50, -- Stack credits
    credits_expire_at = '2025-12-01'::timestamp + INTERVAL '30 days' -- Extend expiry
WHERE id = 'YOUR-USER-ID';
```

**Verify:**
```sql
SELECT ai_credits, credits_expire_at FROM users WHERE id = 'YOUR-USER-ID';
-- Should show:
-- ai_credits: 70
-- credits_expire_at: 2025-12-31 (extended by 30 days)
```

---

## Step 7: Test Priority System

**Scenario: User has Pro + Credits**

```sql
UPDATE users 
SET subscription_tier = 'pro',
    subscription_end_date = NOW() + INTERVAL '30 days',
    ai_credits = 50,
    credits_expire_at = NOW() + INTERVAL '60 days'
WHERE id = 'YOUR-USER-ID';
```

**Send 10 AI messages**

**Check credits:**
```sql
SELECT ai_credits FROM users WHERE id = 'YOUR-USER-ID';
-- Should still be: 50 ✅ (Pro takes priority, credits not used)
```

**Now expire Pro subscription:**
```sql
UPDATE users 
SET subscription_tier = 'free',
    subscription_end_date = NOW() - INTERVAL '1 day'
WHERE id = 'YOUR-USER-ID';
```

**Send 1 AI message**

**Check credits:**
```sql
SELECT ai_credits FROM users WHERE id = 'YOUR-USER-ID';
-- Should now be: 49 ✅ (Credits activate after Pro expires)
```

---

## Step 8: Test Admin Views

**Check active credit balances:**
```sql
SELECT * FROM active_credit_balances;
-- Shows all users with credits and expiry status
```

**Check credit analytics:**
```sql
SELECT * FROM credit_analytics;
-- Shows total credits sold, revenue, etc.
-- (Will be empty until actual purchases made)
```

**Clean expired credits:**
```sql
SELECT clean_expired_credits();
-- Returns number of users whose credits were reset
```

---

## Expected Results Summary

| Test Case | Expected Behavior | Status |
|-----------|-------------------|--------|
| Free user, no credits | 3 messages/day limit | ⏳ Test |
| Free user, 10 credits | 10 messages, no daily limit | ⏳ Test |
| Pro user, 50 credits | Unlimited, credits saved | ⏳ Test |
| Expired credits | Falls back to free tier | ⏳ Test |
| Credit stacking | Credits add up, expiry extends | ⏳ Test |
| Credit deduction | Decreases by 1 per message | ⏳ Test |
| Priority system | Pro > Credits > Free | ⏳ Test |

---

## Troubleshooting

### Issue: Credits not deducting
**Check:**
```sql
-- Is rate limiting enabled?
SELECT setting_value FROM platform_settings WHERE setting_key = 'ai_rate_limiting_enabled';
-- Should show: {"enabled": true, ...}

-- Does user have credits?
SELECT ai_credits, credits_expire_at FROM users WHERE id = 'YOUR-USER-ID';

-- Are credits expired?
SELECT 
  ai_credits,
  credits_expire_at,
  credits_expire_at < NOW() as is_expired
FROM users WHERE id = 'YOUR-USER-ID';
```

### Issue: Still seeing daily limit with credits
**Possible causes:**
1. Credits expired (check `credits_expire_at < NOW()`)
2. Credits = 0 (check `ai_credits` column)
3. Code not deployed (restart dev server)
4. Using old client (hard refresh browser)

### Issue: Pro user's credits being deducted
**Check:**
```sql
SELECT subscription_tier, subscription_end_date FROM users WHERE id = 'YOUR-USER-ID';
-- subscription_tier should be 'pro'
-- subscription_end_date should be in future
```

---

## Quick Test Script

Run this to set up a complete test scenario:

```sql
-- 1. Create test user state
UPDATE users 
SET ai_credits = 5,
    credits_expire_at = NOW() + INTERVAL '30 days',
    subscription_tier = 'free'
WHERE email = 'your-email@example.com';

-- 2. Check current state
SELECT 
  email,
  subscription_tier,
  ai_credits,
  credits_expire_at,
  credits_expire_at > NOW() as credits_valid
FROM users 
WHERE email = 'your-email@example.com';

-- 3. Send 5 AI messages in your app

-- 4. Verify credits deducted
SELECT ai_credits FROM users WHERE email = 'your-email@example.com';
-- Should be: 0

-- 5. Try to send 6th message
-- Should fall back to free tier (check if you've used 3 today)
```

---

## Success Criteria

✅ **Backend is working if:**
1. Credits column exists in users table
2. Can manually add credits via SQL
3. Credits deduct when sending AI messages
4. Falls back to free tier when credits = 0
5. Pro users don't use credits
6. Credits stack correctly
7. Expired credits are ignored

**Once all tests pass, backend is ready for UI! 🎉**
