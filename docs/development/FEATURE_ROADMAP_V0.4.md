# Feature Roadmap - Version 0.4

## 🎯 Planned Features for Next Version

### 1. Enhanced Tier Notifications & User Feedback
**Priority:** High
**Complexity:** Low-Medium

**Description:**
Improve user feedback when they hit tier limits or restrictions. Users should always know WHY something isn't working and HOW to fix it.

**Scenarios to Cover:**
1. AI rate limit hit (free user vs expired trial)
2. Tracker limit hit (free user vs expired trial)
3. Trial ending soon (7 days, 1 day before)
4. Trial ended (login banner)
5. Pro feature attempted (free user)
6. Trial not available (trial mode disabled)
7. Payment failed (Pro user)
8. Subscription cancelled/expired

**Technical Requirements:**
- Use existing notification system
- Add tier-specific notification templates
- Check trial status on login
- Show contextual upgrade prompts
- Track notification dismissals (don't spam)

**Reference:** See `USER_FEEDBACK_NOTIFICATIONS.md` for detailed specs

---

### 2. WhatsApp-Style Message Replies
**Priority:** High
**Complexity:** Medium

**Description:**
Allow users to reply to specific messages in the AI chat, just like WhatsApp. This helps maintain context in long conversations.

**User Story:**
- User receives 50 messages from AI
- User wants to respond to message #23 specifically
- User long-presses (mobile) or right-clicks (desktop) on message #23
- "Reply" option appears
- Quoted message shows above input bar
- User types response
- AI receives context of which message is being replied to

**Technical Requirements:**
1. **UI Components:**
   - Long-press gesture detection (mobile)
   - Right-click context menu (desktop)
   - Quoted message preview above input
   - Reply indicator on messages

2. **State Management:**
   - Track `replyingTo` message ID
   - Store quoted message content
   - Clear reply state after sending

3. **Visual Design (Apple-style):**
   - Smooth slide-in animation for quoted preview
   - Subtle border-left accent color
   - Close button to cancel reply
   - Haptic feedback on mobile

4. **Backend:**
   - Pass quoted message to AI for context
   - Store reply relationships in database (optional)

**Design Mockup:**
```
┌─────────────────────────────────┐
│ Replying to Harthio AI          │ ← Quoted preview
│ "Try breathing exercises..."    │
│ [×]                              │
├─────────────────────────────────┤
│ [Type your message...]      [→] │
└─────────────────────────────────┘
```

**Apple Design Principles:**
- Smooth animations (ease-apple-spring)
- Clear visual hierarchy
- Touch-friendly targets (44px minimum)
- Subtle shadows and depth
- Intuitive gestures

**Files to Modify:**
- `src/app/(authenticated)/harthio/page.tsx` - Add reply state and logic
- `src/components/harthio/message-reply-preview.tsx` - New component
- `src/lib/ai-service.ts` - Pass quoted context to AI

**Estimated Time:** 2-3 hours

---

## 🚀 Other Features to Consider

### 2. AI-Powered Journal System ⭐ HIGH PRIORITY
**Priority:** High
**Complexity:** High
**Therapeutic Value:** ⭐⭐⭐⭐⭐
**Target Version:** v0.4

**Description:**
Comprehensive journaling system where AI automatically summarizes conversations and tracks emotional progress. Users can also manually create journal entries. Journal entries persist even if chat history is deleted, providing a permanent record of the user's mental health journey.

**Core Features:**

**A. Automatic Chat Summaries**
- After each AI conversation ends, AI automatically generates a journal entry
- Captures: Starting mood → Ending mood → What happened that day → Key insights
- Stored permanently even if chats are deleted (journal is separate from chat history)
- Triggered when user closes chat or after 30 minutes of inactivity
- Example:
  ```
  📅 November 21, 2025 - 3:47 PM
  
  Started feeling: Anxious and overwhelmed
  Ended feeling: Calmer and more in control
  
  What happened today:
  You were struggling with work stress and feeling anxious about an upcoming presentation. We worked through breathing exercises and the 5-4-3-2-1 grounding technique. You realized that your anxiety was based on catastrophic thinking, and we reframed those thoughts together.
  
  Tools used: Breathing Exercise, Grounding Technique
  Progress: You went from 8/10 anxiety to 4/10
  ```

**Workflow:**
1. User starts AI chat
2. AI detects initial emotional state from first few messages
3. Conversation happens (tools used, topics discussed)
4. User closes chat or 30min passes
5. AI analyzes full conversation
6. AI generates summary focusing on: mood change, what happened that day, progress made
7. Journal entry saved automatically
8. User gets notification: "Journal entry created ✨"

**B. Manual Journal Entries**
- "📝 Journal" button in AI chat
- User types freely, AI helps organize thoughts
- AI asks reflective questions:
  - "How are you feeling right now?"
  - "What happened today?"
  - "What are you grateful for?"
  - "What's one thing you learned?"

**C. Mood Tracker Integration**
- Daily mood check-ins automatically added to journal
- Sobriety counter milestones logged
- Shows mood trends over time
- AI detects patterns: "I notice you've been struggling on Mondays"
- Mood data preserved even if chat history is cleared

**D. Journal Timeline View**
- Beautiful Apple-style timeline
- Filter by mood, date, or keywords
- Search through entries
- Visual mood graph

**E. Export & Download** ⭐ CRITICAL FEATURE
- Download entire journal as PDF (beautifully formatted)
- Export as text file (.txt or .md)
- Export as JSON (for data portability)
- Email to yourself
- Share with therapist (optional)
- Date range selection (last week, last month, all time)
- Privacy-first: All exports happen client-side, no server storage

**Why This Matters:**
- Users own their mental health data
- Can keep records even if they cancel subscription
- Useful for therapy sessions
- Backup in case of account issues
- Builds trust and transparency

**Export UI:**
```
┌─────────────────────────────────┐
│ 📥 Export Journal               │
├─────────────────────────────────┤
│ Date Range:                     │
│ ○ Last 7 days                   │
│ ○ Last 30 days                  │
│ ● All time                      │
│                                 │
│ Format:                         │
│ ○ PDF (recommended)             │
│ ○ Text file                     │
│ ○ JSON (data backup)            │
│                                 │
│ [Cancel]  [Download Journal]    │
└─────────────────────────────────┘
```

**Technical Architecture:**

**Database Schema:**
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  entry_type TEXT CHECK (entry_type IN ('auto_summary', 'manual', 'mood_checkin')),
  
  -- Content
  title TEXT,
  content TEXT,
  
  -- Mood tracking
  mood_start TEXT, -- anxious, stressed, depressed, etc.
  mood_end TEXT,
  mood_change_score INTEGER, -- -10 to +10
  
  -- Metadata
  tools_used TEXT[], -- ['breathing', 'grounding']
  keywords TEXT[], -- ['anxiety', 'work', 'presentation']
  chat_session_id UUID, -- Link to chat history
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  
  -- Privacy
  is_private BOOLEAN DEFAULT true
);

