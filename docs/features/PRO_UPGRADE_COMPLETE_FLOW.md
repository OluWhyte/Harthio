# Pro Upgrade Flow - Complete User Journey

## Current State Analysis

You have:
- ✅ Pricing page with Free/Pro Monthly/Pro Yearly options
- ✅ Checkout page (placeholder for payment gateway)
- ✅ Tier system in database
- ✅ Trial system (14 days free)
- ⚠️ No payment gateway integration yet
- ⚠️ No subscription management
- ⚠️ No finance tracking

## Complete Pro Upgrade Flow

### 1. User Discovers Pro Features

**Trigger Points** (where users see Pro prompts):

#### A. AI Chat Rate Limit Hit
```
Location: AI chat interface
Message: "You've used your 3 free AI messages today! 💬

Upgrade to Pro for unlimited AI conversations, full CBT tools, and advanced recovery tracking.

[Start 14-Day Free Trial] [Learn More]"
```

#### B. Tracker Limit Hit
```
Location: Tracker creation dialog
Message: "You've reached your free tracker limit (1 tracker).

Upgrade to Pro to create up to 20 custom trackers and track multiple recovery goals.

[Start Free Trial] [See Pro Features]"
```

#### C. Profile Page Banner
```
Location: User profile page
Banner: "🌟 Try Pro Free for 14 Days
Unlock unlimited AI, 20 trackers, and advanced analytics.
[Start Trial]"
```

#### D. Home Page Prompt
```
Location: Dashboard/home page
Card: "Upgrade to Pro
Get unlimited AI support and advanced recovery tools
[View Plans]"
```

### 2. User Clicks "Upgrade" or "Start Trial"

**Routes**:
- From AI limit → `/pricing?trial=true&source=ai_limit`
- From tracker limit → `/pricing?trial=true&source=tracker_limit`
- From profile → `/pricing?source=profile`
- From home → `/pricing?source=home`

### 3. Pricing Page

**URL**: `/pricing`

**User sees**:
- Free tier (current plan if applicable)
- Pro Monthly ($9.99/mo) - POPULAR badge
- Pro Yearly ($99.90/yr) - BEST VALUE badge

**Actions**:
- Click "Start 14-Day Free Trial" → Starts trial immediately (no payment)
- Click "Subscribe Monthly" → Goes to checkout
- Click "Subscribe Yearly" → Goes to checkout

### 4. Trial Flow (No Payment Required)

**When user clicks "Start 14-Day Free Trial"**:

```typescript
// Current implementation
1. Check if user is logged in
   - If not → Redirect to /signup?redirect=/pricing?trial=true
   - If yes → Continue

2. Call startFreeTrial(userId)
   - Sets is_trial_active = true
   - Sets trial_end_date = NOW() + 14 days
   - Sets subscription_tier = 'pro'

3. Show success toast:
   "🎉 Trial started! You now have 14 days of Pro access. Enjoy!"

4. Redirect to /home

5. User immediately has Pro access
```

**What happens during trial**:
- User has full Pro access for 14 days
- No payment required
- No credit card needed
- Can cancel anytime

**What happens when trial ends**:
- Automatic downgrade to Free tier
- No charges
- User keeps their data
- Can upgrade to Pro anytime

### 5. Paid Subscription Flow

**When user clicks "Subscribe Monthly" or "Subscribe Yearly"**:

```
Current Flow:
1. User clicks plan
2. Redirects to /checkout?plan=monthly&price=9.99
3. Checkout page shows order summary
4. User clicks "Proceed to Payment"
5. TODO: Payment gateway integration needed
```

**Recommended Flow** (with payment gateway):

