# Complete Freemium Strategy & Implementation Plan

**Status:** 📋 Ready for Implementation  
**Last Updated:** Week 9  
**Priority:** High (Core v0.3 Revenue Feature)

---

## 🎯 Executive Summary

This document consolidates the complete freemium strategy for Harthio v0.3, including:
- Smart tier system with data collection
- Rate limiting for free and pro users
- Proactive AI monitoring system
- Company information for AI responses
- Complete implementation roadmap

---

## 💰 Pricing Tiers

### Free Tier - $0/month (Data Collection Strategy)

**What They Get:**
- ✅ Unlimited peer sessions
- ✅ Unlimited daily check-ins (mood tracking)
- ✅ 1 basic sobriety tracker (days only)
- ✅ 3 AI messages/day
- ✅ 1 AI topic helper/day
- ✅ Crisis resources (unlimited, always)
- ✅ Basic breathing exercises
- ✅ 3 proactive AI prompts/day

**What They Don't Get:**
- ❌ Unlimited AI companion
- ❌ CBT tools (Thought Challenger, Grounding)
- ❌ Visual journey (image reveals)
- ❌ Real-time counter (seconds)
- ❌ Pattern detection & insights
- ❌ Multiple trackers
- ❌ Advanced analytics

**Why This Works:**
- Provides valuable data (mood patterns, recovery data, session feedback)
- Shows value without breaking bank
- Clear upgrade path at critical moments
- Ethical (crisis support always free)
- Sustainable (costs controlled)

**Cost Analysis:**
- 3 AI messages/day × $0.015 = $0.045/day = $1.35/month per user
- 1 topic helper/day × $0.02 = $0.60/month per user
- **Total: ~$2/month per free user**

---

### Pro Tier - $9.99/month (Full Access)

**What They Get:**
- ✅ Everything in Free, PLUS:
- ✅ 200 AI messages/day (feels unlimited)
- ✅ 5 AI topic helpers/day
- ✅ 100 CBT tool uses/day
- ✅ 20 sobriety trackers
- ✅ Real-time counter (seconds)
- ✅ Visual journey (30-piece reveals)
- ✅ Pattern detection & insights
- ✅ Advanced analytics
- ✅ 10 proactive AI prompts/day
- ✅ Priority support

**Rate Limits (Abuse Prevention):**
| Feature | Limit | Why |
|---------|-------|-----|
| AI Messages | 200/day | Prevent bot abuse, allow heavy use |
| Topic Helper | 5/day | Realistic session creation |
| CBT Tools | 100/day | Generous for therapy work |
| Trackers | 20 total | More than anyone needs |
| Tracker Resets | 10/day | Prevent accidental spam |
| Check-ins | 50/day | Prevent API abuse |
| Proactive Prompts | 10/day | Prevent annoyance |

**Cost Analysis:**
- Average user: 30 messages/day × $0.015 = $0.45/day = $13.50/month
- Heavy user: 100 messages/day × $0.015 = $1.50/day = $45/month
- **Break-even: Need users to average <666 messages/month**
- **Reality: Most will use 20-50 messages/day = profitable**

---

### Free Trial

**Duration:** 14 days (not 7)

**Why 14 Days:**
- Mental health needs time to show impact
- Users can experience full value
- See real progress in recovery
- Higher conversion after experiencing Pro features

**What Happens:**
- Full Pro access during trial
- All features unlocked
- No credit card required (optional)
- Auto-downgrade to Free after trial (not cancel)

---

## 🤖 Proactive AI Monitoring System

### Concept
AI monitors user behavior and proactively reaches out with helpful suggestions, creating a sense of being cared for.

