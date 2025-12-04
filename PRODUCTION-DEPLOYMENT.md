# Production Deployment Guide

## Database Migrations to Run (In Order)

Run these SQL scripts in your **Production Supabase** SQL Editor:

### 1. Credits System Setup
**File:** `database/migrations/add-credits-system.sql`
**Purpose:** Creates credit_purchases table and credit tracking columns
**Status:** ✅ Required

### 2. Currency Support
**File:** `database/migrations/add-currency-to-credit-purchases.sql`
**Purpose:** Adds comprehensive payment tracking columns (currency, exchange_rate, etc.)
**Status:** ✅ Required

### 3. Subscriptions Table Enhancement
**File:** `database/migrations/FINAL-FIX-SUBSCRIPTIONS.sql`
**Purpose:** Adds tier column and payment tracking to subscriptions table
**Status:** ✅ Required

### 4. Payment Functions (Updated)
**File:** `database/migrations/add-payment-functions.sql`
**Purpose:** Creates add_credits_to_user() and upgrade_user_to_pro() with exchange rate support
**Status:** ✅ Required - This is the FINAL version with currency conversion

### 5. Update Upgrade Function
**File:** `database/migrations/UPDATE-UPGRADE-FUNCTION.sql`
**Purpose:** Updates upgrade_user_to_pro to use subscriptions table instead of credit_purchases
**Status:** ✅ Required

### 6. Payments Enabled Setting
**File:** `database/migrations/add-payments-enabled-setting.sql`
**Purpose:** Adds payments_enabled toggle for Finance page
**Status:** ✅ Required

---

## Quick Deployment Script

Copy and paste this into Supabase SQL Editor (runs all migrations in order):

```sql
-- ============================================================================
-- PRODUCTION DEPLOYMENT - ALL MIGRATIONS
-- ============================================================================
-- Run this entire script in Production Supabase SQL Editor
-- ============================================================================

-- Note: Copy the contents of each file below in order:
-- 1. add-credits-system.sql
-- 2. add-currency-to-credit-purchases.sql
-- 3. FINAL-FIX-SUBSCRIPTIONS.sql
-- 4. add-payment-functions.sql
-- 5. UPDATE-UPGRADE-FUNCTION.sql
-- 6. add-payments-enabled-setting.sql

-- After running, verify with:
SELECT 'Migration complete!' as status;
```

---

## Environment Variables to Set

Make sure these are set in **Production Vercel**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx  # Use LIVE key for production
PAYSTACK_SECRET_KEY=sk_live_xxx              # Use LIVE key for production

# App URL
NEXT_PUBLIC_APP_URL=https://harthio.com
```

---

## Post-Deployment Verification

### 1. Test Credit Purchase
- Go to /credits page
- Buy a credit pack
- Verify:
  - Payment succeeds
  - Credits added to account
  - Currency conversion logged correctly
  - Finance page shows correct revenue

### 2. Test Pro Upgrade
- Go to /pricing page
- Upgrade to Pro
- Verify:
  - Payment succeeds
  - User upgraded to Pro tier
  - Subscription recorded in subscriptions table
  - Finance page shows correct revenue

### 3. Check Admin Pages
- Finance page: Revenue totals correct (in USD)
- Monetization page: Charts show data
- Analytics page: Users by country shows data

### 4. Test New Signup
- Create new account
- Verify country is detected automatically
- Check admin analytics shows correct country

---

## Files to Delete (Cleanup)

These are temporary/duplicate files that can be deleted:

```bash
# Temporary diagnostic files
database/CHECK-CURRENT-STATE.sql
database/CHECK-FUNCTION.sql

# Documentation (keep or delete)
CURRENCY-FIX-SUMMARY.md  # Can delete after reading

# Old/superseded migrations (already consolidated)
database/migrations/RUN-THIS-IN-SUPABASE.sql  # Superseded by individual files
```

---

## Git Commit Checklist

Before deploying to production:

```bash
# 1. Commit all changes
git add -A
git commit -m "feat: Complete payment system with multi-currency support

- Add credits system with 30-day expiry
- Add Pro subscription management
- Implement multi-currency support (USD, NGN, KES, GHS, ZAR)
- Add exchange rate conversion service
- Update admin pages to use USD for analytics
- Add automatic country detection at signup
- Fix subscription table structure
- Update payment functions with proper currency tracking"

# 2. Push to develop
git push origin develop

# 3. Merge to main (production)
git checkout main
git merge develop
git push origin main

# 4. Deploy to Vercel
# (Vercel will auto-deploy from main branch)
```

---

## Rollback Plan (If Needed)

If something goes wrong:

### Database Rollback:
```sql
-- Drop new functions
DROP FUNCTION IF EXISTS add_credits_to_user;
DROP FUNCTION IF EXISTS upgrade_user_to_pro;

-- Remove new columns (if needed)
ALTER TABLE credit_purchases DROP COLUMN IF EXISTS currency;
ALTER TABLE credit_purchases DROP COLUMN IF EXISTS exchange_rate;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS tier;
```

### Code Rollback:
```bash
git revert HEAD
git push origin main
```

---

## Success Criteria

✅ All migrations run without errors
✅ Credit purchases work and show correct USD amounts
✅ Pro upgrades work and record in subscriptions table
✅ Finance page shows accurate revenue totals
✅ New signups have country detected
✅ No console errors in production
✅ Payments process successfully

---

## Support Contacts

If issues arise:
- Check Supabase logs for database errors
- Check Vercel logs for API errors
- Check Paystack dashboard for payment issues
- Review browser console for client errors

---

## Notes

- **Exchange Rates:** Based on pricing (₦15,000 = $9.99 → rate: 1,501)
- **Currency Priority:** Pro > Credits > Free (3/day)
- **Subscription Table:** Separate from credit_purchases for clean data
- **Country Detection:** Automatic via IP geolocation (ipapi.co)
- **Backward Compatible:** Existing users/data not affected
