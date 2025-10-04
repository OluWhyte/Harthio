/**
 * Comprehensive error handling utilities for the topic-to-session flow
 */

export interface ErrorDetails {
  title: string;
  message: string;
  type: ErrorType;
  retryable: boolean;
  actionable: boolean;
}

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

/**
 * Parse error and return user-friendly error details
 */
export function parseError(error: unknown): ErrorDetails {
  if (!error) {
    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred. Please try again.',
      type: ErrorType.UNKNOWN,
      retryable: true,
      actionable: false
    };
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || 
      lowerMessage.includes('fetch') || 
      lowerMessage.includes('connection') ||
      lowerMessage.includes('offline')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      type: ErrorType.NETWORK,
      retryable: true,
      actionable: true
    };
  }

  // Authentication errors
  if (lowerMessage.includes('unauthorized') || 
      lowerMessage.includes('authentication') ||
      lowerMessage.includes('session expired') ||
      lowerMessage.includes('please log in')) {
    return {
      title: 'Authentication Required',
      message: 'Your session has expired. Please refresh the page and log in again.',
      type: ErrorType.AUTHENTICATION,
      retryable: false,
      actionable: true
    };
  }

  // Authorization errors
  if (lowerMessage.includes('access denied') || 
      lowerMessage.includes('permission') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('not authorized')) {
    return {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      type: ErrorType.AUTHORIZATION,
      retryable: false,
      actionable: false
    };
  }

  // Validation errors
  if (lowerMessage.includes('validation') || 
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('required') ||
      lowerMessage.includes('cannot exceed') ||
      lowerMessage.includes('too long') ||
      lowerMessage.includes('too short')) {
    return {
      title: 'Invalid Input',
      message: getValidationMessage(errorMessage),
      type: ErrorType.VALIDATION,
      retryable: false,
      actionable: true
    };
  }

  // Not found errors
  if (lowerMessage.includes('not found') || 
      lowerMessage.includes('does not exist') ||
      lowerMessage.includes('no longer available')) {
    return {
      title: 'Not Found',
      message: getNotFoundMessage(errorMessage),
      type: ErrorType.NOT_FOUND,
      retryable: false,
      actionable: false
    };
  }

  // Conflict errors (business logic violations)
  if (lowerMessage.includes('already') || 
      lowerMessage.includes('cannot request to join your own') ||
      lowerMessage.includes('already a participant') ||
      lowerMessage.includes('session is full') ||
      lowerMessage.includes('already has a participant')) {
    return {
      title: 'Action Not Allowed',
      message: getConflictMessage(errorMessage),
      type: ErrorType.CONFLICT,
      retryable: false,
      actionable: false
    };
  }

  // Rate limiting
  if (lowerMessage.includes('rate limit') || 
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('slow down')) {
    return {
      title: 'Too Many Requests',
      message: 'You\'re making requests too quickly. Please wait a moment and try again.',
      type: ErrorType.RATE_LIMIT,
      retryable: true,
      actionable: true
    };
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || 
      lowerMessage.includes('timed out')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.',
      type: ErrorType.NETWORK,
      retryable: true,
      actionable: true
    };
  }

  // Server errors
  if (lowerMessage.includes('server error') || 
      lowerMessage.includes('internal error') ||
      lowerMessage.includes('500') ||
      lowerMessage.includes('503')) {
    return {
      title: 'Server Error',
      message: 'The server encountered an error. Please try again in a few moments.',
      type: ErrorType.SERVER,
      retryable: true,
      actionable: true
    };
  }

  // Default case - return the original message if it's user-friendly, otherwise generic
  const isUserFriendly = !lowerMessage.includes('error:') && 
                        !lowerMessage.includes('exception') &&
                        !lowerMessage.includes('stack') &&
                        errorMessage.length < 200;

  return {
    title: 'Error',
    message: isUserFriendly ? errorMessage : 'An unexpected error occurred. Please try again.',
    type: ErrorType.UNKNOWN,
    retryable: true,
    actionable: false
  };
}

function getValidationMessage(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('message cannot exceed') || lowerMessage.includes('too long')) {
    return 'Your message is too long. Please keep it under 200 characters.';
  }
  
  if (lowerMessage.includes('required')) {
    return 'Please fill in all required fields.';
  }
  
  if (lowerMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  
  return errorMessage;
}

function getNotFoundMessage(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('topic') || lowerMessage.includes('session')) {
    return 'This session is no longer available.';
  }
  
  if (lowerMessage.includes('user')) {
    return 'User profile not found.';
  }
  
  if (lowerMessage.includes('request')) {
    return 'The request was not found - it may have already been processed.';
  }
  
  return 'The requested item was not found.';
}

function getConflictMessage(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('cannot request to join your own')) {
    return 'You cannot request to join your own session.';
  }
  
  if (lowerMessage.includes('already a participant')) {
    return 'You are already confirmed for this session.';
  }
  
  if (lowerMessage.includes('session is full') || lowerMessage.includes('already has a participant')) {
    return 'This session is already full.';
  }
  
  if (lowerMessage.includes('already sent') || lowerMessage.includes('already requested')) {
    return 'You have already sent a request for this session.';
  }
  
  return errorMessage;
}

