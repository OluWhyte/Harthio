# User Feedback & Notifications - Complete System

## Problem
Users don't get clear feedback when they hit tier limits or restrictions. They need to know:
- WHY something isn't working
- WHAT tier they're on
- HOW to upgrade
- WHEN their trial ends

## All Scenarios That Need Notifications

### 1. AI Chat Rate Limit Hit (Free User)
**Trigger**: Free user sends 4th AI message

**Current**: Generic error or no message

**Should Show**:
```
🤖 Daily AI Limit Reached

You've used your 3 free AI messages today!

Upgrade to Pro for:
• Unlimited AI conversations (200/day)
• Full CBT tools suite
• Advanced recovery tracking

Your messages reset tomorrow at midnight.

[Upgrade to Pro] [Maybe Later]
```

### 2. AI Chat Rate Limit Hit (Trial Ended)
**Trigger**: Trial user (expired) sends 4th message

**Should Show**:
```
⏰ Your Pro Trial Has Ended

Your 14-day trial ended on [date]. You're now on the Free plan with 3 AI messages per day.

Want to continue with unlimited AI?

[Upgrade to Pro - $9.99/mo] [View Free Features]
```

### 3. Tracker Limit Hit (Free User)
**Trigger**: Free user tries to create 2nd tracker

**Should Show**:
```
📊 Tracker Limit Reached

Free users can create 1 tracker. You already have:
• [Tracker Name] - [X] days

Upgrade to Pro to create up to 20 trackers and track multiple recovery goals.

[Upgrade to Pro] [Manage Trackers]
```

### 4. Tracker Limit Hit (Trial Ended)
**Trigger**: Expired trial user tries to create 2nd tracker

**Should Show**:
```
⏰ Your Pro Trial Has Ended

Your trial ended on [date]. Free users can have 1 tracker.

You currently have:
• [Tracker 1] - [X] days
• [Tracker 2] - [X] days

Upgrade to Pro to keep all your trackers and create up to 20.

[Upgrade to Pro - $9.99/mo] [Delete a Tracker]
```

### 5. Trial Ended (Login Notification)
**Trigger**: User logs in after trial expired

**Should Show** (Banner at top):
```
⏰ Your Pro Trial Has Ended

Your 14-day trial ended on [date]. You're now on the Free plan.

Free Plan Includes:
• Unlimited peer sessions
• 3 AI messages per day
• 1 recovery tracker
• Daily check-ins

Want to continue with Pro features?

[Upgrade to Pro - $9.99/mo] [Dismiss]
```

### 6. Trial Ending Soon (7 Days Before)
**Trigger**: User logs in 7 days before trial ends

**Should Show** (Banner):
```
⏰ Trial Ending Soon

Your Pro trial ends in 7 days (on [date]).

After that, you'll be on the Free plan unless you upgrade.

[Upgrade Now] [Remind Me Later]
```

### 7. Trial Ending Soon (1 Day Before)
**Trigger**: User logs in 1 day before trial ends

**Should Show** (Banner):
```
⚠️ Trial Ends Tomorrow

Your Pro trial ends tomorrow at [time].

Don't lose access to:
• Unlimited AI conversations
• 20 custom trackers
• Advanced analytics

[Upgrade Now - $9.99/mo] [Let It Expire]
```

### 8. Pro Feature Attempted (Free User)
**Trigger**: Free user tries to access Pro-only feature

**Should Show**:
```
✨ Pro Feature

This feature is available on the Pro plan.

Pro includes:
• Unlimited AI (200 messages/day)
• 20 custom trackers
• Visual journey timeline
• Pattern detection
• Advanced analytics

[Start 14-Day Free Trial] [Learn More]
```

### 9. Payment Failed (Pro User)
**Trigger**: Subscription payment fails

**Should Show**:
```
⚠️ Payment Failed

We couldn't process your payment for Pro ($9.99/mo).

Your Pro access will continue until [date]. Please update your payment method to avoid interruption.

[Update Payment Method] [Contact Support]
```

### 10. Subscription Cancelled (Still Active)
**Trigger**: User cancels but still has time left

**Should Show**:
```
✓ Subscription Cancelled

Your Pro subscription has been cancelled.

You'll keep Pro access until [date], then you'll be on the Free plan.

Changed your mind?

[Reactivate Pro] [View Free Features]
```

### 11. Subscription Expired (First Login After)
**Trigger**: User logs in after subscription expired

**Should Show**:
```
📅 Pro Subscription Expired

Your Pro subscription ended on [date]. You're now on the Free plan.

Miss Pro features? Reactivate anytime!

[Reactivate Pro - $9.99/mo] [Continue with Free]
```

### 12. Trial Not Available (Trial Mode Disabled)
**Trigger**: User clicks "Start Free Trial" when trial mode is off

