# Pro Tier Testing Guide

## Step 1: Access Admin Settings

Navigate to: `https://localhost:3000/admin-v2/settings`

You should see 4 toggles:
- Pro Tier Enforcement
- AI Rate Limiting
- Tracker Limits
- Trial Mode

## Step 2: Test Current State (Everything OFF)

**Current state:** All toggles should be OFF

**Expected behavior:**
- All users have full access
- No restrictions
- Perfect for testing with your 70 users

**Test:**
1. Send 10 AI messages → Should work (no limit)
2. Create 5 trackers → Should work (no limit)

## Step 3: Enable Pro Tier

**Turn ON:** Pro Tier Enforcement toggle

**Expected behavior:**
- Free users: Limited access
- Pro users: Full access
- Other toggles become active

## Step 4: Test Rate Limiting

**Turn ON:** AI Rate Limiting toggle

**Test as FREE user:**
1. Send 3 AI messages → Should work
2. Send 4th message → Should be blocked with message:
   ```
   "You've reached your daily limit of 3 AI messages. 
   Upgrade to Pro for unlimited conversations!"
   ```
3. Check rate limit resets at midnight

**Test as PRO user:**
1. Send 10+ messages → Should all work (unlimited)

## Step 5: Test Tracker Limits

**Turn ON:** Tracker Limits toggle

**Test as FREE user:**
1. Create 1 tracker → Should work
2. Try to create 2nd tracker → Should be blocked with message:
   ```
   "Free users can create 1 tracker. 
   Upgrade to Pro to track up to 20 addictions!"
   ```

**Test as PRO user:**
1. Create 5 trackers → Should all work
2. Can create up to 20 total

## Step 6: Test Trial Mode

**Turn ON:** Trial Mode toggle

**Test trial flow:**
1. As free user, click "Start Free Trial" button
2. Should get Pro access immediately
3. Check `user_profiles` table - `trial_ends_at` should be 14 days from now
4. Verify unlimited AI messages work
5. Verify can create multiple trackers

**Test trial expiration:**
```sql
-- Manually expire trial for testing
UPDATE user_profiles 
SET trial_ends_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'YOUR_USER_ID';
```

Then refresh and verify:
- User is downgraded to Free tier
- Rate limits apply again
- Can't create more trackers

## Step 7: Test Pro Upgrade

**Manually make user Pro:**
```sql
UPDATE user_profiles 
SET tier = 'pro'
WHERE user_id = 'YOUR_USER_ID';
```

**Verify:**
- Unlimited AI messages
- Can create 20 trackers
- No restrictions

## Step 8: Test Toggle Combinations

### Scenario A: Soft Launch (Recommended)
```
Pro Tier: OFF
Rate Limiting: OFF
Tracker Limits: OFF
Trial Mode: OFF
```
**Result:** Everyone has full access (current state)

### Scenario B: Monetization with Trials
```
Pro Tier: ON
Rate Limiting: ON
Tracker Limits: ON
Trial Mode: ON
```
**Result:** 
- Free users: Limited (3 msgs/day, 1 tracker)
- Trial users: Full Pro for 14 days
- Pro users: Unlimited

### Scenario C: Hard Monetization (No Trials)
```
Pro Tier: ON
Rate Limiting: ON
Tracker Limits: ON
Trial Mode: OFF
```
**Result:**
- Free users: Limited
- Trial button doesn't give Pro access
- Must pay for Pro immediately

## Quick SQL Checks

### Check your current tier
```sql
SELECT 
  email,
  tier,
  trial_ends_at,
  CASE 
    WHEN tier = 'pro' THEN 'Pro User'
    WHEN trial_ends_at > NOW() THEN 'Trial User (Pro Access)'
    ELSE 'Free User'
  END as effective_tier
FROM user_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE u.id = 'YOUR_USER_ID';
```

### Check platform settings
```sql
SELECT 
  setting_key,
  setting_value->>'enabled' as enabled
FROM platform_settings
ORDER BY setting_key;
```

### Check AI message usage
```sql
SELECT 
  COUNT(*) as messages_today,
  MAX(created_at) as last_message
FROM ai_message_usage
WHERE user_id = 'YOUR_USER_ID'
  AND DATE(created_at) = CURRENT_DATE;
```

### Check tracker count
```sql
SELECT 
  COUNT(*) as tracker_count
FROM sobriety_trackers
WHERE user_id = 'YOUR_USER_ID';
```

## Expected Errors to Test

### Rate Limit Error (Free user, 4th message)
```json
{
  "error": "rate_limit_exceeded",
  "message": "You've reached your daily limit...",
  "remaining": 0,
  "limit": 3,
  "userTier": "free"
}
```

### Tracker Limit Error (Free user, 2nd tracker)
```json
{
  "error": "tracker_limit_exceeded",
  "message": "Free users can create 1 tracker...",
  "current": 1,
  "limit": 1,
  "userTier": "free"
}
```

## Troubleshooting

### Toggles don't work
1. Check database migration ran: `SELECT * FROM platform_settings;`
2. Verify RLS policies allow admin updates
3. Hard refresh browser (Ctrl+Shift+R)

### Changes don't apply
1. Check server logs for errors
2. Verify user tier in database
3. Clear browser cache

### Rate limit not resetting
- Rate limits reset at midnight UTC
- Or manually reset: `DELETE FROM ai_message_usage WHERE user_id = 'YOUR_USER_ID';`

## Success Criteria

✅ Admin can toggle settings on/off
✅ Free users see restrictions when Pro tier ON
✅ Pro users have unlimited access
✅ Trial users get 14 days of Pro
✅ Trial expires and downgrades correctly
✅ Rate limits reset daily
✅ Error messages are clear and helpful

## Next Steps After Testing

1. Keep Pro tier OFF for now (let your 70 users test freely)
2. After 1-2 weeks, announce pricing
3. Enable Pro tier with trials
4. Integrate Stripe for payments
5. Monitor conversion rates
