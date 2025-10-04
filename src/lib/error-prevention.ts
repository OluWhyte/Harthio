/**
 * Enhanced error prevention utilities to validate actions before they're performed
 */

import { ErrorType, parseError } from './error-utils';
import { validateTopicId, validateUserId } from './error-utils';

export interface ActionValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  errorType?: ErrorType;
  preventAction: boolean;
  suggestion?: string;
  retryable?: boolean;
}

export interface PreventionCheck {
  isValid: boolean;
  error?: string;
  warning?: string;
  preventAction: boolean;
  suggestion?: string;
  retryable?: boolean;
}

/**
 * Enhanced validation if user can send a join request
 */
export function validateJoinRequestAction(
  topicId: string,
  userId: string,
  topic: any
): ActionValidationResult {
  try {
    // Basic validation
    validateTopicId(topicId);
    validateUserId(userId);
    
    if (!topic) {
      return {
        isValid: false,
        error: 'Session information is not available',
        preventAction: true,
        suggestion: 'Try refreshing the page',
        retryable: true
      };
    }

    // Check if user is trying to request their own topic
    if (topic.author_id === userId) {
      return {
        isValid: false,
        error: 'You cannot request to join your own session',
        preventAction: true,
        suggestion: 'You are already the host of this session',
        retryable: false
      };
    }

    // Check if user is already a participant
    if (topic.participants?.includes(userId)) {
      return {
        isValid: false,
        error: 'You are already confirmed for this session',
        preventAction: true,
        suggestion: 'Check your upcoming sessions',
        retryable: false
      };
    }

    // Check if user has already sent a request
    const hasExistingRequest = topic.requests?.some((req: any) => req.requesterId === userId);
    if (hasExistingRequest) {
      return {
        isValid: false,
        error: 'You have already sent a request for this session',
        preventAction: true,
        suggestion: 'Check your sent requests to see the status',
        retryable: false
      };
    }

    // Check if session is full
    const totalParticipants = (topic.participants?.length || 0) + 1; // +1 for author
    if (totalParticipants >= 2) {
      return {
        isValid: false,
        error: 'This session is already full',
        preventAction: true,
        suggestion: 'Look for other available sessions',
        retryable: false
      };
    }

    // Check if session has already started or ended
    const now = new Date();
    const startTime = new Date(topic.start_time);
    const endTime = new Date(topic.end_time);

    if (now > endTime) {
      return {
        isValid: false,
        error: 'This session has already ended',
        preventAction: true,
        suggestion: 'Look for upcoming sessions',
        retryable: false
      };
    }

    if (now > startTime) {
      return {
        isValid: false,
        error: 'This session has already started',
        preventAction: true,
        suggestion: 'You may still be able to join if there\'s space',
        retryable: false
      };
    }

    // Warning if session starts very soon
    const timeUntilStart = startTime.getTime() - now.getTime();
    const minutesUntilStart = timeUntilStart / (1000 * 60);

    if (minutesUntilStart < 15) {
      return {
        isValid: true,
        warning: 'This session starts in less than 15 minutes. The host may not have time to review your request.',
        preventAction: false,
        suggestion: 'Consider sending a brief, clear message with your request',
        retryable: false
      };
    }

    return { 
      isValid: true, 
      preventAction: false,
      retryable: false
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
      preventAction: true,
      suggestion: 'Please try again or refresh the page',
      retryable: true
    };
  }
}

/**
 * Pre-flight checks for request approval operations
 */
export function validateApprovalPreconditions(
  topicId: string,
  requesterId: string,
  topic: any,
  currentUserId: string
): PreventionCheck {
  try {
    // Basic validation
    validateTopicId(topicId);
    validateUserId(requesterId);
    validateUserId(currentUserId);

    if (!topic) {
      return {
        isValid: false,
        error: 'Session information is not available',
        preventAction: true,
        suggestion: 'Try refreshing the page',
        retryable: true
      };
    }

    // Check if current user is the topic author
    // Handle both author_id (direct) and author.id (nested) formats
    const topicAuthorId = topic.author_id || topic.author?.id;
    if (topicAuthorId !== currentUserId) {
      return {
        isValid: false,
        error: 'You can only approve requests for your own sessions',
        preventAction: true,
        suggestion: 'You can only manage requests for your own sessions',
        retryable: false
      };
    }

    // Check if the request still exists (only if requests array is available)
    // The topic object from requests page may not include the requests array
    if (topic.requests && Array.isArray(topic.requests)) {
      const request = topic.requests.find((req: any) => req.requesterId === requesterId);
      if (!request) {
        return {
          isValid: false,
          error: 'This request no longer exists - it may have already been processed',
          preventAction: true,
          suggestion: 'The request may have already been processed',
          retryable: true
        };
      }
    }
    // If requests array is not available, skip this check
    // The actual approval function will verify the request exists

    // Check if session is already full
    const totalParticipants = (topic.participants?.length || 0) + 1; // +1 for author
    if (totalParticipants >= 2) {
      return {
        isValid: false,
        error: 'This session is already full',
        preventAction: true,
        suggestion: 'Consider creating another session if there\'s high demand',
        retryable: false
      };
    }

    // Check if requester is already a participant (edge case)
    if (topic.participants?.includes(requesterId)) {
      return {
        isValid: false,
        error: 'This user is already a participant in the session',
        preventAction: true,
        suggestion: 'The user may have been approved through another request',
        retryable: true
      };
    }

    // Check if session has already ended
    const now = new Date();
    const endTime = new Date(topic.end_time);

    if (now > endTime) {
      return {
        isValid: false,
        error: 'This session has already ended',
        preventAction: true,
        suggestion: 'Look for upcoming sessions',
        retryable: false
      };
    }

    return { 
      isValid: true, 
      preventAction: false,
      retryable: false
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
      preventAction: true
    };
  }
}

