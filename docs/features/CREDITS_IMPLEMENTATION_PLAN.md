# Credits System Implementation Plan

## Overview
Add pay-as-you-go credits alongside existing Pro subscription system.

---

## Phase 1: Database Schema ✅ START HERE

### 1.1 Add Credit Columns to Users Table
```sql
-- File: database/migrations/add-credits-system.sql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_expire_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(ai_credits, credits_expire_at);
```

### 1.2 Create Credit Purchases Table
```sql
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10,2) NOT NULL,
  credits_purchased INTEGER NOT NULL,
  payment_method TEXT, -- 'card', 'mpesa', 'airtel_money', etc.
  payment_id TEXT UNIQUE,
  payment_gateway TEXT, -- 'stripe', 'flutterwave', 'paystack'
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit purchases"
  ON credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credit purchases"
  ON credit_purchases FOR SELECT
  USING (is_admin());

-- Indexes
CREATE INDEX idx_credit_purchases_user ON credit_purchases(user_id);
CREATE INDEX idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX idx_credit_purchases_created ON credit_purchases(created_at DESC);
```

### 1.3 Update Payments Table
```sql
-- Add credit-related fields to existing payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS credits_purchased INTEGER,
ADD COLUMN IF NOT EXISTS credits_expire_at TIMESTAMP WITH TIME ZONE;
```

---

## Phase 2: Backend Services ✅ COMPLETE

### 2.1 Create Credits Service ✅
**File:** `src/lib/services/credits-service.ts`

```typescript
import { supabase } from '@/lib/supabase';

export interface CreditBalance {
  credits: number;
  expiresAt: Date | null;
  isExpired: boolean;
}

export interface CreditPack {
  id: string;
  name: string;
  price: number;
  credits: number;
  validityDays: number;
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 2.00,
    credits: 50,
    validityDays: 30,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    price: 5.00,
    credits: 150,
    validityDays: 60,
    popular: true,
  },
  {
    id: 'power',
    name: 'Power Pack',
    price: 10.00,
    credits: 500,
    validityDays: 90,
  },
];

export const creditsService = {
  /**
   * Get user's current credit balance
   */
  async getCreditBalance(userId: string): Promise<CreditBalance> {
    const { data, error } = await supabase
      .from('users')
      .select('ai_credits, credits_expire_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { credits: 0, expiresAt: null, isExpired: false };
    }

    const expiresAt = data.credits_expire_at ? new Date(data.credits_expire_at) : null;
    const isExpired = expiresAt ? expiresAt < new Date() : false;

    return {
      credits: isExpired ? 0 : (data.ai_credits || 0),
      expiresAt,
      isExpired,
    };
  },

  /**
   * Add credits to user account
   */
  async addCredits(
    userId: string,
    credits: number,
    validityDays: number,
    paymentId?: string
  ): Promise<{ success: boolean; error?: string; newBalance?: number }> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('ai_credits, credits_expire_at')
        .eq('id', userId)
        .single();

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const now = new Date();
      const currentExpiry = user.credits_expire_at ? new Date(user.credits_expire_at) : null;
      
      // Calculate new expiry date
      let newExpiry: Date;
      if (currentExpiry && currentExpiry > now) {
        // Extend existing expiry by validity days
        newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + validityDays);
      } else {
        // Start fresh expiry
        newExpiry = new Date(now);
        newExpiry.setDate(newExpiry.getDate() + validityDays);
      }

      // Add credits to existing balance (or reset if expired)
      const currentCredits = (currentExpiry && currentExpiry > now) ? (user.ai_credits || 0) : 0;
      const newBalance = currentCredits + credits;

      const { error } = await supabase
        .from('users')
        .update({
          ai_credits: newBalance,
          credits_expire_at: newExpiry.toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error adding credits:', error);
        return { success: false, error: 'Failed to add credits' };
      }

      return { success: true, newBalance };
    } catch (error) {
      console.error('Error in addCredits:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Deduct one credit from user balance
   */
  async deductCredit(userId: string): Promise<{ success: boolean; remaining?: number }> {
    try {
      const balance = await this.getCreditBalance(userId);
      
      if (balance.isExpired || balance.credits <= 0) {
        return { success: false };
      }

      const { error } = await supabase
        .from('users')
        .update({ ai_credits: balance.credits - 1 })
        .eq('id', userId);

      if (error) {
        console.error('Error deducting credit:', error);
        return { success: false };
      }

      return { success: true, remaining: balance.credits - 1 };
    } catch (error) {
      console.error('Error in deductCredit:', error);
      return { success: false };
    }
  },

  /**
   * Record credit purchase
   */
  async recordPurchase(
    userId: string,
    packId: string,
    paymentId: string,
    paymentMethod: string,
    paymentGateway: string
  ): Promise<{ success: boolean; error?: string }> {
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) {
      return { success: false, error: 'Invalid pack' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pack.validityDays);

    const { error } = await supabase
      .from('credit_purchases')
      .insert({
        user_id: userId,
        amount_usd: pack.price,
        credits_purchased: pack.credits,
        payment_method: paymentMethod,
        payment_id: paymentId,
        payment_gateway: paymentGateway,
        status: 'completed',
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error('Error recording purchase:', error);
      return { success: false, error: 'Failed to record purchase' };
    }

    return { success: true };
  },

  /**
   * Get user's purchase history
   */
  async getPurchaseHistory(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('credit_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase history:', error);
      return [];
    }

    return data || [];
  },
};
```

