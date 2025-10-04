"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  SuccessType,
  getSuccessDetails,
  validateSuccessContext,
  trackSuccessEvent,
} from "@/lib/success-utils";

interface UseSuccessFeedbackOptions {
  showToast?: boolean;
  logSuccess?: boolean;
  trackAnalytics?: boolean;
}

export function useSuccessFeedback(options: UseSuccessFeedbackOptions = {}) {
  const {
    showToast = true,
    logSuccess = true,
    trackAnalytics = true,
  } = options;
  const { toast } = useToast();

  const showSuccess = useCallback(
    (type: SuccessType, context?: Record<string, any>) => {
      // Validate context if required
      if (!validateSuccessContext(type, context)) {
        console.warn(
          `[SUCCESS] Invalid context for success type ${type}:`,
          context
        );
      }

      const successDetails = getSuccessDetails(type, context);

      if (logSuccess) {
        console.log(`[SUCCESS] ${successDetails.title}:`, {
          type: successDetails.type,
          message: successDetails.message,
          context,
        });
      }

      if (trackAnalytics) {
        trackSuccessEvent(type, context);
      }

      if (showToast) {
        toast({
          title: successDetails.title,
          description: successDetails.message,
          variant: "default",
          duration: successDetails.duration,
        });
      }

      return successDetails;
    },
    [toast, showToast, logSuccess, trackAnalytics]
  );

  const showRequestSuccess = useCallback(
    (topicId: string, requesterId: string, topicTitle?: string) => {
      return showSuccess(SuccessType.REQUEST_SENT, {
        topicId,
        requesterId,
        topicTitle,
      });
    },
    [showSuccess]
  );

  const showApprovalSuccess = useCallback(
    (
      topicId: string,
      requesterId: string,
      requesterName?: string,
      topicTitle?: string
    ) => {
      return showSuccess(SuccessType.REQUEST_APPROVED, {
        topicId,
        requesterId,
        requesterName,
        topicTitle,
      });
    },
    [showSuccess]
  );

  const showRejectionSuccess = useCallback(
    (topicId: string, requesterId: string, topicTitle?: string) => {
      return showSuccess(SuccessType.REQUEST_REJECTED, {
        topicId,
        requesterId,
        topicTitle,
      });
    },
    [showSuccess]
  );

  const showSessionCreatedSuccess = useCallback(
    (sessionId: string, sessionTitle: string) => {
      return showSuccess(SuccessType.SESSION_CREATED, {
        sessionId,
        sessionTitle,
      });
    },
    [showSuccess]
  );

  const showSessionJoinedSuccess = useCallback(
    (sessionId: string, sessionTitle?: string) => {
      return showSuccess(SuccessType.SESSION_JOINED, {
        sessionId,
        sessionTitle,
      });
    },
    [showSuccess]
  );

  const showProfileUpdatedSuccess = useCallback(
    (userId: string) => {
      return showSuccess(SuccessType.PROFILE_UPDATED, {
        userId,
      });
    },
    [showSuccess]
  );

  return {
    showSuccess,
    showRequestSuccess,
    showApprovalSuccess,
    showRejectionSuccess,
    showSessionCreatedSuccess,
    showSessionJoinedSuccess,
    showProfileUpdatedSuccess,
  };
}

// Specialized hooks for different contexts
export function useRequestSuccessFeedback() {
  const feedback = useSuccessFeedback({
    showToast: true,
    logSuccess: true,
    trackAnalytics: true,
  });

  return {
    showApprovalSuccess: feedback.showApprovalSuccess,
    showRejectionSuccess: feedback.showRejectionSuccess,
    showRequestSuccess: feedback.showRequestSuccess,
  };
}

export function useSessionSuccessFeedback() {
  const feedback = useSuccessFeedback({
    showToast: true,
    logSuccess: true,
    trackAnalytics: true,
  });

  return {
    showSessionCreatedSuccess: feedback.showSessionCreatedSuccess,
    showSessionJoinedSuccess: feedback.showSessionJoinedSuccess,
  };
}

export function useProfileSuccessFeedback() {
  const feedback = useSuccessFeedback({
    showToast: true,
    logSuccess: true,
    trackAnalytics: true,
  });

  return {
    showProfileUpdatedSuccess: feedback.showProfileUpdatedSuccess,
  };
}
