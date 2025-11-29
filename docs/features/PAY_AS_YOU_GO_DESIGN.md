# Pay-As-You-Go Model for African Markets

## Problem
Subscriptions don't work well in Africa because:
- People prefer one-time payments
- Mobile money is more common than credit cards
- Income is often irregular
- Users want control over spending

## Solution: Credit-Based System

### Pricing Tiers

**Message Packs:**
- 🥉 **Starter**: $2 = 50 messages (30 days validity)
- 🥈 **Popular**: $5 = 150 messages (60 days validity) - Best value!
- 🥇 **Power**: $10 = 500 messages (90 days validity)

**Or keep Pro subscription** for heavy users:
- 💎 **Pro**: $9.99/month = Unlimited messages

### Database Schema

Add to `users` table:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_expire_at TIMESTAMP WITH TIME ZONE;
```

Add `credit_purchases` table:
```sql
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10,2) NOT NULL,
  credits_purchased INTEGER NOT NULL,
  payment_method TEXT, -- 'mpesa', 'airtel_money', 'card', etc.
  payment_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Rate Limiting Logic Update

Current logic:
```
Free: 3 messages/day
Pro: Unlimited
```

New logic:
```
Free: 3 messages/day
Credits: Use from balance (no daily limit)
Pro: Unlimited
```

Priority order:
1. Check if Pro → Unlimited
2. Check if has credits → Deduct 1 credit
3. Fall back to free tier → 3/day limit

### Code Changes

**1. Update rate limit service:**
```typescript
export async function checkAIMessageLimit(userId: string, authenticatedClient?: any): Promise<RateLimitResult> {
  const client = authenticatedClient || supabase;
  
  // Check platform settings
  const settings = await platformSettingsService.getSettings();
  if (!settings.rateLimitingEnabled) {
    return { allowed: true, remaining: 999, limit: 999, resetTime: new Date(), userTier: 'pro' };
  }
  
  // Get user tier and credits
  const { data: user } = await client
    .from('users')
    .select('subscription_tier, is_trial_active, trial_end_date, ai_credits, credits_expire_at')
    .eq('id', userId)
    .single();
  
  // 1. Check if Pro (subscription or active trial)
  if (user.subscription_tier === 'pro' || (user.is_trial_active && new Date(user.trial_end_date) > new Date())) {
    return { allowed: true, remaining: 999, limit: 999, resetTime: new Date(), userTier: 'pro' };
  }
  
  // 2. Check if has valid credits
  if (user.ai_credits > 0 && new Date(user.credits_expire_at) > new Date()) {
    return { 
      allowed: true, 
      remaining: user.ai_credits, 
      limit: user.ai_credits, 
      resetTime: new Date(user.credits_expire_at),
      userTier: 'credits'
    };
  }
  
  // 3. Fall back to free tier (3/day)
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await client
    .from('ai_usage')
    .select('message_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single();
  
  const currentCount = usage?.message_count || 0;
  const remaining = Math.max(0, 3 - currentCount);
  
  return {
    allowed: currentCount < 3,
    remaining,
    limit: 3,
    resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
    userTier: 'free'
  };
}
```

**2. Deduct credits on message send:**
```typescript
export async function incrementAIMessageUsage(userId: string, authenticatedClient?: any): Promise<void> {
  const client = authenticatedClient || supabase;
  
  // Check if user has credits
  const { data: user } = await client
    .from('users')
    .select('ai_credits, credits_expire_at, subscription_tier')
    .eq('id', userId)
    .single();
  
  // If Pro, don't deduct anything
  if (user.subscription_tier === 'pro') {
    return;
  }
  
  // If has valid credits, deduct 1
  if (user.ai_credits > 0 && new Date(user.credits_expire_at) > new Date()) {
    await client
      .from('users')
      .update({ ai_credits: user.ai_credits - 1 })
      .eq('id', userId);
    return;
  }
  
  // Otherwise, increment daily usage (free tier)
  const today = new Date().toISOString().split('T')[0];
  await client.rpc('increment_ai_message_usage', {
    p_user_id: userId,
    p_usage_date: today
  });
}
```

### UI Changes

**Rate limit message for free users:**
```
You've used your 3 free messages today! 💙

Choose your option:

1️⃣ Buy Message Pack (Pay once, use anytime)
   • 50 messages for $2
   • 150 messages for $5 ⭐ Best value!
   • 500 messages for $10

2️⃣ Subscribe to Pro ($9.99/month)
   • Unlimited messages
   • All premium features

3️⃣ Wait until tomorrow (Free resets daily)
```

### Payment Integration

**Mobile Money Support:**
- M-Pesa (Kenya, Tanzania)
- Airtel Money (Uganda, Nigeria)
- MTN Mobile Money (Ghana, Rwanda)
- Orange Money (Senegal, Côte d'Ivoire)

**Payment Gateways:**
- Flutterwave (supports all African mobile money)
- Paystack (Nigeria, Ghana, South Africa)
- Stripe (for cards)

### Migration Path

**Phase 1: Launch with subscriptions** (Current)
- Free: 3 messages/day
- Pro: $9.99/month unlimited

**Phase 2: Add credits** (2-4 weeks after launch)
- Add credit purchase UI
- Integrate mobile money
- Update rate limiting logic

**Phase 3: Optimize pricing** (Based on data)
- Adjust pack sizes based on usage patterns
- Add regional pricing
- Add bundle deals

### Pricing Strategy

**For African markets:**
- $2 = 50 messages (4¢ per message)
- $5 = 150 messages (3.3¢ per message) ← Best value
- $10 = 500 messages (2¢ per message)

**Comparison:**
- Pro subscription: $9.99 for unlimited = Best for 250+ messages/month
- Credits: Best for <250 messages/month or irregular users

### Revenue Projection

If 1000 users:
- 700 free users (0 revenue)
- 200 credit users ($5 avg) = $1,000/month
- 100 Pro users ($9.99) = $999/month
- **Total: $1,999/month**

vs. Subscription only:
- 900 free users (0 revenue)
- 100 Pro users ($9.99) = $999/month
- **Total: $999/month**

**Credits can double your revenue!** 💰

### Implementation Checklist

- [ ] Add `ai_credits` and `credits_expire_at` columns to users table
- [ ] Create `credit_purchases` table
- [ ] Update rate limiting logic to check credits
- [ ] Update increment function to deduct credits
- [ ] Create credit purchase UI
- [ ] Integrate mobile money payment gateway
- [ ] Add credit balance display in UI
- [ ] Add "Buy Credits" button when rate limited
- [ ] Test credit expiry logic
- [ ] Add admin panel for credit management

### Security

**Prevent abuse:**
- Credits expire (30-90 days)
- One-time use (can't refund)
- Server-side validation
- Log all credit transactions
- Rate limit credit purchases (max 5/day)

### User Experience

**When user runs out:**
```
💬 You have 0 AI messages left

Quick top-up:
[Buy 50 messages - $2] [Buy 150 - $5 ⭐]

Or upgrade to Pro for unlimited messages
[Start 14-Day Free Trial]
```

**Credit balance display:**
```
💬 AI Messages: 47 remaining
Expires: Dec 15, 2025
[Buy More]
```

This model works perfectly for African markets and increases accessibility! 🌍
