# Credits System Implementation Status

## ✅ COMPLETED (Phase 1: Backend)

### 1. Database Schema
**File:** `database/migrations/add-credits-system.sql`
- ✅ Added `ai_credits` and `credits_expire_at` columns to `users` table
- ✅ Created `credit_purchases` table with full tracking
- ✅ Updated `payments` table with credit fields
- ✅ Created RLS policies for security
- ✅ Created admin views for analytics
- ✅ Created cleanup function for expired credits

**Run this migration in Supabase SQL Editor!**

### 2. Credits Service
**File:** `src/lib/services/credits-service.ts`
- ✅ `getCreditBalance()` - Get user's current credits
- ✅ `addCredits()` - Add credits (stacks and extends expiry)
- ✅ `deductCredit()` - Deduct one credit
- ✅ `recordPurchase()` - Track purchase in database
- ✅ `getPurchaseHistory()` - Get user's purchase history
- ✅ Defined 3 credit packs (Starter, Popular, Power)

### 3. Rate Limiting Updated
**File:** `src/lib/services/ai-rate-limit-service.ts`
- ✅ Updated `checkAIMessageLimit()` with 3-tier priority:
  1. Pro → Unlimited
  2. Credits → Use from balance
  3. Free → 3/day limit
- ✅ Updated `incrementAIMessageUsage()` to deduct credits
- ✅ Added credit balance info to rate limit response

---

## 🔄 CURRENT SUBSCRIPTION MODEL

### What Exists Now:
**File:** `src/lib/services/tier-service.ts`
- ✅ `getUserTier()` - Returns 'free' or 'pro'
- ✅ `startFreeTrial()` - 14-day trial
- ✅ `addSubscriptionTime()` - Add months to subscription
- ✅ `downgradeToFree()` - Cancel subscription

### What Works:
- ✅ Pro subscription ($9.99/month)
- ✅ Trial system (one-time only)
- ✅ Subscription stacking (add months)
- ✅ Auto-downgrade after expiry

### What Needs NO Changes:
The subscription system is perfect as-is! Credits work alongside it:
- Pro users can buy credits (saved for after Pro expires)
- Credits don't interfere with Pro status
- Priority system ensures Pro always takes precedence

---

## ✅ COMPLETED (Phase 2: Frontend UI)

### 2.1 Update Pricing Page ✅
**File:** `src/app/pricing/page.tsx`
- ✅ Added credit packs section between Free and Pro cards
- ✅ Shows 3 packs: Starter ($2), Popular ($5), Power ($10)
- ✅ Added "Buy Credits" buttons with routing to /credits page
- ✅ Styled with Apple design system (matching Pro cards)

### 2.2 Create Credits Purchase Page ✅
**File:** `src/app/(authenticated)/credits/page.tsx`
- ✅ Shows available credit packs with full details
- ✅ Displays current credit balance with expiry
- ✅ Shows purchase history (when available)
- ✅ "Buy Now" buttons for each pack (ready for payment integration)
- ✅ "How Credits Work" explanation section

### 2.3 Update Rate Limit Message ✅
**File:** `src/app/(authenticated)/harthio/page.tsx`
- ✅ Updated rate limit message to show both credit and Pro options
- ✅ Added "Buy Credits" button (primary) alongside "Upgrade to Pro" (outline)
- ✅ Shows credit pack pricing in the message
- ✅ Clear comparison between pay-as-you-go and subscription

### 2.4 Create Credit Balance Indicator ✅
**File:** `src/components/harthio/credit-balance-indicator.tsx`
- ✅ Shows in desktop header: "💬 47 messages"
- ✅ Shows expiry date in tooltip
- ✅ Click to navigate to /credits page
- ✅ Warning color when expiring soon (≤7 days)
- ✅ Auto-refreshes every 30 seconds
- ✅ Only shows when user has active credits

### 2.5 Integrated into Layout ✅
**File:** `src/components/harthio/dashboard-client-layout.tsx`
- ✅ Added CreditBalanceIndicator to desktop header
- ✅ Positioned between search and session indicator

---

## 📋 TODO (Phase 3-4)

### Phase 3: Admin Panel (Next Steps)

---

### Phase 3: Admin Panel

#### 3.1 Credits Dashboard
**New file:** `src/app/admin-v2/credits/page.tsx`
**Features:**
- Total credits sold
- Revenue from credits
- Active credit users
- Popular packs
- Expiring credits alert

#### 3.2 Credit Management
**New file:** `src/app/admin-v2/credits/manage/page.tsx`
**Features:**
- Search users by email
- View user credit balance
- Manually add/remove credits
- View purchase history
- Refund credits