CREATE INDEX idx_journal_user_date ON journal_entries(user_id, date DESC);
CREATE INDEX idx_journal_mood ON journal_entries(user_id, mood_start);
```

**UI Components:**
1. `journal-entry-card.tsx` - Individual entry display
2. `journal-timeline.tsx` - Timeline view
3. `journal-editor.tsx` - Manual entry creation
4. `journal-export-dialog.tsx` - Export options
5. `mood-graph.tsx` - Visual mood trends

**AI Prompts:**

**Auto-Summary Prompt:**
```
Analyze this conversation and create a journal entry:
- Starting mood: [detected from first messages]
- Ending mood: [detected from last messages]
- What happened: [key events/topics discussed]
- Tools used: [which CBT tools were used]
- Progress: [emotional change]
- Key insights: [what user learned]

Keep it concise (100-150 words), empathetic, and focused on progress.
```

**Manual Journal Prompt:**
```
Help the user journal their thoughts. Ask reflective questions:
- How are you feeling right now?
- What happened today that's on your mind?
- What's one thing you're grateful for?
- What did you learn about yourself today?

Guide them gently, don't interrogate. Be warm and supportive.
```

**Apple Design Implementation:**

**Journal Timeline:**
```tsx
// Apple-style timeline with cards
<div className="space-y-4">
  {entries.map(entry => (
    <Card 
      interactive
      className="shadow-apple hover:shadow-apple-lg transition-all duration-apple"
    >
      <div className="flex items-start gap-4 p-4">
        <div className="text-2xl">{getMoodEmoji(entry.mood_start)}</div>
        <div className="flex-1">
          <h3 className="font-semibold">{entry.title}</h3>
          <p className="text-sm text-muted-foreground">{entry.content}</p>
          <div className="flex gap-2 mt-2">
            {entry.tools_used.map(tool => (
              <Badge variant="secondary">{tool}</Badge>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDate(entry.date)}
        </div>
      </div>
    </Card>
  ))}
</div>
```

**Navigation:**
- Add "📖 Journal" to main navigation
- Badge showing unread entries
- Quick access from AI chat

**User Benefits:**
- ✅ Track emotional progress over time
- ✅ See patterns in mood and triggers
- ✅ Keep insights even if chats deleted (journal is permanent)
- ✅ Download and own your mental health data
- ✅ Share with therapist or counselor
- ✅ Reflect on growth and recovery
- ✅ Permanent record of recovery journey
- ✅ No data loss if subscription ends
- ✅ Privacy-first: You control your data

**Monetization:**
- Free: 10 journal entries, basic export (text only)
- Pro: Unlimited entries + PDF export + mood graphs + advanced analytics

**Data Retention Policy:**
- Chat history: Can be deleted by user or auto-deleted after 90 days (configurable)
- Journal entries: NEVER auto-deleted, permanent unless user manually deletes
- Exports: Generated on-demand, not stored on server

**Estimated Development Time:** 10-14 hours

**Implementation Priority:**
1. Database schema and basic CRUD (2 hours)
2. Auto-summary generation after chat (3 hours)
3. Manual journal entry UI (2 hours)
4. Timeline view and mood graphs (3 hours)
5. Export functionality (PDF, text, JSON) (4 hours)

---

### 3. Voice Messages
**Priority:** Medium
**Description:** Record and send voice messages to AI (transcribed to text)

### 4. Message Search
**Priority:** Medium  
**Description:** Search through chat history to find specific conversations

### 5. Message Reactions
**Priority:** Low
**Description:** React to AI messages with emojis (❤️, 👍, 🙏)

### 6. AI Personality Modes
**Priority:** Low
**Description:** Switch between different AI personalities (Supportive, Motivational, Clinical)

### 7. Interactive AI Chat Components 🎯
**Priority:** High
**Complexity:** Medium
**Target Version:** v0.4

**Description:**
Enhance AI chat with interactive UI components instead of pure text - making conversations faster, easier, and more intuitive.

**Problem:**
Currently, users must type everything:
- "I want to track alcohol" (typing)
- "I started 3 days ago" (typing, date parsing issues)
- Slow, error-prone, frustrating on mobile

**Solution:**
Hybrid approach - AI conversation + smart UI components inline:

**Example Flow:**
```
AI: "What would you like to track?"

[🍺 Alcohol]  [🚬 Smoking]  [💊 Drugs]  
[🎰 Gambling]  [🎯 Other]

User clicks: [🍺 Alcohol]

AI: "When did you start your alcohol-free journey?"

[📅 Today]  [📅 Yesterday]  [📅 Pick a Date]

User clicks: [📅 Pick a Date]

[Calendar picker appears - Apple-style]

User selects: November 15, 2024

AI: "Perfect! You started 6 days ago. 
Let me create your 'Alcohol Free' tracker.

[✓ Create Tracker]  [✗ Cancel]
```

**Interactive Components:**

1. **Button Groups** (Quick Replies)
   - Tracker type selection
   - Quick date options (Today, Yesterday, Last Week)
   - Yes/No confirmations
   - Multiple choice questions

2. **Calendar Picker**
   - Full-screen on mobile (like schedule session)
   - Centered modal on desktop
   - Date range limits (can't be future)
   - Apple-style design

3. **Time Picker** (Future)
   - For precise start times
   - Scrollable columns (Hour, Minute, AM/PM)

4. **Confirmation Buttons**
   - Before creating tracker
   - Before resetting tracker
   - Before deleting tracker

**Technical Implementation:**

**Message Types:**
```typescript
type AIMessage = {
  role: 'assistant';
  content: string;
  components?: {
    type: 'buttons' | 'calendar' | 'time-picker' | 'confirmation';
    data: any;
    onSelect: (value: any) => void;
  }[];
};
```

**Component Examples:**
```tsx
// Button Group
<div className="flex flex-wrap gap-2 mt-3">
  <Button onClick={() => handleSelect('alcohol')}>
    🍺 Alcohol
  </Button>
  <Button onClick={() => handleSelect('smoking')}>
    🚬 Smoking
  </Button>
  // ...
</div>

// Calendar Picker
<CalendarPicker
  onSelect={(date) => handleDateSelect(date)}
  maxDate={new Date()}
  minDate={new Date('2020-01-01')}
/>

// Confirmation
<div className="flex gap-3 mt-3">
  <Button variant="outline" onClick={handleCancel}>
    ✗ Cancel
  </Button>
  <Button onClick={handleConfirm}>
    ✓ Create Tracker
  </Button>
</div>
```

**User Benefits:**
- ✅ **10x faster** - Click instead of type
- ✅ **Zero errors** - No date parsing issues
- ✅ **Mobile-friendly** - Big touch targets
- ✅ **Still conversational** - AI guides the flow
- ✅ **Accessible** - Works for everyone
- ✅ **Professional** - Like modern chatbots (Intercom, WhatsApp Business)

**Use Cases:**
1. **Tracker Creation** - Type selection, date picker, confirmation
2. **Tracker Reset** - Confirmation, reason selection
3. **Tracker Delete** - Confirmation, reason selection (NEW)
4. **CBT Tool Selection** - Tool picker buttons
5. **Session Suggestions** - Browse sessions inline
6. **Crisis Resources** - Quick action buttons

**Design Principles:**
- Components appear inline with AI messages
- Apple-style design (shadows, rounded corners, animations)
- Smooth transitions (slide-in, fade-in)
- Clear visual hierarchy
- Touch-friendly (44px minimum)

**Files to Create:**
- `src/components/harthio/ai-button-group.tsx`
- `src/components/harthio/ai-calendar-picker.tsx`
- `src/components/harthio/ai-confirmation.tsx`
- `src/lib/ai-message-types.ts` (TypeScript types)

**Files to Modify:**
- `src/app/(authenticated)/harthio/page.tsx` - Render components
- `src/lib/ai-service.ts` - Support component messages

**Estimated Time:** 6-8 hours

**Implementation Priority:**
1. Button groups (2h)
2. Calendar picker integration (2h)
3. Confirmation buttons (1h)
4. Tracker creation flow (2h)
5. Testing & polish (1h)

---

### 8. 24-Hour Tracker Check-In System 🔔
**Priority:** High
**Complexity:** Medium
**Target Version:** v0.4

**Description:**
Proactive AI check-ins for active trackers. Every 24 hours, AI slides down a notification asking users about their progress, documenting responses, and offering support when needed.

**User Story:**
- User has "Smoking Free" tracker running
- 24 hours pass since last check-in
- Notification slides down: "Did you smoke within the last 24 hours?"
- User clicks: [Yes] or [No]
- **If No:** AI celebrates, tracker continues
- **If Yes:** AI documents it, tracker resets, AI offers support and asks relevant questions

**Flow Example (User Relapsed):**
```
🔔 Notification slides down:
"Did you smoke within the last 24 hours?"

[Yes] [No]

User clicks: [Yes]

AI: "Thank you for being honest. That takes courage. 
Your tracker will reset, but this is part of the journey.

Let's talk about what happened. What triggered you to smoke?"

[Work stress] [Social situation] [Boredom] [Other]

User selects: [Work stress]

AI: "Work stress is a common trigger. Let's work through this together.

What specifically at work was stressful?"

User types: "Big presentation tomorrow, feeling overwhelmed"

AI: "I understand. Let's use some tools to help you cope better next time:

Would you like to try:
- Breathing exercises
- Grounding technique
- Talk about stress management strategies

This time, let's stay committed. What's one thing you can do differently when work stress hits?"

[Documented in journal: Relapse on Day 5, trigger: work stress/presentation]
```

**Technical Implementation:**

**Database Schema:**
```sql
CREATE TABLE tracker_checkins (
  id UUID PRIMARY KEY,
  tracker_id UUID REFERENCES sobriety_trackers(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Check-in data
  checkin_time TIMESTAMPTZ DEFAULT NOW(),
  did_relapse BOOLEAN,
  trigger TEXT, -- what caused relapse
  notes TEXT, -- user's explanation
  
  -- AI response
  ai_support_offered TEXT[], -- tools suggested
  ai_conversation_id UUID, -- link to chat
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkins_tracker ON tracker_checkins(tracker_id, checkin_time DESC);
CREATE INDEX idx_checkins_user ON tracker_checkins(user_id, checkin_time DESC);
```

**Notification System:**
1. Background job checks all active trackers
2. If 24 hours since last check-in → trigger notification
3. Notification slides down from top (like iOS)
4. User responds Yes/No
5. If Yes → Redirect to AI chat with context
6. AI conversation flow with support
7. Document in database and journal

**UI Components:**
```tsx
// Slide-down notification
<div className="fixed top-16 left-0 right-0 z-50 animate-slide-down">
  <Card className="mx-4 shadow-apple-lg">
    <div className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🚬</span>
        <div className="flex-1">
          <h3 className="font-semibold">Smoking Free Check-In</h3>
          <p className="text-sm text-muted-foreground">
            Did you smoke within the last 24 hours?
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleNo}>
          No, Still Going! 💪
        </Button>
        <Button variant="destructive" onClick={handleYes}>
          Yes, I Did
        </Button>
      </div>
    </div>
  </Card>
</div>
```

**AI Conversation Flow:**

**If User Says "Yes" (Relapsed):**
1. Acknowledge with compassion
2. Ask about trigger (buttons: Work, Social, Boredom, Emotional, Other)
3. Ask for details (open text)
4. Offer relevant CBT tools
5. Ask commitment question: "What will you do differently?"
6. Document everything in journal
7. Reset tracker with note

**If User Says "No" (Still Clean):**
1. Celebrate milestone
2. Quick encouragement
3. Ask how they're feeling (optional)
4. Continue tracker

**Notification Timing:**
- First check-in: 24 hours after tracker creation
- Subsequent: Every 24 hours from last check-in
- Time: User's most active time (detected from usage patterns)
- Fallback: 9 AM local time

**User Benefits:**
- ✅ Accountability without judgment
- ✅ Early intervention when struggling
- ✅ Pattern recognition (triggers, timing)
- ✅ Continuous support
- ✅ Honest tracking with AI help
- ✅ Journal documentation of journey

**Privacy & Settings:**
- User can disable check-ins per tracker
- User can set preferred check-in time
- User can snooze for 4 hours
- All data private and encrypted

**Files to Create:**
- `src/lib/tracker-checkin-service.ts` - Check-in logic
- `src/components/harthio/tracker-checkin-notification.tsx` - UI
- `src/hooks/use-tracker-checkins.ts` - React hook
- `database/migrations/add-tracker-checkins.sql` - Schema

**Files to Modify:**
- `src/lib/sobriety-service.ts` - Add check-in tracking
- `src/app/(authenticated)/harthio/page.tsx` - Handle check-in flow
- `src/lib/ai-service.ts` - Add relapse support prompts

**Estimated Time:** 6-8 hours

**Implementation Priority:**
1. Database schema (1h)
2. Background check-in detection (2h)
3. Notification UI component (2h)
4. AI conversation flow (2h)
5. Journal integration (1h)

---

### 9. Tracker Delete Functionality 🗑️
**Priority:** High
**Complexity:** Low
**Target Version:** v0.4

**Description:**
Allow users to delete trackers they no longer need.

**Current Flaw:**
- ✅ Can add tracker
- ✅ Can reset tracker
- ❌ **Cannot delete tracker** - Missing!

**Why Users Need This:**
- Created wrong tracker type by mistake
- No longer tracking that addiction
- Want to clean up old trackers
- Privacy reasons

**Implementation: AI-Guarded Delete (Recommended)**

**Flow:**
```
User: Long-press tracker card → "Delete Tracker" option

Redirect to Harthio AI:

AI: "I see you want to delete your 'Alcohol Free' tracker. 
You've been tracking for 45 days - that's amazing progress!

Before we delete it, can you tell me why?

[🎯 Achieved my goal]
[🔄 Want to start fresh]
[❌ Created by mistake]
[💭 Other reason]

Or type your reason..."

User selects or types reason

AI: "I understand. Just to confirm:

Deleting will permanently remove:
- Your 45-day progress
- Visual journey pieces
- All history

Are you sure you want to delete?

[✓ Yes, Delete]  [✗ Keep It]
```

**Why AI-Guarded:**
- ✅ Prevents accidental deletions
- ✅ Collects valuable data (why users stop tracking)
- ✅ Offers alternatives (pause, archive - future)
- ✅ Consistent with compassionate approach
- ✅ Ensures intentional decision

**Technical Implementation:**
- Add delete action to tracker card (long-press menu)
- Redirect to AI with `action=delete-tracker&tracker={id}`
- AI conversation flow
- Confirmation with interactive buttons
- Delete via `sobrietyService.deleteTracker(id)`

**Database:**
- Soft delete (mark as deleted, keep data)
- Or hard delete (permanent removal)
- User choice in settings

**Estimated Time:** 2-3 hours

---

### 9. Professional Therapy Integration 🔮
**Priority:** High (Post-Launch)
**Complexity:** Very High
**Target Version:** v0.5+

**Description:**
Third tier of Harthio's growth model - connecting users with licensed therapists.

**Core Features:**
- **Therapist Directory**
  - Licensed professionals (LCSW, LMFT, PhD, PsyD)
  - Specializations (addiction, trauma, anxiety, depression)
  - Insurance acceptance
  - Availability calendar
  - Video/in-person options

- **Booking System**
  - Schedule therapy sessions
  - Insurance verification
  - Payment processing
  - Session reminders

- **Integration with AI**
  - AI can suggest therapy when appropriate
  - Share relevant journal entries with therapist (with permission)
  - Continuity of care between AI support and therapy

- **Revenue Model**
  - Commission on therapy bookings
  - Insurance integration fees
  - Referral partnerships

**Why This Matters:**
- Completes the care continuum: AI → Peers → Professionals
- Addresses serious mental health needs
- Creates sustainable revenue stream
- Differentiates from competitors

**Technical Requirements:**
- HIPAA compliance
- Secure video platform
- Insurance API integration
- Therapist verification system
- Scheduling infrastructure

**Estimated Timeline:** Q4 2025

---

## 📊 Version Comparison

**v0.3 (Current):**
- Apple-inspired design
- AI chat with persistence
- 10 quick action buttons
- Keyword detection
- Context-aware responses
- Peer video sessions (live)

**v0.4 (Next):**
- 🎯 Interactive AI Chat Components ⭐ (buttons, calendar, pickers)
- 🎯 Tracker Delete Functionality (AI-guarded)
- 🎯 AI-Powered Journal System (auto-summaries, manual entries, mood integration)
- 🎯 Journal Export & Download (PDF, text, JSON)
- 🎯 WhatsApp-style message replies
- 🎯 Enhanced mood tracking with journal integration
- 🎯 Data ownership and privacy features

**v0.5 (Future):**
- Voice messages
- Message search
- Advanced analytics
- Professional therapy integration
- Insurance partnerships


---

## 📋 Implementation Notes

**For Message Replies:**
- Start with desktop (easier to test)
- Add mobile gestures after desktop works
- Test with long conversations (100+ messages)
- Ensure performance doesn't degrade
- Add keyboard shortcuts (R to reply)

**Testing Checklist:**
- [ ] Long-press works on mobile
- [ ] Right-click works on desktop
- [ ] Quoted message displays correctly
- [ ] AI understands context
- [ ] Cancel reply works
- [ ] Animations are smooth
- [ ] Works with message grouping
- [ ] Accessible (keyboard navigation)

---

## 🎨 Design System Integration

All new features should follow the Apple Design System:
- See: `APPLE_DESIGN_SYSTEM.md`
- Use: Apple shadows, easing curves, transitions
- Follow: Touch feedback patterns
- Maintain: Consistent spacing and typography

---

## 📊 Success Metrics

**Message Replies:**
- % of users who use reply feature
- Average replies per conversation
- User satisfaction with context handling
- Reduction in "what I meant was..." messages

---

## 🔄 Version History

**v0.3 (Current):**
- ✅ Apple-inspired design system
- ✅ AI chat persistence
- ✅ 10 quick action buttons
- ✅ Intelligent keyword detection
- ✅ Context-aware AI responses

**v0.4 (Next):**
- 🎯 WhatsApp-style message replies
- 🎯 Additional features TBD

**v0.5 (Future):**
- Voice messages
- Message search
- Export functionality
