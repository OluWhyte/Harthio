# Proactive AI Monitoring System

**Status:** 📋 Ready for Implementation  
**Priority:** High (Premium Feature)  
**Estimated Time:** 2-3 days

---

## 🎯 Overview

The Proactive AI Monitoring System makes Harthio feel alive and caring by detecting user behavior patterns and proactively offering support at the right moments. This creates a sense of being noticed and cared for, which is crucial for mental health support.

**Key Principle:** AI reaches out to users, not just responds when asked.

---

## 🎨 User Experience

### Visual Design
- **Slide-down from top** (matches existing contextual check-in)
- **Glass morphism card** (consistent with app design)
- **Appears on all pages EXCEPT /harthio** (AI page has full features)
- **Auto-dismisses or user can close**
- **Respects cooldowns** (doesn't spam)

### Example Flow
```
User browses sessions for 30+ seconds
↓
AI slides down from top:
"💙 I noticed you're looking for a session. 
Having trouble finding the right one?"
[Yes, help me] [No, just browsing]
↓
User clicks "Yes, help me"
↓
Redirects to /harthio with context
↓
AI: "I'd love to help you find the perfect session!
Based on your recent check-ins..."
```

---

## 🔍 Detection Triggers

### 1. Session Browsing (30+ seconds)
**When:** User on /sessions page for 30+ seconds without joining

**Free User Prompt:**
```
💙 I noticed you're looking for a session. 
Having trouble finding the right one?

[Yes, help me] [No, just browsing]
```

**Free User AI Response (on /harthio):**
```
"I'd love to help you find the perfect session! 

Unfortunately, personalized session matching is a Pro feature.

With Pro, I can:
✅ Suggest sessions based on your mood
✅ Match you with compatible topics
✅ Remind you of upcoming sessions
✅ Help you create better topics

[Start 14-Day Free Trial]

For now, try:
🔍 Use the search bar
📅 Check 'Upcoming Sessions'
💬 Create your own session"
```

**Pro User AI Response:**
```
"I'd love to help you find the perfect session!

Based on your recent check-ins, you might like:

🎯 "Staying Strong on Tough Days" - Starting in 15 min
🎯 "Evening Sobriety Support" - Starting at 8 PM
🎯 "Anxiety Management Techniques" - Tomorrow 2 PM

[View Session] [Find More] [Create My Own]

Or tell me what you're looking for?"
```

---

### 2. Mood Change (Good → Struggling)
**When:** User changes mood from good/great to struggling/okay

**Prompt:**
```
💙 I noticed your mood changed. 
Want to talk about what's going on?

[Yes, let's talk] [No, I'm okay]
```

**Free User AI Response:**
```
"I'm here for you. 💙

I really want to help, but unlimited AI support 
is a Pro feature.

With your free account, you have 3 messages today.
Want to use one now?

[Yes, let's talk] (1 of 3 messages)
[Save for later]
[Upgrade to Pro for unlimited support]

Always available (free):
📞 Crisis Hotline: 988
💬 Find a peer session
🌊 Quick breathing exercise"
```

**Pro User AI Response:**
```
"I'm here for you. Let's work through this together. 💙

What would help most right now?

[🗣️ Talk it out]
[🧠 Challenge negative thoughts]
[🌊 Breathing exercise]
[🎯 Grounding technique]
[📅 Find support session]
[📞 Crisis resources]

Or just tell me what's on your mind..."
```

---

### 3. Idle on Home Page (2+ minutes)
**When:** User on /home page for 2+ minutes without interaction

**Prompt:**
```
💙 Hey there! How are you doing today?

[I'm doing okay] [Not great] [Just looking]
```

---

### 4. Multiple Tracker Resets (2+ in 7 days)
**When:** User resets tracker 2+ times in a week

**Prompt:**
```
💙 I noticed you've had some setbacks. 
Recovery isn't linear. Want to talk?

[Yes, I need support] [No, I'm okay]
```

**Pro User AI Response:**
```
"Recovery isn't linear, and setbacks are part of the journey. 💙

I've noticed a pattern - you tend to reset on weekends.
Want to explore what's happening?

[🗣️ Talk about triggers]
[📊 See my patterns]
[📅 Schedule weekend support session]
[💪 Build coping plan]

You're not alone in this."
```

---

### 5. No Check-ins (3+ days)
**When:** User hasn't checked in for 3+ days

**Prompt:**
```
💙 Haven't seen you in a few days. 
Just checking in - how are you?

[I'm okay] [Struggling] [Been busy]
```

---

### 6. Session Ended
**When:** User's session just ended (redirect to /harthio)

**Prompt:**
```
💙 How was your session? 
Want to process what came up?

[Yes, let's talk] [No, I'm good]
```

---

## 🚦 Rate Limits & Cooldowns

### Proactive Prompt Limits

| Metric | Free | Pro | Why |
|--------|------|-----|-----|
| **Max Prompts/Day** | 3 | 10 | Prevent annoyance |
| **Prompt Cooldown** | 2 hours | 30 min | Don't spam user |
| **Same Trigger Cooldown** | 24 hours | 6 hours | Don't repeat same message |

### AI Response Limits (After Clicking Prompt)

| Feature | Free | Pro |
|---------|------|-----|
| **AI Messages** | 3/day | 200/day |
| **Topic Helper** | 1/day | 5/day |
| **CBT Tools** | 0 | 100/day |

---

## 🏢 Company Information (AI Knowledge Base)

When users ask about Harthio, founders, vision, etc., the AI should respond with:

### About Harthio
```
"Harthio is a platform for meaningful conversations and recovery support.

Our Vision:
'To create a safe space for meaningful conversations where 
people can find others who truly get it.'

Our Mission:
'Provide accessible, compassionate mental health and recovery 
support through AI-powered matching, peer connections, and 
professional therapy - all in one platform.'

What Makes Us Different:
✅ Three-tier support: AI when you need it, peers when you 
   want it, professionals when you're ready
✅ Recovery-focused with sobriety tracking & visual journey
✅ AI-powered matching (not random connections)
✅ Evidence-based CBT tools
✅ Crisis detection & intervention

We believe recovery and mental health support should be:
- Accessible (affordable, 24/7)
- Compassionate (no judgment)
- Effective (evidence-based)
- Connected (peer + AI + professional)

Want to know more about any specific feature?"
```

### Founders
```
"Harthio was founded by [Founder Name] and [Co-Founder Name].

[Brief founder story - to be filled in]

We built Harthio because we believe everyone deserves 
access to compassionate mental health support, not just 
those who can afford expensive therapy.

Have questions about our approach or features?"
```

### Contact
```
"You can reach us at:
📧 Email: support@harthio.com
🌐 Website: harthio.com
💬 Social: @harthio

For urgent support:
📞 Crisis Hotline: 988 (24/7)
💬 Crisis Text Line: Text HOME to 741741

How else can I help you?"
```

---

## 💻 Implementation

### 1. Add to Root Layout

File: `src/app/layout.tsx`

```typescript
import { ProactiveAIMonitor } from '@/components/harthio/proactive-ai-monitor';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* Global proactive AI monitor */}
        <ProactiveAIMonitor />
        
        {children}
      </body>
    </html>
  );
}
```

### 2. Add Hooks to Pages

#### Sessions Page
File: `src/app/(authenticated)/sessions/page.tsx`

```typescript
import { useSessionBrowsingDetection } from '@/hooks/useProactiveAI';

export default function SessionsPage() {
  // Detect if user browses for 30+ seconds
  useSessionBrowsingDetection();
  
  return (
    // ... existing code
  );
}
```

#### Home Page
File: `src/app/(authenticated)/home/page.tsx`

```typescript
import { useIdleDetection } from '@/hooks/useProactiveAI';

export default function HomePage() {
  // Detect if user is idle for 2+ minutes
  useIdleDetection();
  
  return (
    // ... existing code
  );
}
```

#### App-wide Hooks
File: `src/app/(authenticated)/layout.tsx`

```typescript
import { 
  usePageTracking, 
  useNoCheckinsDetection 
} from '@/hooks/useProactiveAI';

export default function AuthenticatedLayout({ children }) {
  // Track page views
  usePageTracking();
  
  // Check for no check-ins (once on load)
  useNoCheckinsDetection();
  
  return (
    // ... existing code
  );
}
```

### 3. Trigger on Events

#### Mood Change
File: `src/components/harthio/mood-selector.tsx` (or wherever mood is saved)

```typescript
import { useTriggerMoodChange } from '@/hooks/useProactiveAI';

export function MoodSelector() {
  const triggerMoodChange = useTriggerMoodChange();
  const [previousMood, setPreviousMood] = useState<string | null>(null);
  
  const handleMoodSelect = async (newMood: string) => {
    // Save mood
    await saveMood(newMood);
    
    // Trigger proactive AI if mood changed negatively
    if (previousMood) {
      await triggerMoodChange(previousMood, newMood);
    }
    
    setPreviousMood(newMood);
  };
  
  return (
    // ... existing code
  );
}
```

#### Tracker Reset
File: `src/components/harthio/sobriety-counter.tsx` (or tracker reset handler)

```typescript
import { useTriggerResetDetection } from '@/hooks/useProactiveAI';

export function SobrietyCounter() {
  const triggerResetDetection = useTriggerResetDetection();
  
  const handleReset = async () => {
    // Reset tracker
    await resetTracker();
    
    // Check for multiple resets pattern
    await triggerResetDetection();
  };
  
  return (
    // ... existing code
  );
}
```

#### Session Ended
File: `src/app/(authenticated)/session/[id]/page.tsx` (or session end handler)

```typescript
import { useTriggerSessionEnded } from '@/hooks/useProactiveAI';

export function SessionPage() {
  const triggerSessionEnded = useTriggerSessionEnded();
  
  const handleSessionEnd = async (sessionId: string) => {
    // End session
    await endSession(sessionId);
    
    // Trigger proactive AI
    await triggerSessionEnded(sessionId);
    
    // Redirect to /harthio
    router.push('/harthio');
  };
  
  return (
    // ... existing code
  );
}
```

---

## 🗄️ Database Schema (Optional - for analytics)

```sql
-- Track proactive AI events for analytics
CREATE TABLE IF NOT EXISTS public.proactive_ai_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'session_browsing', 'mood_change', etc.
    prompt_shown BOOLEAN DEFAULT false,
    user_clicked BOOLEAN DEFAULT false,
    action_taken TEXT, -- 'open_chat', 'dismiss', etc.
    user_tier TEXT NOT NULL, -- 'free' or 'pro'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proactive_ai_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY "Users can view own events" ON public.proactive_ai_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own events" ON public.proactive_ai_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_proactive_events_user 
ON public.proactive_ai_events(user_id);

CREATE INDEX IF NOT EXISTS idx_proactive_events_type 
ON public.proactive_ai_events(event_type);
```

---

## 🧪 Testing Checklist

### Free User Tests
- [ ] Browse sessions for 30+ seconds → See prompt
- [ ] Click "Yes, help me" → Redirects to /harthio → Shows upgrade message
- [ ] Change mood good → struggling → See prompt
- [ ] Click "Yes, let's talk" → Uses 1 of 3 messages
- [ ] Idle on home for 2+ minutes → See prompt
- [ ] Reset tracker 2+ times in week → See prompt
- [ ] Don't check in for 3+ days → See prompt on next visit
- [ ] Prompts respect 2-hour cooldown
- [ ] Max 3 prompts per day

### Pro User Tests
- [ ] Browse sessions → See prompt → Get personalized suggestions
- [ ] Change mood → See prompt → Get full CBT tools
- [ ] Multiple resets → See pattern analysis
- [ ] All prompts work with 30-min cooldown
- [ ] Max 10 prompts per day

### General Tests
- [ ] Prompts never show on /harthio page
- [ ] Prompts slide down smoothly
- [ ] Can dismiss prompts
- [ ] Prompts match glass morphism design
- [ ] Mobile responsive
- [ ] Same trigger doesn't repeat within cooldown

---

## 📈 Success Metrics

1. **Engagement**
   - % of users who see proactive prompts
   - % who click vs dismiss
   - Most effective trigger types

2. **Conversion**
   - Free users who see upgrade prompts
   - Free users who click "Start Trial"
   - Conversion rate by trigger type

3. **Retention**
   - Users who engage with proactive AI return more
   - Reduced churn for users who use feature

4. **User Satisfaction**
   - Feedback on "AI feels alive"
   - Complaints about spam/annoyance
   - Adjust cooldowns based on feedback

---

## 🚀 Deployment Steps

1. **Create Components**
   - ✅ ProactiveAIMonitor component
   - ✅ Proactive AI service
   - ✅ Custom hooks

2. **Add to Layout**
   - Add ProactiveAIMonitor to root layout
   - Add hooks to authenticated layout

3. **Integrate Triggers**
   - Sessions page (browsing detection)
   - Home page (idle detection)
   - Mood selector (mood change)
   - Tracker reset (multiple resets)
   - Session end (post-session)

4. **Update AI System Prompt**
   - Add company information
   - Add tier-specific responses
   - Add context handling

5. **Test Thoroughly**
   - Test all triggers
   - Test cooldowns
   - Test tier differences
   - Test mobile

6. **Deploy & Monitor**
   - Deploy to production
   - Monitor engagement
   - Adjust cooldowns if needed
   - Collect user feedback

---

## 💡 Future Enhancements

1. **Smart Timing** (v0.4)
   - Learn when user is most receptive
   - Avoid prompts during busy times
   - Personalized cooldowns

2. **More Triggers** (v0.4)
   - Streak milestones
   - Before difficult times (based on patterns)
   - After positive events (celebrate)

3. **A/B Testing** (v0.5)
   - Test different messages
   - Test different timings
   - Optimize conversion

4. **Voice Prompts** (v0.6)
   - Optional voice notifications
   - "Hey, I noticed..."

---

**Ready to make Harthio feel alive!** 💙