```
1. User clicks plan on /pricing
   ↓
2. Redirect to /checkout?plan=monthly&price=9.99
   ↓
3. Checkout page shows:
   - Order summary
   - What's included
   - Total price
   - "Proceed to Payment" button
   ↓
4. Click "Proceed to Payment"
   ↓
5. Redirect to payment gateway (Stripe alternative)
   - Paddle: paddle.com (recommended for SaaS)
   - Lemon Squeezy: lemonsqueezy.com
   - PayPal: paypal.com
   - Razorpay: razorpay.com (India)
   ↓
6. User enters payment details on gateway
   ↓
7. Payment gateway processes payment
   ↓
8. Gateway redirects back to:
   /checkout/success?session_id=xxx&plan=monthly
   ↓
9. Success page calls API to activate subscription:
   POST /api/subscriptions/activate
   {
     sessionId: "xxx",
     plan: "monthly",
     userId: "user-id"
   }
   ↓
10. API verifies payment with gateway
    ↓
11. API updates database:
    - subscription_tier = 'pro'
    - subscription_end_date = NOW() + 1 month (or 12 months)
    - payment_id = "payment-id-from-gateway"
    ↓
12. Send confirmation email
    ↓
13. Show success page with:
    - "Welcome to Pro! 🎉"
    - What they can do now
    - Link to profile
    ↓
14. Redirect to /home after 3 seconds
```

### 6. Post-Purchase Experience

**Immediate Changes**:
- Profile badge: "PRO" badge appears
- AI chat: "Unlimited" instead of "3/3 messages"
- Trackers: Can create up to 20
- Settings: "Manage Subscription" button appears

**Notifications**:

#### A. Welcome Email
```
Subject: Welcome to Harthio Pro! 🎉

Hi [Name],

Thank you for upgrading to Harthio Pro! You now have access to:

✅ Unlimited AI conversations (200 messages/day)
✅ Full CBT tools suite
✅ 20 custom trackers
✅ Visual journey timeline
✅ Pattern detection & analytics
✅ Priority support

Get started: [Go to Dashboard]

Questions? Reply to this email or visit our help center.

Best,
The Harthio Team
```

#### B. In-App Notification
```
Location: Home page banner (dismissible)
Message: "🎉 Welcome to Pro!
You now have unlimited AI, 20 trackers, and advanced analytics.
[Explore Features]"
```

#### C. Profile Update
```
Location: User profile
Changes:
- "PRO" badge next to username
- Subscription status: "Pro Monthly - Renews on [date]"
- "Manage Subscription" button
```

### 7. Subscription Management

**Location**: `/me` (profile page)

**User can**:
- View current plan
- See renewal date
- See payment history
- Cancel subscription
- Update payment method
- Upgrade from monthly to yearly

**Cancel Flow**:
```
1. User clicks "Cancel Subscription"
   ↓
2. Show confirmation dialog:
   "Are you sure you want to cancel Pro?
   
   You'll lose access to:
   - Unlimited AI conversations
   - 20 custom trackers
   - Advanced analytics
   
   Your Pro access will continue until [end date].
   After that, you'll be on the Free plan.
   
   [Keep Pro] [Cancel Subscription]"
   ↓
3. If user confirms:
   - Call payment gateway API to cancel
   - Update database: will_renew = false
   - Keep Pro access until end date
   - Send cancellation email
   ↓
4. Show confirmation:
   "Subscription cancelled. You'll have Pro access until [date]."
```

### 8. Renewal Flow

**7 Days Before Renewal**:
```
Email: "Your Harthio Pro subscription renews in 7 days"
- Renewal date
- Amount to be charged
- Payment method
- Link to manage subscription
```

**1 Day Before Renewal**:
```
Email: "Your Harthio Pro subscription renews tomorrow"
- Final reminder
- Link to cancel if needed
```

**On Renewal Day**:
```
1. Payment gateway attempts to charge
   ↓
2. If successful:
   - Extend subscription_end_date by 1 month (or 12 months)
   - Send receipt email
   - Log transaction in database
   ↓
3. If failed:
   - Send payment failed email
   - Retry in 3 days
   - If still fails, downgrade to Free
```

### 9. Downgrade Flow (Trial Ends or Subscription Cancelled)

**When Pro access ends**:

```
1. Cron job checks daily for expired subscriptions
   ↓
2. For each expired user:
   - Set subscription_tier = 'free'
   - Set is_trial_active = false
   - Keep all user data
   ↓
3. Send downgrade email:
   "Your Pro subscription has ended"
   - What they lost access to
   - What they still have (Free features)
   - Link to upgrade again
   ↓
4. Next time user logs in:
   - Show banner: "Your Pro subscription has ended. Upgrade to continue with unlimited AI and advanced features. [Upgrade Now]"
   - AI chat shows: "3/3 messages remaining today"
   - Trackers: Can't create new ones (but keeps existing)
```

## Payment Gateway Recommendations

### Option 1: Paddle (RECOMMENDED)
**Why**: Best for SaaS, handles taxes, invoicing, and compliance

**Pros**:
- Merchant of record (handles all tax compliance)
- Built-in subscription management
- Global payment methods
- Easy integration
- Handles invoicing

**Cons**:
- 5% + $0.50 per transaction
- Slightly higher fees

**Integration**:
```typescript
// Install
npm install @paddle/paddle-js

// Initialize
import { initializePaddle } from '@paddle/paddle-js';

const paddle = await initializePaddle({
  environment: 'production',
  token: process.env.PADDLE_CLIENT_TOKEN
});

// Open checkout
paddle.Checkout.open({
  items: [{ priceId: 'pri_01h1vjes1y163xfj1rh1tkfb65', quantity: 1 }],
  customer: { email: user.email },
  customData: { userId: user.id }
});
```

### Option 2: Lemon Squeezy
**Why**: Simple, affordable, great for indie developers

**Pros**:
- 5% + $0.50 per transaction
- Merchant of record
- Easy setup
- Good documentation

**Cons**:
- Newer platform
- Fewer features than Paddle

### Option 3: Stripe (if you want full control)
**Why**: Most popular, most flexible

**Pros**:
- 2.9% + $0.30 per transaction (lower fees)
- Most features
- Best documentation

**Cons**:
- You handle tax compliance
- More complex setup
- Need to manage invoicing

## Database Schema for Subscriptions

```sql
-- Add to users table (already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_gateway TEXT; -- 'paddle', 'stripe', etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_customer_id TEXT; -- Customer ID from gateway
ALTER TABLE users ADD COLUMN IF NOT EXISTS will_renew BOOLEAN DEFAULT true;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription details
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- Payment
  payment_gateway TEXT NOT NULL, -- 'paddle', 'stripe', etc.
  gateway_subscription_id TEXT NOT NULL, -- Subscription ID from gateway
  gateway_customer_id TEXT NOT NULL, -- Customer ID from gateway
  
  -- Pricing
  amount_usd DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(gateway_subscription_id)
);

-- Create payments table (transaction history)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Payment details
  amount_usd DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'refunded', 'pending')),
  
  -- Gateway info
  payment_gateway TEXT NOT NULL,
  gateway_payment_id TEXT NOT NULL UNIQUE,
  gateway_customer_id TEXT,
  
  -- Metadata
  payment_method TEXT, -- 'card', 'paypal', etc.
  description TEXT,
  receipt_url TEXT,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_payments_user_id (user_id),
  INDEX idx_payments_created_at (created_at DESC)
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
```

## Finance Dashboard for Admin

Yes, you absolutely need a finance dashboard! Here's what it should include:

### Admin Finance Dashboard (`/admin-v2/finance`)

**Key Metrics**:
1. **Revenue Overview**
   - Total revenue (all time)
   - Monthly recurring revenue (MRR)
   - Annual recurring revenue (ARR)
   - Revenue this month
   - Revenue growth (% vs last month)

2. **Subscription Metrics**
   - Total Pro subscribers
   - Monthly vs Yearly breakdown
   - Active trials
   - Churn rate
   - Lifetime value (LTV)

3. **Payment Analytics**
   - Successful payments
   - Failed payments
   - Refunds
   - Payment method breakdown

4. **User Metrics**
   - Free users
   - Pro users
   - Trial users
   - Conversion rate (trial → paid)

5. **Projections**
   - Expected revenue next month
   - Expected renewals
   - Expected churn

**Charts**:
- Revenue over time (line chart)
- Subscription breakdown (pie chart)
- Payment success rate (bar chart)
- User tier distribution (donut chart)

I'll create the complete finance dashboard implementation next. Want me to continue with that?
