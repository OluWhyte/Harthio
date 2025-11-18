# Harthio AI Features - Complete Implementation Plan

**Date:** November 14, 2025  
**Status:** Planning Phase - Ready for Implementation  
**Goal:** Transform Harthio into an AI-powered mental health companion platform

---

## Vision Statement

**Harthio: Your 24/7 Recovery Companion**

**Mission:** Fight addiction and mental health struggles through AI-powered support + human connection.

**The Problem We Solve:**
- Traditional therapy: Expensive, limited hours, long wait times
- Support groups: Scheduled times, location-dependent
- Crisis hotlines: Only for emergencies, not ongoing support
- Friends/family: Well-meaning but often don't understand

**Harthio's Three-Tier Support System:**

```
┌─────────────────────────────────────────┐
│  Tier 1: AI Companion (Harthio)        │
│  • 24/7 availability                    │
│  • Immediate support                    │
│  • CBT tools & tracking                 │
│  • Cost: Free/Pro subscription          │
└─────────────────────────────────────────┘
              ↕ Seamless Integration
┌─────────────────────────────────────────┐
│  Tier 2: Peer Sessions (Current)       │
│  • Real human connection                │
│  • Shared experiences                   │
│  • Community support                    │
│  • Cost: Free                           │
│  • Status: ✅ Live with 40 users        │
└─────────────────────────────────────────┘
              ↕ Future Integration
┌─────────────────────────────────────────┐
│  Tier 3: Professional Therapy (Future) │
│  • Licensed therapists                  │
│  • Clinical treatment                   │
│  • Insurance accepted                   │
│  • Cost: Paid sessions                  │
│  • Status: 🔮 Planned (foundation ready)│
└─────────────────────────────────────────┘
```

**How They Complement Each Other:**

**AI → Peer Sessions:**
- Harthio suggests relevant peer sessions
- Helps users articulate what they need
- Prepares users for meaningful conversations
- Follows up after sessions

**Peer Sessions → AI:**
- After sessions, Harthio helps process insights
- Tracks progress from peer support
- Reinforces learnings between sessions
- Suggests follow-up sessions

**Foundation for Therapists (Future):**
- Session type field: `peer` | `professional`
- User role: `peer` | `therapist` | `admin`
- Payment integration ready
- Licensing verification system
- Insurance claim support

**Target Users:**
1. **Primary:** People in addiction recovery (alcohol, drugs, gambling, etc.)
2. **Secondary:** People with mental health challenges (anxiety, depression, PTSD)
3. **Tertiary:** Anyone seeking meaningful peer support

**Current Status:** 40 users, peer sessions working, ready to add AI layer

**Positioning:** "Your complete recovery support system - AI when you need it, humans when you want it"

---

## Core Philosophy

1. **Recovery-First Design** - Every feature supports the recovery journey
2. **AI + Human Hybrid** - AI provides 24/7 support, humans provide connection
3. **Evidence-Based** - CBT, DBT, and proven recovery methodologies
4. **Mobile-First** - Always accessible when cravings or struggles hit
5. **Non-Judgmental** - Relapses are part of recovery, not failure
6. **Community-Driven** - Peer support is powerful medicine

## The Harthio Recovery System (How Features Work Together)

### **The Daily Cycle**
```
Morning:
1. Harthio greets you → Daily check-in
2. Set intention for the day
3. See today's sessions

Throughout Day:
4. Struggle hits → Open Harthio
5. AI provides immediate support
6. Suggests relevant session or CBT tool
7. Connect with peers in real-time

Evening:
8. Reflect on the day with Harthio
9. Log progress (bridge grows)
10. Plan for tomorrow

Crisis Moment:
11. Open Harthio immediately
12. Emergency coping techniques
13. Connect to live support session
14. Crisis resources if needed
```

### **The Recovery Journey (Long-term)**
```
Week 1: Getting Started
- Learn to use Harthio for support
- Join first peer session
- Start daily check-ins

Month 1: Building Habits
- Daily Harthio conversations
- Regular session attendance
- CBT tools become familiar
- Recovery bridge growing

Month 3: Gaining Strength
- Harthio knows your patterns
- Proactive session suggestions
- Helping others in sessions
- Visible progress motivates

Month 6+: Sustained Recovery
- Harthio is your safety net
- Leading sessions for others
- Recovery bridge is strong
- Giving back to community
```

