# Tracker Reset Fix - AI Action Handler

## Issue Reported
User reported that when asking AI to reset tracker, the AI would show `TRACKER_RESET:` in the response but the tracker wouldn't actually reset. Manual reset from the menu worked fine.

## Root Cause
The AI was outputting the `TRACKER_RESET:` action command, but there was no handler in the frontend to parse and execute it (unlike `TRACKER_CREATE:` which had a handler).

## Solution Implemented

### 1. Added TRACKER_RESET Handler
**File**: `src/app/(authenticated)/harthio/page.tsx`

Added action parser before the TRACKER_CREATE handler:

```tsx
// Check if AI wants to reset a tracker
const trackerResetMatch = aiResponse.match(/TRACKER_RESET:/);
if (trackerResetMatch && user && resetTrackerId) {
  // Remove the TRACKER_RESET command from the response
  const cleanedResponse = aiResponse.replace(/TRACKER_RESET:\s*\n\n?/, '');
  
  // Reset the tracker
  const result = await sobrietyService.resetTracker(resetTrackerId, new Date());
  
  if (result.success) {
    toast({
      title: 'Counter Reset',
      description: 'Your tracker has been reset. Remember, recovery is progress, not perfection. 💪',
    });
    
    // Clear URL params and reset state
    window.history.replaceState({}, '', '/harthio');
    setResetTrackerId(null);
  } else {
    toast({
      title: 'Error',
      description: result.error || 'Failed to reset tracker.',
      variant: 'destructive',
    });
  }
  
  // Display cleaned response
  const messageBubbles = splitResponse(cleanedResponse);
  // ... add messages to chat
}
```

### 2. Improved AI Reset Prompt
**File**: `src/lib/ai-service.ts`

Added comprehensive TRACKER_RESET instructions to the system prompt:

**Key Improvements:**
- ✅ Respect user's choice (don't push for conversation if they just want to reset)
- ✅ Offer support ONCE, then respect their decision
- ✅ Clear confirmation flow before resetting
- ✅ Less pushy, more supportive

**New Flow:**
1. **Initial check-in** (brief, one question)
2. **User response**:
   - If wants to talk → provide support
   - If says "no just reset" → skip to confirmation
3. **Confirmation** (always required)
4. **Execute reset** with `TRACKER_RESET:` command
5. **Follow-up** (one open question, let user lead)

**Example (User Just Wants Reset):**
```
User: "I want to reset my tracker"
AI: "I see you want to reset your tracker. Before we do that, I want to check in with you. Relapses are part of recovery, and you're not alone. Can you tell me what happened?"

User: "no just reset"
AI: "I see you already have a tracker going, but you want to reset it. To confirm, resetting your tracker will erase your current progress. Are you sure?"

User: "yes"
AI: "TRACKER_RESET:

Your tracker has been reset. How are you feeling about starting fresh?"
```

## Testing

### Test Case 1: Quick Reset (No Conversation)
1. Go to home page
2. Click three-dot menu → "Reset Counter"
3. Redirects to `/harthio?action=reset&tracker={id}`
4. AI asks what happened
5. User says "no just reset"
6. AI confirms
7. User says "yes"
8. ✅ Tracker resets immediately
9. ✅ Toast notification appears
10. ✅ Counter shows 0 days

### Test Case 2: Reset with Support
1. Same as above
2. User explains what happened
3. AI provides support and coping strategies
4. User says "reset it"
5. ✅ Tracker resets
6. ✅ AI continues supportive conversation

### Test Case 3: Manual Reset (Existing)
1. Click three-dot menu → "Reset Counter"
2. ✅ Still works as before (AI-guided)

## Files Modified
- `src/app/(authenticated)/harthio/page.tsx` - Added TRACKER_RESET handler
- `src/lib/ai-service.ts` - Added reset instructions to system prompt

## Result
✅ AI tracker reset now works correctly
✅ Less pushy, more respectful of user's choice
✅ Clear confirmation flow prevents accidental resets
✅ Maintains supportive tone without being overbearing

## Related
- Tracker management polish (edit/delete functionality)
- AI action system (TRACKER_CREATE, TRACKER_RESET)
- Relapse support flow
