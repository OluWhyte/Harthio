# Requirements Document

## Introduction

The current topic creation and session joining flow is broken and needs a complete revamp. Users are unable to send join requests properly, and the flow from topic creation to active session participation is confusing and non-functional. This spec defines a clear, secure, and user-friendly flow from topic creation through request management to active session participation.

## Requirements

### Requirement 1: Topic Creation and Visibility

**User Story:** As a user, I want to create a topic for discussion so that others can discover and request to join my session.

#### Acceptance Criteria

1. WHEN a user creates a topic THEN the system SHALL store the topic with the user as the author
2. WHEN a topic is created THEN the system SHALL automatically add the author as a participant
3. WHEN a topic is created THEN the system SHALL make the topic visible to all users on the dashboard
4. WHEN a topic is created THEN the system SHALL show "You are hosting this session" message to the author
5. WHEN a topic is created THEN the system SHALL show appropriate session buttons since the author is automatically a participant

### Requirement 2: Join Request System

**User Story:** As a user, I want to request to join interesting topics so that I can participate in discussions that matter to me.

#### Acceptance Criteria

1. WHEN a user views a topic they didn't create THEN the system SHALL show a "Request to Join" button
2. WHEN a user clicks "Request to Join" THEN the system SHALL open a dialog to optionally add a message
3. WHEN a user submits a join request THEN the system SHALL store the request with user ID, name, message, and timestamp
4. WHEN a user has already sent a request THEN the system SHALL show "Request Sent" instead of "Request to Join"
5. WHEN a user is already a participant THEN the system SHALL show "You are confirmed for this session"
6. WHEN a user tries to request their own topic THEN the system SHALL prevent this and show appropriate message

### Requirement 3: Request Management for Authors

**User Story:** As a topic author, I want to see and manage join requests so that I can approve the right participant for my session.

#### Acceptance Criteria

1. WHEN users send requests to my topics THEN the system SHALL show me these requests in the "Requests Received" tab
2. WHEN I view a request THEN the system SHALL show the requester's name, message, and profile information
3. WHEN I approve a request THEN the system SHALL add the user to participants and clear ALL other pending requests
4. WHEN I approve a request THEN the system SHALL notify the approved user
5. WHEN I approve a request THEN the system SHALL automatically reject all other pending requests for that topic
6. WHEN there are pending requests THEN the system SHALL show a notification on my topic cards

### Requirement 4: Request Tracking for Users

**User Story:** As a user, I want to track my sent requests so that I know the status of my session participation.

#### Acceptance Criteria

1. WHEN I send requests THEN the system SHALL show them in my "Requests Sent" tab
2. WHEN I view my sent requests THEN the system SHALL show the topic title, host name, and my message
3. WHEN I want to cancel a request THEN the system SHALL allow me to withdraw it
4. WHEN my request is approved THEN the system SHALL remove it from "Requests Sent" and notify me
5. WHEN my request is rejected THEN the system SHALL remove it from "Requests Sent"

### Requirement 5: Session State Management

**User Story:** As a user, I want clear indication of session states so that I know when I can join active sessions.

#### Acceptance Criteria

1. WHEN a topic has only the author as participant THEN the system SHALL show "Waiting for participants" state
2. WHEN a topic has 2+ participants but hasn't started THEN the system SHALL show "Upcoming Session" for participants
3. WHEN a topic has 2+ participants and is within time window THEN the system SHALL show "Join Session" for participants
4. WHEN a session time passes without enough participants (minimum 2) THEN the system SHALL clean up the topic
5. WHEN a session is active THEN the system SHALL only allow participants and author to join

### Requirement 6: Real-time Updates

**User Story:** As a user, I want real-time updates on request status so that I'm immediately informed of changes.

#### Acceptance Criteria

1. WHEN a request is sent THEN the system SHALL immediately update the author's view
2. WHEN a request is approved/rejected THEN the system SHALL immediately update the requester's view
3. WHEN participants change THEN the system SHALL update session button states in real-time
4. WHEN topics are updated THEN the system SHALL refresh the dashboard view for all users

### Requirement 7: Security and Data Isolation

**User Story:** As a user, I want my request data to be private so that only relevant parties can see my requests.

#### Acceptance Criteria

1. WHEN I send a request THEN only the topic author SHALL see it in their received requests
2. WHEN I view my sent requests THEN I SHALL only see requests I personally sent
3. WHEN I view received requests THEN I SHALL only see requests for topics I authored
4. WHEN database queries are made THEN the system SHALL filter data by user ownership at the database level
5. WHEN real-time updates occur THEN the system SHALL only send updates to authorized users

### Requirement 8: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback on actions so that I understand what's happening and can resolve issues.

#### Acceptance Criteria

1. WHEN a request fails to send THEN the system SHALL show a clear error message
2. WHEN a user tries invalid actions THEN the system SHALL prevent them and explain why
3. WHEN network issues occur THEN the system SHALL provide helpful retry options
4. WHEN database operations fail THEN the system SHALL gracefully handle errors without breaking the UI
5. WHEN actions succeed THEN the system SHALL provide positive confirmation feedback