---

## Mobile-First Navigation (4 Tabs)

### **Bottom Navigation**
```
┌─────────────────────────────────────────┐
│  💬        📅        📊        👤       │
│ Harthio  Sessions  Journey    Me       │
└─────────────────────────────────────────┘
```

### **Tab Mapping**

| Tab | Contains | Replaces Current |
|-----|----------|------------------|
| **💬 Harthio** | AI chat, CBT tools, daily check-in | *(New)* |
| **📅 Sessions** | Browse, create, join sessions | Dashboard + Sessions |
| **📊 Journey** | Progress, history, requests | History + Requests |
| **👤 Me** | Profile, settings, notifications | Profile + Notifications |

**Design Principle:** Works seamlessly on mobile, tablet, and desktop with minimal UI differences.

---

---

## Tab 1: 💬 Harthio (AI Chat Interface)

### **What is Harthio?**
Harthio is your conversational AI companion that:
- Provides 24/7 mental health support
- Guides you through CBT exercises
- Helps you find or create relevant sessions
- Tracks your daily mood and progress
- Offers immediate support during difficult moments

### **Chat Interface Design**
```
┌─────────────────────────────┐
│ ← Harthio            ⋮      │ ← Header
├─────────────────────────────┤
│                             │
│  Harthio 💬                 │
│  Hey! How are you feeling   │
│  today?                     │
│                             │
│           You 👤            │
│           Not great, having │
│           cravings          │
│                             │
│  Harthio 💬                 │
│  I'm here for you. Let's    │
│  work through this:         │
│                             │
│  ┌─────────────────────┐   │
│  │ 🧠 Challenge Thoughts│   │ ← Quick Actions
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ 🎯 Find Support     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ 💪 Coping Technique │   │
│  └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│ [Type message...]      [→] │ ← Input
└─────────────────────────────┘
```

---

## Phase 1: Core Harthio Features (Launch Ready)

### **Feature 1: Conversational Support**
**What it does:** Natural conversation about mental health struggles

**Example Flow:**
```
User: "I'm feeling anxious about work"

Harthio: "I hear you. Work anxiety is tough. Let me help:

1. 🧠 Challenge those thoughts (CBT exercise)
2. 📊 Log how you're feeling today
3. 🎯 Find a session about work stress
4. 💪 Quick coping technique

What feels right for you right now?"
```

### **Feature 2: Daily Check-In**
**What it does:** Track mood and build self-awareness

**User Flow:**
```
Harthio: "Good morning! Quick check-in:
How are you feeling today?
😢 Struggling | 😐 Okay | 😊 Good | 🚀 Great"

[User taps 😐 Okay]

Harthio: "Got it. Anything specific on your mind?"

User: "Just worried about staying sober tonight"

Harthio: "I hear you. Evening cravings are tough. 
Let's make a plan:
- There's a session at 7pm about evening sobriety
- I can guide you through a coping technique now
- We can set a reminder to check in at 6pm

What would help most?"
```

**Why This Matters:**
- Builds daily habit of self-reflection
- Harthio learns your patterns
- Early intervention before crisis
- Data for progress tracking

### **Feature 3: CBT Tools (Guided Exercises)**
**What it does:** Evidence-based techniques for managing struggles

**Priority Tools:**

#### **1. Thought Challenger**
```
User: "I'm going to relapse, I can't do this"

Harthio: "Let's challenge that thought together.

What evidence do you have that you'll relapse?
[Type answer...]

User: "I've failed before"


### User Flow (Current vs Proposed)

**Current Flow:**
1. Click "Create Session"
2. Stare at empty title field
3. Type something vague
4. Struggle with description
5. Post mediocre session OR give up

**Proposed Flow:**
1. Click "Create Session"
2. See: "💡 Not sure how to describe it? Let AI help"
3. Type rough idea in casual language
4. AI generates title + description
5. User edits/approves
6. Post high-quality session

### UI Changes Needed

#### 1. Session Creation Page Updates
```
Current:
┌─────────────────────────────────┐
│ Title: [________________]       │
│ Description: [__________]       │
│ [Create Session]                │
└─────────────────────────────────┘

