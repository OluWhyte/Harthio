# Monetization "Coming Soon" Control System

## Overview
Added platform-level toggles to control when Pro subscriptions and Credits purchases are available to users. This allows you to show the pages and UI but display "Coming Soon" messages until payment integration is ready.

## Changes Made

### 1. Platform Settings Service
**File:** `src/lib/services/platform-settings-service.ts`

**Added Settings:**
- `creditsEnabled: boolean` - Controls if credit purchases are available
- `proTierEnabled: boolean` - Controls if Pro subscriptions are available (already existed)

**Default Values:**
```typescript
{
  proTierEnabled: false,    // Disabled by default
  creditsEnabled: false,    // Disabled by default
}
```

### 2. Me Page (`/me`)
**File:** `src/app/(authenticated)/me/page.tsx`

**Changes:**
- Loads platform settings on mount
- All upgrade buttons check settings before navigating
- Shows "Coming Soon" toast if feature is disabled
- Users can still see the pages, but can't proceed to payment

**Buttons Affected:**
- "Buy Credits" → Shows toast if `creditsEnabled = false`
- "Upgrade to Pro" → Shows toast if `proTierEnabled = false`
- "Buy More" (credits) → Shows toast if `creditsEnabled = false`
- "Go Unlimited" (Pro) → Shows toast if `proTierEnabled = false`
- "Manage Subscription" → Shows toast if `proTierEnabled = false`

### 3. Credits Page (`/credits`)
**File:** `src/app/(authenticated)/credits/page.tsx`

**Changes:**
- Loads platform settings on mount
- All "Buy Now" buttons check `creditsEnabled`
- Shows "Coming Soon" toast if disabled
- Pro subscription buttons also check `proTierEnabled`

**Buttons Affected:**
- "Buy Now" (all credit packs) → Shows toast if `creditsEnabled = false`
- "Start Free Trial" → Shows toast if `proTierEnabled = false`
- "View Details" (Pro yearly) → Shows toast if `proTierEnabled = false`

### 4. Pricing Page (`/pricing`)
**File:** `src/app/pricing/page.tsx`

**Changes:**
- Loads platform settings on mount
- All payment buttons check settings
- Shows "Coming Soon" toast if disabled
- Page remains accessible for marketing

**Buttons Affected:**
- All credit pack cards → Show toast if `creditsEnabled = false`
- "Subscribe Monthly" → Shows toast if `proTierEnabled = false`
- "Subscribe Yearly" → Shows toast if `proTierEnabled = false`
- "Start 14-Day Free Trial" → Shows toast if `proTierEnabled = false`

## How to Enable Features

### Option 1: Via Admin Panel (Recommended)
1. Go to `/admin-v2/settings`
2. Find "Monetization" section
3. Toggle "Enable Pro Tier" switch
4. Toggle "Enable Credits" switch
5. Changes take effect immediately

### Option 2: Via Database (Direct)
Run this SQL in Supabase:

```sql
-- Enable Pro Tier
UPDATE platform_settings 
SET setting_value = '{"enabled": true}'::jsonb
WHERE setting_key = 'pro_tier_enabled';

-- Enable Credits
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES (
  'credits_enabled',
  '{"enabled": true}'::jsonb,
  'Enable credit purchases'
)
ON CONFLICT (setting_key) 
DO UPDATE SET setting_value = '{"enabled": true}'::jsonb;
```

### Option 3: Via Database Migration
Create a new migration file:

```sql
-- database/migrations/enable-monetization.sql

-- Enable Pro Tier
UPDATE platform_settings 
SET setting_value = '{"enabled": true}'::jsonb
WHERE setting_key = 'pro_tier_enabled';

-- Enable Credits
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES (
  'credits_enabled',
  '{"enabled": true}'::jsonb,
  'Enable credit purchases for users'
)
ON CONFLICT (setting_key) 
DO UPDATE SET setting_value = '{"enabled": true}'::jsonb;
```

## User Experience

### When Features Are Disabled (Default)
1. Users can browse `/pricing` page (marketing)
2. Users can visit `/credits` page (see what's available)
3. Users see upgrade options on `/me` page
4. **BUT** clicking any payment button shows:
   ```
   🔔 Coming Soon
   Pro subscription will be available soon!
   ```
   or
   ```
   🔔 Coming Soon
   Credit purchases will be available soon!
   ```

### When Features Are Enabled
1. All buttons work normally
2. Users can proceed to payment
3. No "Coming Soon" messages
4. Full monetization flow active

## Benefits

✅ **Soft Launch** - Show features before payment is ready
✅ **Marketing** - Users can see pricing and features
✅ **Controlled Rollout** - Enable features when ready
✅ **No Code Changes** - Toggle via admin panel
✅ **User Friendly** - Clear "Coming Soon" messages
✅ **Flexible** - Enable Pro and Credits independently

## Testing Checklist

### With Features Disabled (Default)
- [ ] Visit `/me` page → See upgrade options
- [ ] Click "Buy Credits" → See "Coming Soon" toast
- [ ] Click "Upgrade to Pro" → See "Coming Soon" toast
- [ ] Visit `/credits` page → Page loads, see packs
- [ ] Click "Buy Now" → See "Coming Soon" toast
- [ ] Visit `/pricing` page → Page loads, see plans
- [ ] Click "Subscribe Monthly" → See "Coming Soon" toast
- [ ] Click credit pack → See "Coming Soon" toast

### With Features Enabled
- [ ] Enable Pro in admin settings
- [ ] Enable Credits in admin settings
- [ ] Click "Upgrade to Pro" → Navigate to pricing
- [ ] Click "Buy Credits" → Navigate to credits
- [ ] Click "Buy Now" → Proceed to checkout (when built)
- [ ] No "Coming Soon" messages appear

## Launch Strategy

### Phase 1: Pre-Launch (Current)
- Features disabled by default
- Users see "Coming Soon" messages
- Build hype and awareness
- Collect feedback on pricing

### Phase 2: Payment Integration
- Integrate Stripe/payment gateway
- Test payment flows thoroughly
- Keep features disabled in production

### Phase 3: Soft Launch
- Enable for beta users only (via admin)
- Monitor transactions
- Fix any issues
- Collect feedback

### Phase 4: Full Launch
- Enable for all users via admin panel
- Announce via email/in-app
- Monitor closely
- Iterate based on data

## Admin Controls

The admin can control these settings from `/admin-v2/settings`:

```typescript
// Monetization Section
{
  label: "Enable Pro Tier",
  description: "Allow users to subscribe to Pro",
  key: "pro_tier_enabled",
  type: "toggle"
}

{
  label: "Enable Credits",
  description: "Allow users to purchase credit packs",
  key: "credits_enabled",
  type: "toggle"
}
```

## Notes

- Pages remain accessible even when features are disabled (good for SEO and marketing)
- Settings are cached and checked on each page load
- Toast messages are user-friendly and non-technical
- No error states - just friendly "Coming Soon" messages
- Can enable Pro and Credits independently (e.g., Pro first, Credits later)

## Future Enhancements

1. **Scheduled Launch** - Set date/time to auto-enable
2. **User Segments** - Enable for specific user groups
3. **A/B Testing** - Test different pricing with different users
4. **Waitlist** - Collect emails for launch notification
5. **Early Access** - Give some users early access

---

**Status:** ✅ Complete and Ready
**Default State:** Features disabled (Coming Soon mode)
**Enable When:** Payment integration is complete and tested
