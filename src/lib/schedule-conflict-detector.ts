/**
 * Author Approval Conflict Detection System
 * Prevents authors from approving users for overlapping sessions
 * Authors can only be in one session at a time, so they cannot approve
 * users for multiple sessions that overlap in time.
 */

import { topicService } from './supabase-services';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  sessionId: string;
  sessionTitle: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingSessions?: TimeSlot[];
  canApprove: boolean;
  reason?: string;
}

/**
 * Check if two time slots overlap
 */
function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  const start1 = slot1.startTime.getTime();
  const end1 = slot1.endTime.getTime();
  const start2 = slot2.startTime.getTime();
  const end2 = slot2.endTime.getTime();

  // Two slots overlap if one starts before the other ends
  return start1 < end2 && start2 < end1;
}

/**
 * Get all sessions where the author has already approved participants
 * These are sessions in STATE 2 (has approved participants)
 */
async function getAuthorApprovedSessions(authorId: string): Promise<TimeSlot[]> {
  try {
    const allTopics = await topicService.getAllTopics();
    
    const approvedSessions: TimeSlot[] = [];
    
    for (const topic of allTopics) {
      // Check if this is the author's session AND has approved participants
      const isAuthor = topic.author_id === authorId;
      const participants = Array.isArray(topic.participants) ? topic.participants : [];
      const hasApprovedParticipants = participants.length > 0;
      
      if (isAuthor && hasApprovedParticipants) {
        approvedSessions.push({
          startTime: new Date(topic.start_time),
          endTime: new Date(topic.end_time),
          sessionId: topic.id,
          sessionTitle: topic.title
        });
      }
    }
    
    return approvedSessions;
  } catch (error) {
    console.error('Error fetching author approved sessions:', error);
    return [];
  }
}

/**
 * Get all sessions where the user is approved as a participant
 * These are sessions where the user is committed to attend
 */
async function getUserApprovedSessions(userId: string): Promise<TimeSlot[]> {
  try {
    const allTopics = await topicService.getAllTopics();
    
    const approvedSessions: TimeSlot[] = [];
    
    for (const topic of allTopics) {
      // Check if user is in participants array (already approved)
      const participants = Array.isArray(topic.participants) ? topic.participants : [];
      
      if (participants.includes(userId)) {
        approvedSessions.push({
          startTime: new Date(topic.start_time),
          endTime: new Date(topic.end_time),
          sessionId: topic.id,
          sessionTitle: topic.title
        });
      }
    }
    
    return approvedSessions;
  } catch (error) {
    console.error('Error fetching user approved sessions:', error);
    return [];
  }
}

/**
 * Get session details for a specific topic
 */
async function getSessionTimeSlot(topicId: string): Promise<TimeSlot | null> {
  try {
    const allTopics = await topicService.getAllTopics();
    const topic = allTopics.find(t => t.id === topicId);
    
    if (!topic) {
      return null;
    }
    
    return {
      startTime: new Date(topic.start_time),
      endTime: new Date(topic.end_time),
      sessionId: topic.id,
      sessionTitle: topic.title
    };
  } catch (error) {
    console.error('Error fetching session details:', error);
    return null;
  }
}

/**
 * Check if approving a user for a session would create author approval conflicts
 * Authors cannot approve users for overlapping sessions because they can only be in one session at a time
 */
export async function checkScheduleConflict(
  topicId: string,
  userId: string
): Promise<ConflictCheckResult> {
  try {
    // Get the session we want to approve the user for
    const targetSession = await getSessionTimeSlot(topicId);
    
    if (!targetSession) {
      return {
        hasConflict: false,
        canApprove: false,
        reason: 'Session not found'
      };
    }

    // Get the author of this session
    const allTopics = await topicService.getAllTopics();
    const topic = allTopics.find(t => t.id === topicId);
    
    if (!topic) {
      return {
        hasConflict: false,
        canApprove: false,
        reason: 'Session not found'
      };
    }

    const authorId = topic.author_id;
    
    // Get all sessions where this author has already approved participants (STATE 2 sessions)
    const authorApprovedSessions = await getAuthorApprovedSessions(authorId);
    
    // Check for conflicts - author cannot approve for overlapping sessions
    const conflictingSessions: TimeSlot[] = [];
    
    for (const approvedSession of authorApprovedSessions) {
      // Skip the current session (can't conflict with itself)
      if (approvedSession.sessionId === topicId) continue;
      
      if (doTimeSlotsOverlap(targetSession, approvedSession)) {
        conflictingSessions.push(approvedSession);
      }
    }
    
    const hasConflict = conflictingSessions.length > 0;
    
    return {
      hasConflict,
      conflictingSessions: hasConflict ? conflictingSessions : undefined,
      canApprove: !hasConflict,
      reason: hasConflict 
        ? `You will be busy at this time with "${conflictingSessions[0].sessionTitle}". Please pick another time or date.`
        : undefined
    };
    
  } catch (error) {
    console.error('Error checking approval conflict:', error);
    return {
      hasConflict: false,
      canApprove: false,
      reason: 'Error checking approval conflicts'
    };
  }
}