Proposed:
┌─────────────────────────────────┐
│ 💡 What's on your mind?         │
│ [Tell me in your own words...]  │
│ [✨ Generate Topic] [Skip]      │
│                                 │
│ OR write manually:              │
│ Title: [________________]       │
│ Description: [__________]       │
│ [Create Session]                │
└─────────────────────────────────┘
```

#### 2. AI Generation Modal
```
┌─────────────────────────────────┐
│ ✨ AI Topic Helper              │
│                                 │
│ Your input:                     │
│ "struggling with work stress    │
│  and feeling burnt out"         │
│                                 │
│ Generated:                      │
│ Title: Managing Work Burnout    │
│ Description: Let's discuss...   │
│                                 │
│ [✏️ Edit] [✓ Use This] [🔄 Try Again] │
└─────────────────────────────────┘
```

#### 3. Free vs Pro Indicator
```
Free users:
"💡 AI Topic Helper (1 left today)"

Pro users:
"✨ AI Topic Helper (Unlimited)"
```

### Technical Requirements

#### API Endpoint
- `POST /api/ai/generate-topic`
- Input: `{ userInput: string, userId: string }`
- Output: `{ title: string, description: string, tokensUsed: number }`

#### Rate Limiting

**Two Separate Limits:**

1. **AI Topic Helper** (for session creation)
   - Free: 1 per day
   - Pro: 10 per day
   - Prevents session spam
   - Encourages thoughtful session creation

2. **Harthio AI Companion** (main chat)
   - Free: ❌ Not available
   - Pro: ✅ Unlimited
   - This is the main Pro value
   - No limits on support conversations

**Database Tracking:**
```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  feature_type TEXT, -- 'topic_helper' or 'ai_chat'
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily limits check
SELECT COUNT(*) 
FROM ai_usage 
WHERE user_id = $1 
  AND feature_type = 'topic_helper'
  AND created_at > NOW() - INTERVAL '24 hours';
```

**Why This Model?**
- Free users taste AI value (1 topic helper/day)
- Free users can track mood (unlimited check-ins)
- Pro users get full AI companion (unlimited chat)
- Topic helper limited to prevent spam (10/day even for Pro)
- Encourages Pro conversion for real AI support

#### Cost Controls
- Cache identical inputs (1 hour TTL)
- Daily budget limit: $5 (~35,000 tokens)
- Alert at 80% budget
- Auto-disable at 100%

#### Database Schema
```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  feature TEXT, -- 'topic_helper', 'support_chat', etc.
  tokens_used INTEGER,
  cached BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at);
```

### Success Metrics
- **Activation:** % of users who try AI helper
- **Quality:** Sessions created with AI vs manual (completion rate)
- **Conversion:** Free users hitting daily limit → Pro signup
- **Cost:** Average cost per session generated

### Rollout Plan
1. **Week 1:** Build UI mockups, get user feedback
2. **Week 2:** Implement with mock data (no API calls)
3. **Week 3:** Integrate DeepSeek API, test with 10 users
4. **Week 4:** Beta launch to 100 users, monitor costs
5. **Week 5:** Full launch if metrics are positive

---

## Phase 2: AI Support Companion (Future)

### The Vision
24/7 AI companion for addiction recovery and mental health support.

### Key Features (Prioritized)

#### 1. Daily Pulse Check (Easiest)
- One-tap mood tracking
- Optional context note
- Builds user profile over time

#### 2. Thought Challenger (High Value)
- CBT-based negative thought reframing
- Interactive Q&A format
- Suggests relevant sessions after

#### 3. Craving De-escalator (Critical)
- Emergency support for addiction cravings
- Distraction techniques
- Immediate human session suggestions

#### 4. Recovery Tracker (Motivational)
- Visual progress (bridge/phoenix/mountain)
- Never fully resets on relapse
- Celebrates milestones

### UI Considerations

#### Navigation Addition
```
Current:
[Dashboard] [Sessions] [Profile]

Proposed:
[Dashboard] [Sessions] [Support 🤖] [Profile]
```

#### Floating Support Button
```
Fixed position bottom-right:
[💬 Need Support?]