### Key Features
- **Slide-down prompts** from top of screen
- **Appears on all pages EXCEPT /harthio** (AI page has full features)
- **Respects cooldowns** (doesn't spam)
- **Tier-aware responses** (free vs pro)

### Detection Triggers

| Trigger | When | Free Response | Pro Response |
|---------|------|---------------|--------------|
| **Session Browsing** | 30+ seconds on /sessions | "Help find session?" → Upgrade prompt | Personalized suggestions |
| **Mood Change** | Good → Struggling | "Want to talk?" → Limited messages | Full CBT tools |
| **Idle on Home** | 2+ minutes idle | "How are you?" → Basic support | Full AI support |
| **Multiple Resets** | 2+ resets in 7 days | "Want to talk?" → Limited support | Pattern analysis |
| **No Check-ins** | 3+ days no check-in | "Checking in..." → Basic support | Full support |
| **Session Ended** | Session just ended | "Process session?" → Limited | Full processing |

### Rate Limits

| Metric | Free | Pro |
|--------|------|-----|
| Max Prompts/Day | 3 | 10 |
| Prompt Cooldown | 2 hours | 30 min |
| Same Trigger Cooldown | 24 hours | 6 hours |

---

## 🏢 Company Information (AI Knowledge Base)

### About Harthio
```
Vision: "Create a safe space for meaningful conversations 
where people can find others who truly get it."

Mission: "Provide accessible, compassionate mental health 
and recovery support through AI-powered matching, peer 
connections, and professional therapy."

What Makes Us Different:
✅ Three-tier support (AI + Peers + Professionals)
✅ Recovery-focused with sobriety tracking
✅ AI-powered matching (not random)
✅ Evidence-based CBT tools
✅ Crisis detection & intervention
```

### Founders
```
[To be filled in with actual founder information]
```

### Contact
```
Email: support@harthio.com
Website: harthio.com
Social: @harthio
Crisis: 988 (24/7)
```

---

## 💻 Implementation Roadmap

### Phase 1: Database & Backend (Day 1-2)

**Files to Create:**
1. `database/migrations/add-tier-system.sql`
   - Add subscription_tier to user_profiles
   - Add trial tracking fields
   - Create ai_usage table
   - Create proactive_ai_events table (optional)

2. `src/lib/services/user-profile-service.ts`
   - getUserTier()
   - isProUser()
   - startFreeTrial()

3. `src/lib/services/ai-rate-limit-service.ts`
   - checkAIRateLimit()
   - incrementAIUsage()
   - Database function for atomic increment

4. `src/lib/services/proactive-ai-service.ts`
   - Detection functions for all triggers
   - Cooldown management
   - Tier-aware responses

**Tasks:**
- [ ] Create database migration
- [ ] Run migration on dev database
- [ ] Test tier checking functions
- [ ] Test rate limiting functions
- [ ] Test proactive detection functions

---

### Phase 2: Frontend Components (Day 2-3)

**Files to Create:**
1. `src/components/harthio/proactive-ai-monitor.tsx`
   - Global slide-down component
   - Appears on all pages except /harthio
   - Handles actions and dismissal

2. `src/components/harthio/upgrade-prompt.tsx`
   - Reusable upgrade prompt component
   - Shows Pro benefits
   - CTA buttons

3. `src/components/harthio/rate-limit-display.tsx`
   - Shows remaining messages
   - Only for free users

4. `src/hooks/useProactiveAI.ts`
   - useSessionBrowsingDetection()
   - useIdleDetection()
   - usePageTracking()
   - useTriggerMoodChange()
   - useTriggerResetDetection()
   - useTriggerSessionEnded()

5. `src/app/(authenticated)/upgrade/page.tsx`
   - Full upgrade page
   - Feature comparison
   - Pricing details
   - Trial CTA

**Tasks:**
- [ ] Create all components
- [ ] Test slide-down animation
- [ ] Test tier-aware rendering
- [ ] Test mobile responsiveness
- [ ] Test upgrade flow

---

### Phase 3: API Integration (Day 3-4)

**Files to Update:**
1. `src/app/api/ai/chat/route.ts`
   - Add authentication check
   - Add tier checking
   - Add rate limiting
   - Add tier-specific system prompts
   - Return rate limit info in response

2. `src/app/api/ai/topic-helper/route.ts` (if exists)
   - Add rate limiting (1/day free, 5/day pro)
   - Add tier checking

**System Prompt Updates:**
- Add company information
- Add tier-specific instructions
- Add upgrade messaging for free users
- Add Pro feature explanations

**Tasks:**
- [ ] Update AI chat API
- [ ] Update topic helper API
- [ ] Test rate limiting
- [ ] Test tier-specific responses
- [ ] Test upgrade prompts in AI

---

### Phase 4: Integration (Day 4-5)

**Files to Update:**
1. `src/app/layout.tsx`
   - Add ProactiveAIMonitor component

2. `src/app/(authenticated)/layout.tsx`
   - Add usePageTracking hook
   - Add useNoCheckinsDetection hook

3. `src/app/(authenticated)/sessions/page.tsx`
   - Add useSessionBrowsingDetection hook

4. `src/app/(authenticated)/home/page.tsx`
   - Add useIdleDetection hook
   - Update mood selector to trigger detection

5. `src/components/harthio/sobriety-counter.tsx`
   - Add reset detection trigger

6. `src/app/(authenticated)/session/[id]/page.tsx`
   - Add session ended trigger

7. `src/lib/services/tracker-service.ts`
   - Add canCreateTracker() function
   - Check tier before allowing creation

**Tasks:**
- [ ] Add ProactiveAIMonitor to layout
- [ ] Add all detection hooks
- [ ] Test all triggers
- [ ] Test cooldowns
- [ ] Test tier differences

---

### Phase 5: Testing (Day 5-6)

**Free User Tests:**
- [ ] Can create 1 basic tracker
- [ ] Cannot create 2nd tracker (shows upgrade)
- [ ] Can send 3 AI messages/day
- [ ] 4th message shows rate limit
- [ ] Can use 1 topic helper/day
- [ ] See proactive prompts (max 3/day)
- [ ] Prompts show upgrade messaging
- [ ] Crisis resources always available
- [ ] Can do unlimited check-ins
- [ ] Can join unlimited sessions

**Pro User Tests:**
- [ ] Can create up to 20 trackers
- [ ] Trackers have visual journey
- [ ] Trackers have real-time counter
- [ ] Can send up to 200 messages/day
- [ ] Can use 5 topic helpers/day
- [ ] Can access all CBT tools
- [ ] See proactive prompts (max 10/day)
- [ ] Get personalized AI responses
- [ ] Can see pattern detection

**Proactive AI Tests:**
- [ ] Session browsing triggers after 30s
- [ ] Mood change triggers on negative change
- [ ] Idle triggers after 2 min
- [ ] Multiple resets triggers after 2 in week
- [ ] No check-ins triggers after 3 days
- [ ] Session ended triggers on redirect
- [ ] Prompts never show on /harthio
- [ ] Cooldowns work correctly
- [ ] Mobile responsive

**General Tests:**
- [ ] Trial starts correctly
- [ ] Trial expires after 14 days
- [ ] Upgrade flow works
- [ ] Rate limits reset at midnight
- [ ] All APIs have auth
- [ ] All APIs have rate limiting
- [ ] Mobile responsive
- [ ] No console errors

---

### Phase 6: Deployment (Day 6-7)

**Pre-Deployment:**
- [ ] Review all code
- [ ] Run full test suite
- [ ] Check database migration
- [ ] Update environment variables
- [ ] Review security

**Deployment Steps:**
1. Deploy database migration
2. Deploy backend code
3. Deploy frontend code
4. Test in production
5. Monitor error logs
6. Monitor rate limits
7. Monitor conversion rates

**Post-Deployment:**
- [ ] Monitor AI costs
- [ ] Track conversion rates
- [ ] Collect user feedback
- [ ] Adjust cooldowns if needed
- [ ] Fix any bugs

---

## 📊 Success Metrics

### Engagement
- 80% of users try AI features
- 50% use AI weekly
- 60% daily check-ins
- 40% see proactive prompts

### Conversion
- 10% free → pro conversion (target)
- 50% start free trial
- 20% trial → paid conversion
- Track conversion by trigger type

### Revenue
- 500 users × 10% = 50 Pro users
- 50 × $9.99 = $500/month MRR
- AI costs: ~$100-150/month
- Net profit: $350-400/month

### Costs
- Free users: 450 × $2/month = $900/month
- Pro users: 50 × $20/month = $1,000/month
- Total AI costs: ~$1,900/month
- Revenue: $500/month
- **Need 15% conversion to break even**

### User Satisfaction
- Users feel supported
- AI feels "alive"
- Not annoying (adjust cooldowns)
- Positive feedback on proactive AI

---

## 🚨 Risk Mitigation

### Cost Overruns
- **Risk:** Pro users abuse unlimited AI
- **Mitigation:** 200 messages/day limit
- **Monitoring:** Track daily usage per user
- **Action:** Adjust limits if needed

### Low Conversion
- **Risk:** <10% conversion rate
- **Mitigation:** Optimize upgrade prompts
- **Monitoring:** Track conversion funnel
- **Action:** A/B test messaging

### User Annoyance
- **Risk:** Proactive AI feels spammy
- **Mitigation:** Cooldowns and limits
- **Monitoring:** User feedback
- **Action:** Adjust cooldowns

### Technical Issues
- **Risk:** Rate limiting bugs
- **Mitigation:** Thorough testing
- **Monitoring:** Error logs
- **Action:** Quick fixes

---

## 📝 Documentation Files

1. ✅ **V0.3_MASTER_PLAN.md** - Updated with pricing model
2. ✅ **RATE_LIMITING_IMPLEMENTATION.md** - Complete technical guide
3. ✅ **PROACTIVE_AI_SYSTEM.md** - Proactive AI documentation
4. ✅ **FREEMIUM_STRATEGY_COMPLETE.md** - This file (summary)

---

## 🎯 Next Steps

1. **Review & Approve** - Review this strategy with team
2. **Start Implementation** - Begin Phase 1 (Database)
3. **Daily Standups** - Track progress daily
4. **Test Thoroughly** - Don't skip testing phase
5. **Deploy Carefully** - Monitor closely after deployment
6. **Iterate Quickly** - Adjust based on data

---

**Ready to build a sustainable, profitable freemium model!** 💰
