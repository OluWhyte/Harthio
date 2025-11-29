# Session Lifecycle & Button States Documentation

## Overview
This document explains how sessions flow through different states and how the UI responds to each state. This is critical for understanding user experience and system behavior.

---

## Session States

### 1. **Pending** 🟡
- **When**: Session created but NO participants approved yet
- **Timeline**: Visible to ALL users
- **Archive**: If start time passes with 0 participants → auto-archived with reason `'no_participants'`

### 2. **Upcoming** 🔵
- **When**: Session has approved participants, waiting for start time
- **Timeline**: Only visible to author and approved participants
- **Archive**: Will not be archived (has participants)

### 3. **Active** 🟢
- **When**: Current time is between start_time and end_time
- **Timeline**: Only visible to author and approved participants
- **Archive**: Will not be archived until 1 hour after end_time

### 4. **Completed** ⚫
- **When**: Session ended normally (1+ hour after end_time)
- **Timeline**: Not visible (archived)
- **Archive**: Moved to `topics_archive` with reason `'expired'`

### 5. **No Show** 🔴
- **When**: Session marked as `no_show = true`
- **Timeline**: Not visible
- **Archive**: In archive with no_show flag

### 6. **No Participants** 🟠
- **When**: Session reached start time with 0 approved participants
- **Timeline**: Not visible (auto-archived)
- **Archive**: In `topics_archive` with reason `'no_participants'`, requests cleared

---

## Timeline Visibility Rules

### Public Timeline (Available Sessions)
- Shows sessions with **0 participants** (Pending state)
- Shows sessions that **haven't started yet**
- Hides sessions once someone is approved
- Hides sessions that started without participants

### My Sessions (Author/Participant View)
- Shows **Upcoming** sessions (before start time)
- Shows **Active** sessions (during session time)
- Hides **Completed** sessions (moved to history)

### History Tab
- Shows all past sessions from both `topics` and `topics_archive`
- Filterable by: All, Completed, No Show, No Participants, Ended Early
- Combines active and archived data seamlessly

---

## Button States by User Role

### For SESSION HOST (Author)

#### Before Start Time (Upcoming)
```
Button: "Upcoming Session"
Style: Outline, Gray, Disabled
Purpose: Status indicator - session is confirmed
Action: None (disabled)
```

#### During Session Time (Active)
```
Button: "Session Active"
Style: Solid, Green, Disabled
Purpose: Status indicator - session is live
Action: None (actual join button is in header)
```

#### After End Time
```
Button: None shown
Purpose: Session is over
```

---

### For APPROVED PARTICIPANT

#### Before Start Time (Upcoming)
```
Button: "Upcoming Session"
Style: Outline, Gray, Disabled
Purpose: Confirms you're approved and session is coming
Action: None (disabled)
```

#### During Session Time (Active)
```
Button: "Session Active"
Style: Solid, Green, Disabled
Purpose: Confirms session is live and you can join
Action: None (actual join button is in header)
```

#### After End Time
```
Button: None shown
Purpose: Session is over
```

---

### For NON-PARTICIPANT (Public User)

#### Before Start Time - No Participants Yet (Pending)
```
Button: "Request to Join"
Style: Solid, Blue, Clickable
Purpose: Send join request to host
Action: Opens request dialog
```

#### Before Start Time - Has Participants (Upcoming)
```
Button: Not visible
Purpose: Session is private now
Note: Entire session card is hidden from public timeline
```

#### During Session Time (Active)
```
Button: "Session Active"
Style: Solid, Green, Disabled
Purpose: Shows session is happening (but you're not in it)
Action: None (too late to join)
```

#### After End Time
```
Button: "Session Ended"
Style: Outline, Gray, Disabled
Purpose: Shows session is over
Action: None
```

---

## Key Design Principles

### 1. **Disabled Buttons = Status Indicators**
- Not meant to be clicked
- Show current state of the session
- Provide visual feedback to users

### 2. **Actual Join Button is Separate**
- Located in header/navigation when session is active
- Only visible to author and approved participants
- Clickable and functional

### 3. **Privacy by Participant Count**
- 0 participants = Public (anyone can see and request)
- 1+ participants = Private (only author and participants see it)
- This prevents session sniping and maintains intimacy

### 4. **Automatic Cleanup**
- Sessions without participants are auto-archived at start time
- Sessions with participants are archived 1 hour after end time
- Keeps timeline fast and relevant

---

## Archive System Integration

### Auto-Archive Triggers (Every 5 minutes via pg_cron)

1. **Expired Sessions**
   - Condition: `end_time < NOW() - INTERVAL '1 hour'`
   - Reason: `'expired'`
   - Keeps: All data including participants and requests

2. **No Participant Sessions**
   - Condition: `start_time <= NOW() AND participants.length = 0`
   - Reason: `'no_participants'`
   - Clears: Requests (prevents approving past sessions)
   - Keeps: Session data for history

### Why Clear Requests?
- Prevents hosts from approving join requests for sessions that already started
- Session is already over, no point in approving
- Keeps archive clean and prevents confusion
- Users can still see the session in their history

---

## User Experience Flow Examples

### Example 1: Successful Session
1. Host creates "Talk about recovery" for 3pm
2. User A requests to join at 2pm
3. Host approves User A at 2:15pm
4. Session disappears from public timeline
5. At 3pm, both see "Session Active" button
6. They join via header button and have conversation
7. At 4pm session ends
8. At 5pm (1 hour later) session auto-archives with reason "expired"
9. Both can see it in their history tab

### Example 2: No Participants
1. Host creates "Talk about anxiety" for 2pm
2. No one requests to join
3. At 2pm, session reaches start time with 0 participants
4. Auto-archive runs (within 5 minutes)
5. Session moves to archive with reason "no_participants"
6. Requests are cleared
7. Session disappears from timeline
8. Host can see it in history tab as "No Participants"

### Example 3: Public Session Discovery
1. User browses timeline at 1pm
2. Sees "Talk about depression" scheduled for 3pm
3. Clicks "Request to Join"
4. Sends request with message
5. Host approves at 1:30pm
6. Session disappears from User's timeline
7. Session appears in User's "My Sessions" as "Upcoming"
8. At 3pm, User sees "Session Active" and joins

---

## Technical Implementation

### Timeline Query (`getAllTopics`)
```typescript
// Filters out sessions that started without participants
if (startTime <= now && !hasParticipants) {
  return false; // Hide from timeline
}
```

### Visibility Check (`shouldShowSession`)
```typescript
if (!hasParticipants) return true; // Open to all
if (hasParticipants && (upcoming || active)) {
  return isAuthor || isParticipant; // Private
}
```

### History Query (`getUserSessionHistory`)
```typescript
// Combines both tables
const [activeTopics, archivedTopics] = await Promise.all([
  supabase.from('topics').select(...),
  supabase.from('topics_archive').select(...)
]);
```

---

## Related Documentation
- `ARCHIVE_SYSTEM_DOCUMENTATION.md` - Archive system details
- `database/migrations/add-session-archive-system.sql` - Database schema
- `src/lib/supabase-services.ts` - Service layer implementation
- `src/components/harthio/topic-card.tsx` - UI implementation

---

**Last Updated**: 2025-11-24
**Maintained By**: Development Team
**Status**: Production-Ready ✅