Expands to:
┌─────────────────────┐
│ Quick Support       │
│ • Talk to AI        │
│ • Join Session      │
│ • Crisis Resources  │
└─────────────────────┘
```

### Technical Complexity
- **Easy:** Pulse check, tracker
- **Medium:** Thought challenger, session suggestions
- **Hard:** Real-time chat, context awareness

### Cost Estimates
- Topic Helper: $0.002 per use
- Support Chat: $0.01-0.05 per conversation
- Daily Pulse: $0.001 per check

**Monthly for 1,000 active users:**
- Topic Helper only: $50-100
- Full support features: $200-500

---

## Phase 3: Monetization Strategy

### Free Tier
- Unlimited peer sessions
- 1 AI topic helper per day
- Basic mood tracking
- Crisis resources

### Pro Tier ($9.99/month)
- Unlimited AI topic helper
- Full AI support companion
- All CBT tools
- Advanced progress tracking
- Priority session matching
- 14-day free trial

### Conversion Triggers
- Hit daily AI limit → "Upgrade for unlimited"
- After 3 successful AI interactions → "Loving AI? Go Pro"
- Week 2 of usage → "Try Pro free for 14 days"

---

## Critical Safeguards

### 1. Crisis Detection
```javascript
const crisisKeywords = [
  'suicide', 'kill myself', 'end it all',
  'overdose', 'self-harm', 'hurt myself'
];

if (detectCrisis(userInput)) {
  return {
    type: 'crisis',
    resources: [
      '988 Suicide & Crisis Lifeline',
      'Crisis Text Line: Text HOME to 741741',
      'Emergency: 911'
    ],
    message: 'Please reach out to a professional immediately.'
  };
}
```

### 2. Medical Disclaimer
Always visible:
> "AI support is not a replacement for professional treatment. If you're in crisis, contact emergency services."

### 3. Data Privacy
- Encrypt all AI conversations
- User can delete conversation history
- No AI training on user data
- HIPAA-aware (even if not compliant yet)

### 4. Rate Limits
- Prevent API abuse
- Protect budget
- Encourage human connections

---

## Decisions Made ✅

### **UI/UX**
- ✅ **AI helper is opt-in** (like LinkedIn's AI features)
  - Users discover it naturally
  - "Try Harthio AI" prompt, not forced
  - Can dismiss and use manual creation
  
- ✅ **Manual topic creation remains primary**
  - AI is a helper, not a replacement
  - Users who prefer writing can skip AI

### **Features Priority**
- ✅ **Phase 2 Focus:** Complete Harthio AI for addiction & mental health
  - Daily check-ins
  - CBT tools
  - Recovery tracker
  - Crisis support
  
- ✅ **AI Topic Helper:** Secondary feature
  - Available in Harthio chat
  - Also as optional button on session creation
  
- ❌ **No post-session summaries** (not building this)

### **Business Model**
- ✅ **Pro Tier:** $9.99/month (subject to review)
- ❌ **No middle tier** (wait for v0.4 therapists)
- ✅ **Free Trial:** 14 days
  - 7 days too short for mental health impact
  - 14 days allows users to experience full value
  - Recovery takes time, need to show progress

### **Technical Stack**
- ✅ **DeepSeek only** (no GPT-3.5 for now)
- ✅ **API-based** (no self-hosting)
- ✅ **Hybrid chat:** Real-time prioritized, async fallback
  - Real-time for immediate responses
  - Async for complex CBT exercises
  - Queue system for high load

### **Safety & Compliance**
- ✅ **Age verification required** for addiction features
  - Collect date of birth
  - 18+ for addiction recovery tools
  - 13+ for general mental health (with parental consent)
  
- ✅ **Crisis logging** for admin review
  - Log all crisis detections
  - Admin dashboard to review
  - Future: Real-time alerts to admins

---

## Next Steps

1. **Review this document** - Add thoughts, concerns, ideas
2. **Prioritize features** - What's most valuable to users?
3. **Design UI mockups** - Visualize the experience
4. **Get user feedback** - Survey existing users about AI interest
5. **Build Phase 1 MVP** - Start with topic helper only
6. **Measure & iterate** - Let data guide next features

---

## Resources & References

- DeepSeek API: https://platform.deepseek.com/
- CBT Techniques: https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral
- Crisis Resources: https://988lifeline.org/
- HIPAA Compliance: https://www.hhs.gov/hipaa/index.html

---

**Remember:** AI is a tool to enhance human connection, not replace it. The goal is to help users find and create better peer support sessions, not to become a therapy app.
