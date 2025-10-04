cc# Design Document

## Overview

This design document outlines the complete revamp of the topic creation to session joining flow. The system will provide a clear, secure, and intuitive experience from topic discovery through request management to active session participation.

## Architecture

### High-Level Flow
```
Topic Creation → Request Submission → Request Management → Session Participation
     ↓                ↓                    ↓                    ↓
  Dashboard        Request Dialog      Requests Page        Session Page
```

### State Transitions
```
Topic States:
- Created (1 participant - author only) → "Waiting for participants"
- Requested (1 participant + pending requests) → "Waiting for participants"  
- Ready (2 participants, before start time) → "Upcoming Session"
- Active (2 participants, within time window) → "Join Session"
- Ended (after end time) → Cleanup/Archive

Request States:
- Pending → Visible to author, cancellable by requester
- Approved → User becomes participant, all other requests rejected
- Rejected → Request removed, user can request again
```

## Components and Interfaces

### 1. Topic Card Component
**Purpose:** Display topic information with appropriate action buttons

**States:**
- **For Authors:** Show hosting status and pending request count
- **For Non-participants:** Show "Request to Join" or "Request Sent"
- **For Participants:** Show "You are confirmed" and session buttons

**Key Logic:**
```typescript
const isUserHost = topic.author.userId === user?.uid;
const isUserParticipant = topic.participants?.includes(user?.uid);
const hasRequested = topic.requests?.some(req => req.requesterId === user?.uid);
const totalParticipants = topic.participants?.length || 0; // Author is already included in participants
const hasEnoughParticipants = totalParticipants >= 2;
```

### 2. Request to Join Dialog
**Purpose:** Allow users to send join requests with optional messages

**Features:**
- Optional message field (max 200 characters)
- Validation to prevent self-requests
- Real-time feedback on submission
- Automatic dialog closure on success

### 3. Requests Management Page
**Purpose:** Centralized request management for authors and tracking for users

**Tabs:**
- **Received Requests:** For topic authors only, shows requests for their topics
- **Sent Requests:** For all users, shows their own sent requests

**Actions:**
- **Approve:** Add user to participants, clear all other requests, send notifications
- **Cancel:** Remove user's own request

### 4. Session State Indicator
**Purpose:** Show current session status in navigation

**States:**
- **No Indicator:** User has no active/upcoming sessions
- **"Upcoming Session":** User has confirmed session that hasn't started
- **"Join Session":** User has active session they can join now

## Data Models

### Topic Model (Enhanced)
```typescript
interface Topic {
  id: string;
  title: string;
  description: string;
  author_id: string;
  start_time: string;
  end_time: string;
  participants: string[]; // UUIDs of approved participants
  requests: JoinRequest[]; // JSONB array of pending requests
  created_at: string;
}
```

### Join Request Model
```typescript
interface JoinRequest {
  requesterId: string;
  requesterName: string;
  message: string;
  timestamp: string;
}
```

### Extended Types for UI
```typescript
interface TopicWithAuthor extends Topic {
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface RequestWithTopic {
  id: string; // Composite: `${topic_id}-${requester_id}`
  topic_id: string;
  requester_id: string;
  requester_name: string;
  message: string;
  status: 'pending';
  created_at: string;
  topic: TopicWithAuthor;
  requester?: User;
}
```

## Error Handling

### Request Submission Errors
- **Topic not found:** "This session is no longer available"
- **Self-request:** "Cannot request to join your own session"
- **Already participant:** "You are already confirmed for this session"
- **Network error:** "Connection failed. Please try again."

### Request Management Errors
- **Approval failed:** "Failed to approve request. Please try again."
- **Already approved:** "This session already has a participant"
- **Topic deleted:** "This session is no longer available"

### Session State Errors
- **Insufficient participants:** Auto-cleanup expired sessions
- **Permission denied:** "You don't have permission to join this session"
- **Session ended:** "This session has ended"

## Testing Strategy

### Unit Tests
- Topic state calculation functions
- Request validation logic
- User permission checks
- Data transformation utilities

### Integration Tests
- Request submission flow
- Request approval/rejection flow
- Real-time update propagation
- Session state transitions

### End-to-End Tests
- Complete user journey: Create topic → Send request → Approve → Join session
- Multi-user scenarios with concurrent requests
- Error handling and recovery flows
- Real-time synchronization across multiple clients

## Security Considerations

### Data Access Control
- Users only see requests for topics they authored
- Users only see their own sent requests
- Database-level filtering prevents data leakage
- Row Level Security policies enforce access control

### Request Validation
- Server-side validation of all request data
- Prevention of duplicate requests
- Automatic cleanup of stale requests
- Rate limiting on request submission

### Session Access Control
- Only participants can join active sessions
- Session URLs are not guessable
- Presence verification before allowing access
- Automatic cleanup of unauthorized participants

## Performance Optimizations

### Database Queries
- Indexed queries on author_id and participant arrays
- Efficient JSONB operations for request management
- Batch operations for request approval/rejection
- Optimized real-time subscription filters

### Real-time Updates
- Targeted subscriptions based on user involvement
- Debounced UI updates to prevent excessive re-renders
- Efficient state management with minimal re-fetching
- Smart caching of topic and user data

### UI Responsiveness
- Optimistic UI updates for immediate feedback
- Loading states for all async operations
- Error boundaries to prevent UI crashes
- Progressive enhancement for offline scenarios

## Migration Strategy

### Phase 1: Fix Current System
- Repair existing JSONB-based request system
- Ensure proper data filtering and security
- Fix real-time updates and UI state management

### Phase 2: Enhanced UX
- Improve error handling and user feedback
- Add comprehensive loading and success states
- Implement proper validation and edge case handling

### Phase 3: Performance & Scale
- Optimize database queries and indexes
- Implement advanced caching strategies
- Add monitoring and analytics
- Prepare for future table-based request system

## Monitoring and Analytics

### Key Metrics
- Request submission success rate
- Request approval/rejection ratios
- Session participation rates
- User engagement with topics
- Error rates and types

### Logging Strategy
- Request lifecycle events
- Session state transitions
- User action tracking
- Error and exception logging
- Performance metrics collection