/**
 * Pre-flight checks for session creation
 */
export function validateSessionCreationPreconditions(
  userId: string,
  sessionData: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
  }
): PreventionCheck {
  try {
    validateUserId(userId);

    const { title, description, startTime, endTime } = sessionData;
    const now = new Date();

    // Check timing constraints
    const timeUntilStart = startTime.getTime() - now.getTime();
    const minutesUntilStart = timeUntilStart / (1000 * 60);

    if (minutesUntilStart < 5) {
      return {
        isValid: false,
        error: 'Sessions must be scheduled at least 5 minutes in advance',
        preventAction: true,
        suggestion: 'Choose a start time at least 5 minutes from now',
        retryable: true
      };
    }

    // Check for reasonable scheduling
    if (minutesUntilStart > 30 * 24 * 60) { // 30 days
      return {
        isValid: false,
        error: 'Sessions cannot be scheduled more than 30 days in advance',
        preventAction: true,
        suggestion: 'Choose a date within the next 30 days',
        retryable: true
      };
    }

    // Check session duration
    const duration = endTime.getTime() - startTime.getTime();
    const durationMinutes = duration / (1000 * 60);

    if (durationMinutes < 15) {
      return {
        isValid: false,
        error: 'Sessions must be at least 15 minutes long',
        preventAction: true,
        suggestion: 'Extend the session duration to at least 15 minutes',
        retryable: true
      };
    }

    if (durationMinutes > 4 * 60) { // 4 hours
      return {
        isValid: false,
        error: 'Sessions cannot exceed 4 hours',
        preventAction: true,
        suggestion: 'Consider breaking longer sessions into multiple parts',
        retryable: true
      };
    }

    // Warning for very long sessions
    if (durationMinutes > 2 * 60) { // 2 hours
      return {
        isValid: true,
        warning: 'Sessions longer than 2 hours may be challenging for participants to commit to',
        preventAction: false,
        suggestion: 'Consider breaking longer topics into multiple shorter sessions',
        retryable: false
      };
    }

    // Warning for sessions scheduled during typical work hours
    const startHour = startTime.getHours();
    const isWeekday = startTime.getDay() >= 1 && startTime.getDay() <= 5;
    
    if (isWeekday && startHour >= 9 && startHour <= 17) {
      return {
        isValid: true,
        warning: 'This session is scheduled during typical work hours, which may limit participation',
        preventAction: false,
        suggestion: 'Consider scheduling for evenings or weekends for better participation',
        retryable: false
      };
    }

    return { 
      isValid: true, 
      preventAction: false,
      retryable: false
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
      preventAction: true
    };
  }
}

/**
 * Enhanced network connectivity check
 */
export function checkNetworkConnectivity(): PreventionCheck {
  if (!navigator.onLine) {
    return {
      isValid: false,
      error: 'You appear to be offline. Please check your internet connection.',
      preventAction: true,
      suggestion: 'Check your internet connection and try again',
      retryable: true
    };
  }

  // Check for unstable connection (this would be enhanced with actual connection quality metrics)
  const connectionType = (navigator as any).connection?.effectiveType;
  if (connectionType === 'slow-2g' || connectionType === '2g') {
    return {
      isValid: true,
      warning: 'Your connection appears slow. Operations may take longer than usual.',
      preventAction: false,
      suggestion: 'Consider improving your connection for better performance',
      retryable: false
    };
  }

  return { 
    isValid: true, 
    preventAction: false,
    retryable: false
  };
}

/**
 * Enhanced rate limiting check
 */
export function checkRateLimit(
  lastActionTime: Date | null,
  minIntervalMs: number,
  actionName: string
): PreventionCheck {
  if (!lastActionTime) {
    return { 
      isValid: true, 
      preventAction: false,
      retryable: false
    };
  }

  const now = new Date();
  const timeSinceLastAction = now.getTime() - lastActionTime.getTime();

  if (timeSinceLastAction < minIntervalMs) {
    const remainingSeconds = Math.ceil((minIntervalMs - timeSinceLastAction) / 1000);
    return {
      isValid: false,
      error: `Please wait ${remainingSeconds} seconds before ${actionName} again`,
      preventAction: true,
      suggestion: 'Take a moment to review your request before retrying',
      retryable: true
    };
  }

  // Warning when approaching rate limit
  if (timeSinceLastAction < minIntervalMs * 2) {
    return {
      isValid: true,
      warning: `You're ${actionName} frequently. Consider slowing down to avoid being rate limited.`,
      preventAction: false,
      suggestion: 'Please slow down to avoid being temporarily blocked',
      retryable: false
    };
  }

  return { 
    isValid: true, 
    preventAction: false,
    retryable: false
  };
}