/**
 * Check if a user can send a join request for a session
 * Users cannot request to join sessions that overlap with their already approved sessions
 */
export async function checkJoinRequestConflict(
  topicId: string,
  userId: string
): Promise<ConflictCheckResult> {
  try {
    // Get the session the user wants to request to join
    const targetSession = await getSessionTimeSlot(topicId);
    
    if (!targetSession) {
      return {
        hasConflict: false,
        canApprove: false,
        reason: 'Session not found'
      };
    }

    // Get all sessions where the user is already approved as a participant
    const userApprovedSessions = await getUserApprovedSessions(userId);
    
    // Check for conflicts - user cannot request to join overlapping sessions
    const conflictingSessions: TimeSlot[] = [];
    
    for (const approvedSession of userApprovedSessions) {
      if (doTimeSlotsOverlap(targetSession, approvedSession)) {
        conflictingSessions.push(approvedSession);
      }
    }
    
    const hasConflict = conflictingSessions.length > 0;
    
    return {
      hasConflict,
      conflictingSessions: hasConflict ? conflictingSessions : undefined,
      canApprove: !hasConflict,
      reason: hasConflict 
        ? `You will be busy at this time with "${conflictingSessions[0].sessionTitle}". Please pick another session at a different time.`
        : undefined
    };
    
  } catch (error) {
    console.error('Error checking join request conflict:', error);
    return {
      hasConflict: false,
      canApprove: false,
      reason: 'Error checking join request conflicts'
    };
  }
}

/**
 * Check if a user can schedule a new session at a given time
 * Authors cannot schedule sessions that overlap with their sessions that have approved participants
 */
export async function checkNewSessionConflict(
  userId: string,
  startTime: Date,
  endTime: Date
): Promise<ConflictCheckResult> {
  try {
    const newSession: TimeSlot = {
      startTime,
      endTime,
      sessionId: 'new',
      sessionTitle: 'New Session'
    };
    
    // Get all sessions where the author has already approved participants (STATE 2)
    const authorApprovedSessions = await getAuthorApprovedSessions(userId);
    
    // Check for conflicts with approved sessions
    const conflictingSessions: TimeSlot[] = [];
    
    for (const approvedSession of authorApprovedSessions) {
      if (doTimeSlotsOverlap(newSession, approvedSession)) {
        conflictingSessions.push(approvedSession);
      }
    }
    
    const hasConflict = conflictingSessions.length > 0;
    
    return {
      hasConflict,
      conflictingSessions: hasConflict ? conflictingSessions : undefined,
      canApprove: !hasConflict,
      reason: hasConflict 
        ? `You will be busy at this time with "${conflictingSessions[0].sessionTitle}". Please pick another time or date.`
        : undefined
    };
    
  } catch (error) {
    console.error('Error checking new session conflict:', error);
    return {
      hasConflict: false,
      canApprove: false,
      reason: 'Error checking schedule conflicts'
    };
  }
}

/**
 * Format time range for display
 */
function formatTimeRange(session: TimeSlot): string {
  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`;
}

/**
 * Get an author's approval summary
 */
export async function getAuthorApprovalSummary(authorId: string): Promise<{
  sessionsWithApprovedParticipants: TimeSlot[];
  sessionsAwaitingApproval: TimeSlot[];
  totalAuthoredSessions: number;
}> {
  try {
    const allTopics = await topicService.getAllTopics();
    
    const sessionsWithApprovedParticipants: TimeSlot[] = [];
    const sessionsAwaitingApproval: TimeSlot[] = [];
    
    for (const topic of allTopics) {
      const isAuthor = topic.author_id === authorId;
      
      if (isAuthor) {
        const timeSlot: TimeSlot = {
          startTime: new Date(topic.start_time),
          endTime: new Date(topic.end_time),
          sessionId: topic.id,
          sessionTitle: topic.title
        };
        
        const participants = Array.isArray(topic.participants) ? topic.participants : [];
        const hasApprovedParticipants = participants.length > 0;
        
        if (hasApprovedParticipants) {
          sessionsWithApprovedParticipants.push(timeSlot);
        } else {
          sessionsAwaitingApproval.push(timeSlot);
        }
      }
    }
    
    return {
      sessionsWithApprovedParticipants,
      sessionsAwaitingApproval,
      totalAuthoredSessions: sessionsWithApprovedParticipants.length + sessionsAwaitingApproval.length
    };
    
  } catch (error) {
    console.error('Error getting author approval summary:', error);
    return {
      sessionsWithApprovedParticipants: [],
      sessionsAwaitingApproval: [],
      totalAuthoredSessions: 0
    };
  }
}