/**
 * Retry configuration for different error types
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export function getRetryConfig(errorType: ErrorType): RetryConfig | null {
  switch (errorType) {
    case ErrorType.NETWORK:
      return {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
      };
    
    case ErrorType.SERVER:
      return {
        maxAttempts: 2,
        baseDelay: 2000,
        maxDelay: 8000,
        backoffMultiplier: 2
      };
    
    case ErrorType.RATE_LIMIT:
      return {
        maxAttempts: 2,
        baseDelay: 5000,
        maxDelay: 15000,
        backoffMultiplier: 3
      };
    
    default:
      return null; // No retry for other error types
  }
}

/**
 * Calculate delay for retry attempt with exponential backoff
 */
export function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  errorType?: ErrorType
): Promise<T> {
  let lastError: unknown;
  let attempt = 1;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorDetails = parseError(error);
      const retryConfig = getRetryConfig(errorType || errorDetails.type);
      
      if (!retryConfig || attempt >= retryConfig.maxAttempts) {
        throw error;
      }
      
      const delay = calculateRetryDelay(attempt, retryConfig);
      console.log(`Retry attempt ${attempt} failed, retrying in ${delay}ms:`, errorDetails.message);
      
      await sleep(delay);
      attempt++;
    }
  }
}

/**
 * Enhanced operation wrapper with comprehensive error handling
 */
export async function executeOperation<T>(
  operation: () => Promise<T>,
  context: {
    operationName: string;
    userId?: string;
    topicId?: string;
    requestId?: string;
    retryable?: boolean;
    showUserError?: boolean;
    logError?: boolean;
  }
): Promise<{ success: true; data: T } | { success: false; error: string; retryable: boolean }> {
  const {
    operationName,
    userId,
    topicId,
    requestId,
    retryable = true,
    showUserError = true,
    logError: shouldLogError = true
  } = context;

  try {
    const result = await operation();
    
    if (shouldLogError) {
      console.log(`[SUCCESS] ${operationName} completed successfully`, {
        userId,
        topicId,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    return { success: true, data: result };
  } catch (error) {
    const errorDetails = parseError(error);
    
    if (shouldLogError) {
      logError(operationName, error, {
        userId,
        topicId,
        requestId,
        retryable: errorDetails.retryable && retryable,
        showUserError
      });
    }
    
    return {
      success: false,
      error: showUserError ? errorDetails.message : 'Operation failed',
      retryable: errorDetails.retryable && retryable
    };
  }
}

/**
 * Batch operation handler with individual error tracking
 */
export async function executeBatchOperations<T>(
  operations: Array<{
    operation: () => Promise<T>;
    id: string;
    context?: Record<string, any>;
  }>,
  options: {
    maxConcurrency?: number;
    continueOnError?: boolean;
    logErrors?: boolean;
  } = {}
): Promise<{
  successful: Array<{ id: string; data: T }>;
  failed: Array<{ id: string; error: string; retryable: boolean }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    retryable: number;
  };
}> {
  const { maxConcurrency = 3, continueOnError = true, logErrors: shouldLogErrors = true } = options;
  const successful: Array<{ id: string; data: T }> = [];
  const failed: Array<{ id: string; error: string; retryable: boolean }> = [];

  // Process operations in batches to avoid overwhelming the system
  for (let i = 0; i < operations.length; i += maxConcurrency) {
    const batch = operations.slice(i, i + maxConcurrency);
    
    const batchPromises = batch.map(async ({ operation, id, context }) => {
      try {
        const data = await operation();
        successful.push({ id, data });
        
        if (shouldLogErrors) {
          console.log(`[BATCH SUCCESS] Operation ${id} completed`, context);
        }
      } catch (error) {
        const errorDetails = parseError(error);
        failed.push({
          id,
          error: errorDetails.message,
          retryable: errorDetails.retryable
        });
        
        if (shouldLogErrors) {
          logError(`Batch Operation ${id}`, error, context);
        }
        
        if (!continueOnError) {
          throw error;
        }
      }
    });

    await Promise.allSettled(batchPromises);
  }

  const retryableCount = failed.filter(f => f.retryable).length;

  return {
    successful,
    failed,
    summary: {
      total: operations.length,
      successful: successful.length,
      failed: failed.length,
      retryable: retryableCount
    }
  };
}

/**
 * Validation helpers
 */
export function validateTopicId(topicId: unknown): string {
  if (!topicId || typeof topicId !== 'string' || topicId.trim().length === 0) {
    throw new Error('Topic ID is required');
  }
  return topicId.trim();
}

export function validateUserId(userId: unknown): string {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('User ID is required');
  }
  return userId.trim();
}

export function validateMessage(message: unknown): string {
  if (message === null || message === undefined) {
    return '';
  }
  
  if (typeof message !== 'string') {
    throw new Error('Message must be a string');
  }
  
  const trimmed = message.trim();
  if (trimmed.length > 200) {
    throw new Error('Message cannot exceed 200 characters');
  }
  
  return trimmed;
}

/**
 * Error logging utility
 */
export function logError(context: string, error: unknown, additionalData?: Record<string, any>) {
  const errorDetails = parseError(error);
  
  console.error(`[${context}] ${errorDetails.type.toUpperCase()}:`, {
    title: errorDetails.title,
    message: errorDetails.message,
    type: errorDetails.type,
    retryable: errorDetails.retryable,
    actionable: errorDetails.actionable,
    originalError: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalData
  });
}