#### 3.3 Update Finance Dashboard
**File:** `src/app/admin-v2/finance/page.tsx`
**Changes needed:**
- Add "Credits Revenue" section
- Show credit vs subscription revenue split
- Track credit purchases over time

---

### Phase 4: Payment Integration

#### 4.1 Payment API Route
**New file:** `src/app/api/credits/purchase/route.ts`
**Features:**
- Validate pack selection
- Create payment intent
- Return payment URL
- Handle success/failure

#### 4.2 Webhook Handler
**New file:** `src/app/api/webhooks/credits/route.ts`
**Features:**
- Verify webhook signature
- Add credits to user account
- Record purchase in database
- Send confirmation email

#### 4.3 Payment Gateway Service
**New file:** `src/lib/services/payment-gateway-service.ts`
**Features:**
- Integrate Flutterwave (for Africa)
- Support mobile money (M-Pesa, Airtel, MTN, Orange)
- Support cards (Stripe fallback)
- Handle webhooks

---

## 🔑 KEY IMPLEMENTATION NOTES

### Priority System (How it works):
```
User sends AI message
  ↓
1. Check if Pro? → Yes → Allow (no deduction)
  ↓ No
2. Check if has credits? → Yes → Allow (deduct 1 credit)
  ↓ No
3. Check free tier limit → <3 today? → Allow (increment daily count)
  ↓ No
4. BLOCK → Show upgrade/buy credits message
```

### Credit Stacking (How it works):
```
User buys Starter Pack ($2, 50 credits, 30 days)
  ↓
Current: 20 credits, expires Dec 1
  ↓
After purchase: 70 credits, expires Dec 31 (extended by 30 days)
```

### Pro + Credits (How it works):
```
User is Pro with unlimited messages
  ↓
User buys 150 credits
  ↓
Credits saved but not used (Pro takes priority)
  ↓
Pro expires
  ↓
Credits automatically activate
```

---

## 🧪 TESTING CHECKLIST

### Backend Tests:
- [ ] Run database migration
- [ ] Test `creditsService.addCredits()` - credits stack correctly
- [ ] Test `creditsService.deductCredit()` - deducts properly
- [ ] Test credit expiry - expired credits return 0
- [ ] Test rate limiting with credits
- [ ] Test Pro user buying credits (credits saved)
- [ ] Test priority system (Pro > Credits > Free)

### Frontend Tests (After UI built):
- [ ] Buy credits (all 3 packs)
- [ ] View credit balance
- [ ] Use credits (watch balance decrease)
- [ ] Credits expire (balance shows 0)
- [ ] Rate limit message shows credit option
- [ ] Admin can view credit analytics
- [ ] Admin can manually add/remove credits

### Payment Tests (After integration):
- [ ] Complete purchase flow
- [ ] Webhook receives confirmation
- [ ] Credits added to account
- [ ] Purchase recorded in database
- [ ] Mobile money payment works
- [ ] Card payment works
- [ ] Failed payment handled gracefully

---

## 📊 WHAT'S DIFFERENT FROM SUBSCRIPTION

### Subscription Model:
- Monthly/yearly recurring payment
- Unlimited messages during period
- Auto-renews (or expires)
- Time-based (not usage-based)

### Credits Model:
- One-time payment
- Limited messages (50-500)
- No auto-renewal
- Usage-based (not time-based)
- Expires after validity period (30-90 days)

### Why Both?
- **Subscription**: Best for heavy users (10+ messages/day)
- **Credits**: Best for light/irregular users (1-6 messages/day)
- **Together**: Maximizes revenue and accessibility

---

## 🚀 NEXT STEPS

1. **Run the database migration** in Supabase
2. **Test the backend** - credits service and rate limiting
3. **Build the UI** - pricing page, purchase page, balance indicator
4. **Add admin panel** - analytics and management
5. **Integrate payments** - Flutterwave for mobile money
6. **Full testing** - end-to-end purchase flow

**Estimated time:** 2-3 weeks for full implementation

---

## 💡 QUICK WINS

Want to test credits immediately without payment integration?

**Admin can manually add credits:**
```sql
-- Give user 50 credits valid for 30 days
UPDATE users 
SET ai_credits = 50,
    credits_expire_at = NOW() + INTERVAL '30 days'
WHERE id = 'user-id-here';
```

Then test the rate limiting - it should use credits instead of daily limit!

---

**Status:** Backend complete ✅ | Frontend pending ⏳ | Payment pending ⏳
