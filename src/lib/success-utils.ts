/**
 * Success feedback utilities for user actions
 */

export interface SuccessDetails {
  title: string;
  message: string;
  type: SuccessType;
  duration?: number;
  actionable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export enum SuccessType {
  REQUEST_SENT = 'request_sent',
  REQUEST_APPROVED = 'request_approved',
  REQUEST_REJECTED = 'request_rejected',
  SESSION_CREATED = 'session_created',
  SESSION_JOINED = 'session_joined',
  PROFILE_UPDATED = 'profile_updated',
  GENERAL = 'general'
}

/**
 * Get success feedback details for different operations
 */
export function getSuccessDetails(type: SuccessType, context?: Record<string, any>): SuccessDetails {
  switch (type) {
    case SuccessType.REQUEST_SENT:
      return {
        title: 'Request Sent Successfully',
        message: 'The host has been notified of your request and will review it soon.',
        type,
        duration: 5000,
        actionable: true,
        action: {
          label: 'View Requests',
          onClick: () => window.location.href = '/requests'
        }
      };

    case SuccessType.REQUEST_APPROVED:
      return {
        title: 'Request Approved',
        message: context?.requesterName 
          ? `${context.requesterName} has been added to your session. All other requests have been cleared.`
          : 'The user has been added to your session and all other requests have been cleared.',
        type,
        duration: 6000,
        actionable: false
      };

    case SuccessType.REQUEST_REJECTED:
      return {
        title: 'Request Declined',
        message: 'The join request has been declined.',
        type,
        duration: 4000,
        actionable: false
      };

    case SuccessType.SESSION_CREATED:
      return {
        title: 'Session Scheduled Successfully!',
        message: context?.sessionTitle 
          ? `Your session "${context.sessionTitle}" has been created and is now visible to other users.`
          : 'Your new session has been created and is now visible to other users.',
        type,
        duration: 6000,
        actionable: true,
        action: {
          label: 'View Dashboard',
          onClick: () => window.location.href = '/dashboard'
        }
      };

    case SuccessType.SESSION_JOINED:
      return {
        title: 'Joined Session Successfully',
        message: context?.sessionTitle 
          ? `You've successfully joined "${context.sessionTitle}".`
          : 'You have successfully joined the session.',
        type,
        duration: 4000,
        actionable: false
      };

    case SuccessType.PROFILE_UPDATED:
      return {
        title: 'Profile Updated',
        message: 'Your profile information has been saved successfully.',
        type,
        duration: 4000,
        actionable: false
      };

    case SuccessType.GENERAL:
    default:
      return {
        title: 'Success',
        message: context?.message || 'Operation completed successfully.',
        type,
        duration: 4000,
        actionable: false
      };
  }
}

/**
 * Success feedback hook for consistent success handling
 */
export interface UseSuccessFeedbackOptions {
  showToast?: boolean;
  logSuccess?: boolean;
}

export function createSuccessFeedback(
  toast: (options: any) => void,
  options: UseSuccessFeedbackOptions = {}
) {
  const { showToast = true, logSuccess = true } = options;

  return {
    showSuccess: (type: SuccessType, context?: Record<string, any>) => {
      const successDetails = getSuccessDetails(type, context);
      
      if (logSuccess) {
        console.log(`[SUCCESS] ${successDetails.title}:`, {
          type: successDetails.type,
          message: successDetails.message,
          context
        });
      }
      
      if (showToast) {
        toast({
          title: successDetails.title,
          description: successDetails.message,
          variant: 'default',
          duration: successDetails.duration
        });
      }
      
      return successDetails;
    }
  };
}

/**
 * Success state component props
 */
export interface SuccessStateProps {
  type: SuccessType;
  context?: Record<string, any>;
  onClose?: () => void;
  showAction?: boolean;
}

/**
 * Get appropriate icon for success type
 */
export function getSuccessIcon(type: SuccessType): string {
  switch (type) {
    case SuccessType.REQUEST_SENT:
      return 'mail-check';
    case SuccessType.REQUEST_APPROVED:
      return 'user-check';
    case SuccessType.REQUEST_REJECTED:
      return 'user-x';
    case SuccessType.SESSION_CREATED:
      return 'calendar-plus';
    case SuccessType.SESSION_JOINED:
      return 'video';
    case SuccessType.PROFILE_UPDATED:
      return 'user';
    default:
      return 'check-circle';
  }
}

/**
 * Validation for success operations
 */
export function validateSuccessContext(type: SuccessType, context?: Record<string, any>): boolean {
  switch (type) {
    case SuccessType.REQUEST_SENT:
      return !!(context?.topicId && context?.requesterId);
    
    case SuccessType.REQUEST_APPROVED:
    case SuccessType.REQUEST_REJECTED:
      return !!(context?.topicId && context?.requesterId);
    
    case SuccessType.SESSION_CREATED:
      return !!(context?.sessionId);
    
    case SuccessType.SESSION_JOINED:
      return !!(context?.sessionId);
    
    case SuccessType.PROFILE_UPDATED:
      return !!(context?.userId);
    
    default:
      return true; // General success doesn't require specific context
  }
}

/**
 * Success analytics tracking
 */
export function trackSuccessEvent(type: SuccessType, context?: Record<string, any>) {
  // This would integrate with your analytics service
  console.log(`[ANALYTICS] Success Event:`, {
    type,
    timestamp: new Date().toISOString(),
    context
  });
  
  // Example: Send to analytics service
  // analytics.track('success_event', { type, ...context });
}

/**
 * Enhanced success feedback with progress tracking
 */
export interface ProgressiveSuccessOptions {
  steps: Array<{
    id: string;
    message: string;
    duration?: number;
  }>;
  onComplete?: () => void;
  onStepComplete?: (stepId: string) => void;
}

export function createProgressiveSuccess(
  toast: (options: any) => void,
  options: ProgressiveSuccessOptions
) {
  let currentStep = 0;
  
  const showNextStep = () => {
    if (currentStep >= options.steps.length) {
      options.onComplete?.();
      return;
    }
    
    const step = options.steps[currentStep];
    const isLastStep = currentStep === options.steps.length - 1;
    
    toast({
      title: isLastStep ? 'Complete!' : `Step ${currentStep + 1} of ${options.steps.length}`,
      description: step.message,
      variant: 'default',
      duration: step.duration || (isLastStep ? 4000 : 2000)
    });
    
    options.onStepComplete?.(step.id);
    currentStep++;
    
    if (!isLastStep) {
      setTimeout(showNextStep, step.duration || 2000);
    } else {
      options.onComplete?.();
    }
  };
  
  return { start: showNextStep };
}

/**
 * Success state persistence for better UX
 */
export class SuccessStateManager {
  private successStates = new Map<string, {
    timestamp: number;
    message: string;
    type: SuccessType;
  }>();
  