**Should Show**:
```
💳 Free Trials Currently Unavailable

Free trials are not available at this time.

You can:
• Use the Free plan (unlimited peer sessions, 3 AI messages/day)
• Upgrade to Pro immediately ($9.99/mo)

[Upgrade to Pro] [Continue with Free]
```

## Implementation Plan

### Phase 1: Core Notifications (High Priority)
1. ✅ AI rate limit hit (already exists)
2. ⚠️ Trial ended notification
3. ⚠️ Tracker limit hit
4. ⚠️ Trial ending soon (7 days, 1 day)

### Phase 2: Enhanced UX (Medium Priority)
5. Pro feature attempted
6. Trial not available
7. Login banners for expired trials

### Phase 3: Subscription Management (Low Priority)
8. Payment failed
9. Subscription cancelled
10. Subscription expired

## Technical Implementation

### 1. Create Notification Service
```typescript
// src/lib/services/notification-service.ts

export const notificationService = {
  // Check and show trial ending notifications
  async checkTrialStatus(userId: string): Promise<TrialNotification | null> {
    const tierInfo = await getTierInfo(userId);
    
    if (!tierInfo.isTrialActive) return null;
    
    const daysLeft = Math.ceil(
      (new Date(tierInfo.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysLeft === 7) {
      return {
        type: 'trial-ending-7-days',
        title: '⏰ Trial Ending Soon',
        message: `Your Pro trial ends in 7 days (on ${formatDate(tierInfo.trialEndDate)}).`,
        actions: ['upgrade', 'remind-later']
      };
    }
    
    if (daysLeft === 1) {
      return {
        type: 'trial-ending-1-day',
        title: '⚠️ Trial Ends Tomorrow',
        message: `Your Pro trial ends tomorrow. Don't lose access to unlimited AI and advanced features.`,
        actions: ['upgrade', 'let-expire']
      };
    }
    
    if (daysLeft <= 0) {
      return {
        type: 'trial-ended',
        title: '⏰ Your Pro Trial Has Ended',
        message: `Your trial ended on ${formatDate(tierInfo.trialEndDate)}. You're now on the Free plan.`,
        actions: ['upgrade', 'dismiss']
      };
    }
    
    return null;
  },
  
  // Check if user just hit a limit
  async checkLimitHit(userId: string, limitType: 'ai' | 'tracker'): Promise<LimitNotification | null> {
    const tierInfo = await getTierInfo(userId);
    
    if (limitType === 'ai') {
      const rateLimit = await checkAIMessageLimit(userId);
      if (!rateLimit.allowed) {
        return {
          type: 'ai-limit-hit',
          title: '🤖 Daily AI Limit Reached',
          message: `You've used your ${rateLimit.limit} free AI messages today!`,
          tier: tierInfo.tier,
          trialEnded: tierInfo.tier === 'free' && tierInfo.hadTrial,
          actions: ['upgrade', 'maybe-later']
        };
      }
    }
    
    if (limitType === 'tracker') {
      // Check tracker limit
      const trackers = await sobrietyService.getUserTrackers(userId);
      const limit = tierInfo.tier === 'pro' ? 20 : 1;
      
      if (trackers.length >= limit) {
        return {
          type: 'tracker-limit-hit',
          title: '📊 Tracker Limit Reached',
          message: `${tierInfo.tier === 'free' ? 'Free users can create 1 tracker.' : 'You\'ve reached your tracker limit.'}`,
          tier: tierInfo.tier,
          trialEnded: tierInfo.tier === 'free' && tierInfo.hadTrial,
          currentTrackers: trackers,
          actions: ['upgrade', 'manage-trackers']
        };
      }
    }
    
    return null;
  }
};
```

### 2. Create Notification Components
```typescript
// src/components/harthio/tier-notification-banner.tsx
// Shows at top of page for trial ending, trial ended, etc.

// src/components/harthio/limit-reached-dialog.tsx
// Shows when user hits AI or tracker limit

// src/components/harthio/upgrade-prompt-dialog.tsx
// Unified upgrade dialog with context-specific messaging
```

### 3. Add to Key Pages
- Home page: Check trial status on load
- AI chat: Show limit dialog when rate limit hit
- Tracker creation: Show limit dialog when limit hit
- Profile: Show subscription status

## Message Tone Guidelines

### DO:
- ✅ Be empathetic and supportive
- ✅ Explain clearly what happened
- ✅ Show what they're missing
- ✅ Provide clear next steps
- ✅ Use friendly emojis (1-2 per message)

### DON'T:
- ❌ Be pushy or aggressive
- ❌ Make users feel bad
- ❌ Hide information
- ❌ Use confusing jargon
- ❌ Overuse emojis

## Next Steps

1. Create notification service
2. Create notification components
3. Add to AI chat (rate limit)
4. Add to tracker creation (limit)
5. Add to home page (trial status)
6. Test all scenarios
7. Add email notifications (trial ending, trial ended, payment failed)

This will give users clear, helpful feedback in every situation!
