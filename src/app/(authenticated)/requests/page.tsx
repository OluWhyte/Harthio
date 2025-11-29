"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useOptimizedRequests } from "@/hooks/use-optimized-requests";
import { useRealtimeTopics } from "@/hooks/use-realtime-topics";
import { useToast } from "@/hooks/use-toast";
import { topicService } from "@/lib/supabase-services";
import { formatSessionTimeRange } from "@/lib/time-utils";
import {
  Check,
  X,
  Clock,
  Users,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  User,
} from "lucide-react";
import { useRequestErrorHandler } from "@/hooks/use-error-handler";
import { ErrorType, validateTopicId, validateUserId } from "@/lib/error-utils";
import { useRequestSuccessFeedback } from "@/hooks/use-success-feedback";
import { RequestErrorBoundary } from "@/components/common/error-boundary";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { 
  validateApprovalPreconditions, 
  checkNetworkConnectivity, 
  runPreflightChecks,
  createValidationContext
} from "@/lib/error-prevention";
import { OperationFeedback } from "@/components/common/enhanced-form-validation";

interface JoinRequest {
  id: string;
  topic_id: string;
  requester_id: string;
  requester_name: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  topic: {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    author?: {
      id: string;
      display_name: string;
      avatar_url?: string;
    };
  };
}

function RequestsPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [isOnline, setIsOnline] = useState(true);
  const {
    handleError,
    executeWithRetry,
    retry,
    isRetrying,
    hasError,
    clearError,
  } = useRequestErrorHandler();
  const { showApprovalSuccess, showRejectionSuccess } =
    useRequestSuccessFeedback();

  // Use optimized requests hook with caching and real-time updates
  const {
    receivedRequests,
    sentRequests,
    isLoading: loading,
    error: requestsError,
    refresh: refreshRequests,
    performanceMetrics,
  } = useOptimizedRequests({
    enableCache: true,
    enableRealtime: true,
    refreshInterval: 2 * 60 * 1000, // 2 minutes
  });

  // Optimized real-time updates - prevent excessive refreshes
  const lastUpdateRef = useRef<number>(0);
  
  const handleTopicUpdate = useCallback(
    (updatedTopic: any, oldTopic: any) => {
      // Prevent rapid successive updates
      const now = Date.now();
      if (now - lastUpdateRef.current < 1000) {
        console.log("Skipping update - too soon after last update");
        return;
      }
      
      // Check if requests or participants changed
      const requestsChanged =
        JSON.stringify(oldTopic?.requests || []) !==
        JSON.stringify(updatedTopic?.requests || []);
      const participantsChanged =
        JSON.stringify(oldTopic?.participants || []) !==
        JSON.stringify(updatedTopic?.participants || []);

      if (requestsChanged || participantsChanged) {
        console.log("Request-related changes detected, refreshing requests...");
        lastUpdateRef.current = now;
        // Debounced refresh to prevent excessive calls
        setTimeout(() => refreshRequests(true), 500);
      }
    },
    [refreshRequests]
  );

  const handleTopicDelete = useCallback(
    (topicId: string) => {
      console.log("Topic deleted, refreshing requests...");
      // Debounced refresh for deletions
      setTimeout(() => refreshRequests(true), 300);
    },
    [refreshRequests]
  );

  // Optimized real-time subscriptions - reduced frequency
  const { connectionStatus } = useRealtimeTopics({
    onTopicUpdate: handleTopicUpdate,
    onTopicDelete: handleTopicDelete,
    debounceMs: 800, // Increased debounce for requests page
    enableUserUpdates: false,
    enableRequestUpdates: false, // Disable duplicate subscriptions
    immediateRequestUpdates: false, // Disable immediate updates
  });

  // Wrapper function for compatibility with existing code
  const loadRequests = useCallback(() => {
    console.log("Refreshing requests with optimized hook");
    return refreshRequests(true); // Force refresh
  }, [refreshRequests]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleApproveRequest = async (topicId: string, requesterId: string) => {
    const actionKey = `approve-${topicId}-${requesterId}`;

    try {
      // Validate inputs
      const validTopicId = validateTopicId(topicId);
      const validRequesterId = validateUserId(requesterId);

      // Find the request and topic for validation
      const request = receivedRequests.find(
        (r) => r.topic_id === validTopicId && r.requester_id === validRequesterId
      );
      
      if (!request) {
        throw new Error("Request not found - it may have already been processed");
      }

      // Check for schedule conflicts first
      const { checkScheduleConflict } = await import('@/lib/schedule-conflict-detector');
      const conflictCheck = await checkScheduleConflict(validTopicId, validRequesterId);
      
      if (!conflictCheck.canApprove) {
        throw new Error(conflictCheck.reason || 'Schedule conflict detected');
      }

      // Run comprehensive pre-flight checks
      const validationContext = createValidationContext(user, request.topic, request);
      const preflightChecks = [
        () => checkNetworkConnectivity(),
        () => validateApprovalPreconditions(validTopicId, validRequesterId, request.topic, user?.uid || '')
      ];
      
      const validationResult = runPreflightChecks(preflightChecks);
      
      if (!validationResult.canProceed) {
        throw new Error(validationResult.primaryBlocker || "Cannot approve request");
      }

      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
      console.log("Approving request:", {
        topicId: validTopicId,
        requesterId: validRequesterId,
        validationWarnings: validationResult.warnings
      });

      const result = await executeWithRetry(
        () => topicService.approveJoinRequest(validTopicId, validRequesterId),
        "approveRequest",
        ErrorType.NETWORK
      );

      if (result.success) {
        showApprovalSuccess(
          validTopicId,
          validRequesterId,
          request?.requester_name,
          request?.topic?.title
        );
        // Refresh to get updated data
        await loadRequests();
      } else {
        throw new Error(result.error || "Failed to approve request");
      }
    } catch (error) {
      await loadRequests();

      handleError(error, {
        topicId,
        requesterId,
        operation: "approveRequest",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRejectRequest = async (topicId: string, requesterId: string) => {
    const actionKey = `reject-${topicId}-${requesterId}`;

    try {
      // Validate inputs
      const validTopicId = validateTopicId(topicId);
      const validRequesterId = validateUserId(requesterId);

      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
      console.log("Rejecting request:", {
        topicId: validTopicId,
        requesterId: validRequesterId,
      });

      const result = await executeWithRetry(
        () => topicService.rejectJoinRequest(validTopicId, validRequesterId),
        "rejectRequest",
        ErrorType.NETWORK
      );

      if (result.success) {
        // Find the request to get topic title
        const request = receivedRequests.find(
          (r) =>
            r.topic_id === validTopicId && r.requester_id === validRequesterId
        );
        showRejectionSuccess(
          validTopicId,
          validRequesterId,
          request?.topic?.title
        );
        // Refresh to get updated data
        await loadRequests();
      } else {
        throw new Error(result.error || "Failed to reject request");
      }
    } catch (error) {
      await loadRequests();

      handleError(error, {
        topicId,
        requesterId,
        operation: "rejectRequest",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleCancelRequest = async (topicId: string, requesterId: string) => {
    const actionKey = `cancel-${topicId}-${requesterId}`;

    try {
      // Validate inputs
      const validTopicId = validateTopicId(topicId);
      const validRequesterId = validateUserId(requesterId);

      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
      console.log("Canceling request:", {
        topicId: validTopicId,
        requesterId: validRequesterId,
      });

      const result = await executeWithRetry(
        () => topicService.cancelJoinRequest(validTopicId, validRequesterId),
        "cancelRequest",
        ErrorType.NETWORK
      );

      if (result.success) {
        // Show generic success for cancellation
        toast({
          title: "Request Canceled",
          description: "Your join request has been withdrawn.",
        });
        // Refresh to get updated data
        await loadRequests();
      } else {
        throw new Error(result.error || "Failed to cancel request");
      }
    } catch (error) {
      await loadRequests();

      handleError(error, {
        topicId,
        requesterId,
        operation: "cancelRequest",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="md" text="Loading requests..." fullScreen={false} />
          {!isOnline && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-destructive">
              <WifiOff className="h-4 w-4" />
              <span>You appear to be offline</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page header - same on mobile and desktop */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto max-w-4xl px-6 py-4">
          <h1 className="text-2xl font-bold">Requests</h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            Manage session join requests
          </p>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="container mx-auto max-w-4xl">
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-3 mb-2">
          <TabsTrigger value="received" className="text-[15px]">
            Received
            {receivedRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                {receivedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="text-[15px]">
            Sent
            {sentRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                {sentRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

          <TabsContent value="received" className="mt-0 px-4 pb-20 md:pb-6">
            <div className="space-y-2.5">
              {receivedRequests.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-[15px] text-muted-foreground">No pending requests</p>
                </div>
              ) : (
                receivedRequests.map((request) => (
                  <div key={request.id} className="bg-card border rounded-lg p-3 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9 flex-shrink-0 bg-background border border-border">
                        <AvatarFallback className="bg-background">
                          <User className="h-4 w-4 text-accent" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium truncate">
                          {request.requester_name}
                        </p>
                        <p className="text-[13px] text-muted-foreground truncate">
                          {request.topic.title}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {formatSessionTimeRange(
                        new Date(request.topic.start_time),
                        new Date(request.topic.end_time)
                      )}
                    </Badge>
                    
                    {request.message && (
                      <p className="text-[13px] text-muted-foreground bg-muted/50 p-2 rounded-md leading-relaxed">
                        "{request.message}"
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-1 justify-end">
                      <Button
                        size="sm"
                        className="md:px-3"
                        onClick={() =>
                          handleApproveRequest(
                            request.topic_id,
                            request.requester_id
                          )
                        }
                        disabled={
                          actionLoading[
                            `approve-${request.topic_id}-${request.requester_id}`
                          ] ||
                          actionLoading[
                            `reject-${request.topic_id}-${request.requester_id}`
                          ]
                        }
                      >
                        {actionLoading[
                          `approve-${request.topic_id}-${request.requester_id}`
                        ] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="md:px-3"
                        onClick={() =>
                          handleRejectRequest(
                            request.topic_id,
                            request.requester_id
                          )
                        }
                        disabled={
                          actionLoading[
                            `reject-${request.topic_id}-${request.requester_id}`
                          ] ||
                          actionLoading[
                            `approve-${request.topic_id}-${request.requester_id}`
                          ]
                        }
                      >
                        {actionLoading[
                          `reject-${request.topic_id}-${request.requester_id}`
                        ] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5 mr-1" />
                            Decline
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent" className="mt-0 px-4 pb-20 md:pb-6">
            <div className="space-y-2.5">
              {sentRequests.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-[15px] text-muted-foreground">No sent requests</p>
                </div>
              ) : (
                sentRequests.map((request) => (
                  <div key={request.id} className="bg-card border rounded-lg p-3 space-y-2">
                    <div>
                      <p className="text-[15px] font-medium truncate">
                        {request.topic.title}
                      </p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        Host: {request.topic.author?.display_name || "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                        {formatSessionTimeRange(
                          new Date(request.topic.start_time),
                          new Date(request.topic.end_time)
                        )}
                      </Badge>
                      <Badge 
                        variant={request.status === "pending" ? "outline" : request.status === "approved" ? "default" : "destructive"}
                        className="text-[10px] px-2 py-0.5 capitalize"
                      >
                        {request.status}
                      </Badge>
                    </div>
                    {request.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleCancelRequest(
                            request.topic_id,
                            request.requester_id
                          )
                        }
                        disabled={
                          actionLoading[
                            `cancel-${request.topic_id}-${request.requester_id}`
                          ]
                        }
                      >
                        {actionLoading[
                          `cancel-${request.topic_id}-${request.requester_id}`
                        ] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Cancel Request
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <RequestErrorBoundary>
      <RequestsPageContent />
    </RequestErrorBoundary>
  );
}