  private readonly EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
  
  recordSuccess(key: string, type: SuccessType, message: string) {
    this.successStates.set(key, {
      timestamp: Date.now(),
      message,
      type
    });
    
    // Clean up expired states
    this.cleanup();
  }
  
  getRecentSuccess(key: string): { message: string; type: SuccessType } | null {
    const state = this.successStates.get(key);
    if (!state) return null;
    
    if (Date.now() - state.timestamp > this.EXPIRY_TIME) {
      this.successStates.delete(key);
      return null;
    }
    
    return { message: state.message, type: state.type };
  }
  
  hasRecentSuccess(key: string): boolean {
    return this.getRecentSuccess(key) !== null;
  }
  
  clearSuccess(key: string) {
    this.successStates.delete(key);
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, state] of this.successStates.entries()) {
      if (now - state.timestamp > this.EXPIRY_TIME) {
        this.successStates.delete(key);
      }
    }
  }
}

// Global success state manager instance
export const globalSuccessManager = new SuccessStateManager();

/**
 * Enhanced success details with contextual actions
 */
export function getEnhancedSuccessDetails(
  type: SuccessType, 
  context?: Record<string, any>
): SuccessDetails & {
  contextualActions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  showProgress?: boolean;
  autoHide?: boolean;
} {
  const baseDetails = getSuccessDetails(type, context);
  
  switch (type) {
    case SuccessType.REQUEST_SENT:
      return {
        ...baseDetails,
        contextualActions: [
          {
            label: 'View Requests',
            action: () => window.location.href = '/requests',
            variant: 'outline'
          },
          {
            label: 'Browse More Sessions',
            action: () => window.location.href = '/dashboard',
            variant: 'ghost'
          }
        ],
        autoHide: true
      };
      
    case SuccessType.REQUEST_APPROVED:
      return {
        ...baseDetails,
        contextualActions: [
          {
            label: 'View Session',
            action: () => {
              if (context?.topicId) {
                window.location.href = `/session/${context.topicId}`;
              }
            },
            variant: 'default'
          }
        ],
        showProgress: true,
        autoHide: false
      };
      
    case SuccessType.SESSION_CREATED:
      return {
        ...baseDetails,
        contextualActions: [
          {
            label: 'Share Session',
            action: () => {
              // Implement sharing functionality
              navigator.clipboard?.writeText(window.location.origin + '/dashboard');
            },
            variant: 'outline'
          },
          {
            label: 'Create Another',
            action: () => {
              // Trigger session creation dialog
              const event = new CustomEvent('openSessionDialog');
              window.dispatchEvent(event);
            },
            variant: 'ghost'
          }
        ],
        showProgress: false,
        autoHide: true
      };
      
    default:
      return {
        ...baseDetails,
        autoHide: true
      };
  }
}