/**
 * Enhanced comprehensive pre-flight check runner
 */
export function runPreflightChecks(
  checks: Array<() => PreventionCheck>
): {
  canProceed: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  blockingErrors: string[];
  retryableErrors: string[];
  primaryBlocker?: string;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const blockingErrors: string[] = [];
  const retryableErrors: string[] = [];
  let canProceed = true;
  let primaryBlocker: string | undefined;

  for (const check of checks) {
    try {
      const result = check();
      
      if (!result.isValid) {
        const errorMsg = result.error || 'Unknown error';
        errors.push(errorMsg);
        
        if (result.preventAction) {
          blockingErrors.push(errorMsg);
          canProceed = false;
          
          // Set primary blocker to the first blocking error
          if (!primaryBlocker) {
            primaryBlocker = errorMsg;
          }
        }
        
        if (result.retryable) {
          retryableErrors.push(errorMsg);
        }
      }
      
      if (result.warning) {
        warnings.push(result.warning);
      }
      
      if (result.suggestion) {
        suggestions.push(result.suggestion);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check failed';
      errors.push(errorMessage);
      blockingErrors.push(errorMessage);
      retryableErrors.push(errorMessage); // Assume check failures are retryable
      canProceed = false;
      
      if (!primaryBlocker) {
        primaryBlocker = errorMessage;
      }
    }
  }

  return {
    canProceed,
    errors,
    warnings,
    suggestions: [...new Set(suggestions)], // Remove duplicates
    blockingErrors,
    retryableErrors,
    primaryBlocker
  };
}

/**
 * Enhanced prevention check wrapper for async operations
 */
export function withPreventionChecks<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  checks: Array<() => PreventionCheck>,
  options: {
    logWarnings?: boolean;
    throwOnWarnings?: boolean;
    includeContext?: boolean;
  } = {}
) {
  const { logWarnings = true, throwOnWarnings = false, includeContext = true } = options;
  
  return async (...args: T): Promise<R> => {
    const preflightResult = runPreflightChecks(checks);
    
    if (!preflightResult.canProceed) {
      const error = new Error(preflightResult.primaryBlocker || 'Operation prevented by validation checks');
      
      if (includeContext) {
        (error as any).context = {
          errors: preflightResult.errors,
          warnings: preflightResult.warnings,
          suggestions: preflightResult.suggestions,
          retryable: preflightResult.retryableErrors.length > 0
        };
      }
      
      throw error;
    }
    
    // Handle warnings
    if (preflightResult.warnings.length > 0) {
      if (logWarnings) {
        console.warn('Operation proceeding with warnings:', {
          warnings: preflightResult.warnings,
          suggestions: preflightResult.suggestions
        });
      }
      
      if (throwOnWarnings) {
        const error = new Error(`Operation has warnings: ${preflightResult.warnings.join(', ')}`);
        (error as any).context = {
          warnings: preflightResult.warnings,
          suggestions: preflightResult.suggestions,
          severity: 'warning'
        };
        throw error;
      }
    }
    
    return operation(...args);
  };
}

/**
 * Create a comprehensive validation context for actions
 */
export function createValidationContext(
  user: any,
  topic: any,
  request?: any,
  additionalContext?: Record<string, any>
) {
  return {
    user,
    topic,
    request,
    currentTime: new Date(),
    isOnline: navigator.onLine,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    userAgent: navigator.userAgent,
    ...additionalContext
  };
}

/**
 * Batch validation for multiple actions
 */
export function validateBatchActions(
  actions: Array<{
    id: string;
    checks: Array<() => PreventionCheck>;
    context?: Record<string, any>;
  }>
): {
  validActions: string[];
  invalidActions: Array<{
    id: string;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    retryable: boolean;
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    retryable: number;
  };
} {
  const validActions: string[] = [];
  const invalidActions: Array<{
    id: string;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    retryable: boolean;
  }> = [];

  for (const action of actions) {
    const result = runPreflightChecks(action.checks);
    
    if (result.canProceed) {
      validActions.push(action.id);
    } else {
      invalidActions.push({
        id: action.id,
        errors: result.errors,
        warnings: result.warnings,
        suggestions: result.suggestions,
        retryable: result.retryableErrors.length > 0
      });
    }
  }

  return {
    validActions,
    invalidActions,
    summary: {
      total: actions.length,
      valid: validActions.length,
      invalid: invalidActions.length,
      retryable: invalidActions.filter(a => a.retryable).length
    }
  };
}