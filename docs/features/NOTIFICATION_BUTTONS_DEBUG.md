# Notification Buttons - Expected Behavior

## Progress Page Notification

**Trigger:** User views progress for 30+ seconds

**Notification Message:**
- If doing well: "I see you're checking your progress! You've come so far. Want to celebrate?"
- If struggling: "I noticed some tough days in your history. Want to talk about what helps?"

**Button:** "Yes, tell me more!" or "Yes, help me understand"

**Expected Flow:**
1. Click button
2. Redirects to `/harthio?action=progress-review`
3. Shows user message: "I'm looking at my progress"
4. AI responds: "Looking at your journey? That takes courage. What stands out to you when you see your progress?"
5. AI has full context: trackers, check-ins, sessions, moods

---

## All Notification Actions

| Page | Notification | Button | Action | User Message | AI Response |
|------|-------------|--------|--------|--------------|-------------|
| **Progress** | "You've come so far" | "Yes, tell me more!" | `progress-review` | "I'm looking at my progress" | Reviews progress with user |
| **Sessions** | "Having trouble finding session?" | "Yes, help me" | `find-session` | "I need help finding a session" | Helps find right session |
| **Home** | "How are you doing?" | "Not great" | `check-in` | "I want to check in" | Checks in on user |
| **Mood Change** | "Mood changed" | "Yes, let's talk" | `mood-support` | "I'm struggling today" | Provides emotional support |
| **Multiple Resets** | "Had some setbacks" | "Yes, I need support" | `relapse-support` | "I've been struggling with relapses" | Discusses relapse patterns |
| **No Check-ins** | "Haven't seen you" | "Struggling" | `check-in` | "I want to check in" | Checks in on user |
| **Session Ended** | "How was session?" | "Yes, let's talk" | `session-debrief` | "I just finished a session" | Debriefs session |

---

## What Could Be Wrong?

### Issue 1: Button doesn't redirect
- Check if `router.push()` is working
- Check browser console for errors

### Issue 2: Redirects but no AI response
- Check if action parameter is in URL
- Check if `initializeWelcomeMessage()` handles the action
- Check browser console for "Setting initial messages" log

### Issue 3: AI response is generic (not context-aware)
- Check if progress data is being loaded
- Check if system prompt includes progress context
- Check browser console for "Error loading progress data"

### Issue 4: User message doesn't show
- Check if `userMessage` variable is set for the action
- Check if message is added to `initialMessages` array

---

## Testing Checklist

- [ ] Progress page: "Yes, tell me more!" → Shows progress review
- [ ] Sessions page: "Yes, help me" → Shows session finding help
- [ ] Home page: "Not great" → Shows check-in support
- [ ] Mood change: "Yes, let's talk" → Shows mood support
- [ ] Multiple resets: "Yes, I need support" → Shows relapse support
- [ ] No check-ins: "Struggling" → Shows check-in support
- [ ] Session ended: "Yes, let's talk" → Shows session debrief

---

## Debug Steps

1. Open browser console
2. Click notification button
3. Check for:
   - URL changes to `/harthio?action=...`
   - Console log: "Setting initial messages"
   - User message appears in chat
   - AI response appears in chat
4. If any step fails, that's where the issue is