### 2.2 Update Rate Limit Service
**File:** `src/lib/services/ai-rate-limit-service.ts`

Add credit checking logic (already outlined in PAY_AS_YOU_GO_DESIGN.md)

### 2.3 Update AI Message Increment
Update to deduct credits when used (already outlined in PAY_AS_YOU_GO_DESIGN.md)

---

## Phase 3: Frontend UI ✅ COMPLETE

### 3.1 Update Pricing Page ✅
**File:** `src/app/pricing/page.tsx`

Add credit packs section between Free and Pro tiers.

### 3.2 Create Credits Purchase Page
**File:** `src/app/(authenticated)/credits/page.tsx`

Show available packs, current balance, purchase history.

### 3.3 Update Rate Limit Message
**File:** `src/app/(authenticated)/harthio/page.tsx`

Show credit purchase option when rate limited.

### 3.4 Add Credit Balance Display
**File:** `src/components/harthio/credit-balance-indicator.tsx`

Show in header/sidebar: "💬 47 messages left"

---

## Phase 4: Admin Panel

### 4.1 Credits Overview Dashboard
**File:** `src/app/admin-v2/credits/page.tsx`

- Total credits sold
- Revenue from credits
- Active credit users
- Expiring credits soon

### 4.2 Credit Management
**File:** `src/app/admin-v2/credits/manage/page.tsx`

- Manually add/remove credits
- View user credit balances
- Credit purchase history
- Refund credits

### 4.3 Update Finance Dashboard
**File:** `src/app/admin-v2/finance/page.tsx`

Add credits revenue tracking.

---

## Phase 5: Payment Integration

### 5.1 Create Payment API Route
**File:** `src/app/api/credits/purchase/route.ts`

Handle credit purchase requests.

### 5.2 Create Webhook Handler
**File:** `src/app/api/webhooks/credits/route.ts`

Receive payment confirmations from gateway.

### 5.3 Payment Gateway Integration
Choose one:
- Flutterwave (Best for Africa)
- Paystack (Nigeria, Ghana, SA)
- Stripe (Global cards)

---

## Phase 6: Testing

### 6.1 Test Cases
- [ ] Buy credits (all packs)
- [ ] Use credits (deduct correctly)
- [ ] Credits expire (auto-disable)
- [ ] Stack credits (extend expiry)
- [ ] Pro user buys credits (credits saved)
- [ ] Credits + Pro priority (Pro used first)
- [ ] Admin add/remove credits
- [ ] Payment webhook
- [ ] Refund credits

---

## Implementation Order

**Week 1: Database + Backend**
1. Run database migration
2. Create credits service
3. Update rate limit service
4. Test credit logic

**Week 2: Frontend UI**
5. Update pricing page
6. Create credits purchase page
7. Update rate limit message
8. Add credit balance display

**Week 3: Admin Panel**
9. Credits dashboard
10. Credit management
11. Finance integration

**Week 4: Payment + Testing**
12. Payment API
13. Webhook handler
14. Gateway integration
15. Full testing

---

## Files to Create/Update

### New Files (15):
1. `database/migrations/add-credits-system.sql`
2. `src/lib/services/credits-service.ts`
3. `src/app/(authenticated)/credits/page.tsx`
4. `src/components/harthio/credit-balance-indicator.tsx`
5. `src/app/admin-v2/credits/page.tsx`
6. `src/app/admin-v2/credits/manage/page.tsx`
7. `src/app/api/credits/purchase/route.ts`
8. `src/app/api/webhooks/credits/route.ts`
9. `src/lib/services/payment-gateway-service.ts`
10. `CREDITS_TESTING_GUIDE.md`

### Update Files (8):
1. `src/lib/services/ai-rate-limit-service.ts`
2. `src/app/pricing/page.tsx`
3. `src/app/(authenticated)/harthio/page.tsx`
4. `src/app/admin-v2/finance/page.tsx`
5. `src/components/harthio/mobile-page-header.tsx`
6. `src/lib/database-types.ts`
7. `COMPLETE_PRICING_MODEL.md`
8. `PAYMENT_INTEGRATION_CHECKLIST.md`

---

## Ready to Start?

I'll implement this step by step. Should I start with Phase 1 (Database)?
