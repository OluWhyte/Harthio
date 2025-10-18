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
} from "lucide-react";
import { useRequestErrorHandler } from "@/hooks/use-error-handler";
import { ErrorType, validateTopicId, validateUserId } from "@/lib/error-utils";
import { useRequestSuccessFeedback } from "@/hooks/use-success-feedback";
import { RequestErrorBoundary } from "@/components/common/error-boundary";
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
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading requests...</p>
            {!isOnline && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-destructive">
                <WifiOff className="h-4 w-4" />
                <span>You appear to be offline</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Join Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage requests to join your sessions and track your sent requests.
          </p>
          {!isOnline && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                You're currently offline. Some features may not work properly.
              </p>
            </div>
          )}
          {(hasError || requestsError) && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                There was an error loading your requests. Try refreshing the
                page.
              </p>
            </div>
          )}
          {performanceMetrics && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-4">
              <span>
                Last updated:{" "}
                {performanceMetrics.lastUpdated?.toLocaleTimeString()}
              </span>
              <span>
                Received: {performanceMetrics.receivedCount} | Sent:{" "}
                {performanceMetrics.sentCount}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refreshRequests(true)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          {(hasError || requestsError) && (
            <Button
              variant="outline"
              onClick={() => refreshRequests(true)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {loading ? "Retrying..." : "Retry"}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Received ({receivedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          <div className="space-y-4">
            {receivedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No requests received
                  </h3>
                  <p className="text-muted-foreground">
                    When people request to join your sessions, they'll appear
                    here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              receivedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {request.requester_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {request.requester_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            wants to join "{request.topic.title}"
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested{" "}
                            {new Date(request.created_at).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(request.created_at).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {formatSessionTimeRange(
                          new Date(request.topic.start_time),
                          new Date(request.topic.end_time)
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.message && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Message:</p>
                        <p className="text-sm">{request.message}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
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
                        className="flex items-center gap-2"
                      >
                        {actionLoading[
                          `approve-${request.topic_id}-${request.requester_id}`
                        ] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {actionLoading[
                          `approve-${request.topic_id}-${request.requester_id}`
                        ]
                          ? "Approving..."
                          : "Approve"}
                      </Button>
                      <Button
                        variant="outline"
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
                        className="flex items-center gap-2"
                      >
                        {actionLoading[
                          `reject-${request.topic_id}-${request.requester_id}`
                        ] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        {actionLoading[
                          `reject-${request.topic_id}-${request.requester_id}`
                        ]
                          ? "Declining..."
                          : "Decline"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <div className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No requests sent
                  </h3>
                  <p className="text-muted-foreground">
                    Your requests to join other sessions will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              sentRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {request.topic.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Hosted by{" "}
                          {request.topic.author?.display_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sent{" "}
                          {new Date(request.created_at).toLocaleDateString()} at{" "}
                          {new Date(request.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {formatSessionTimeRange(
                            new Date(request.topic.start_time),
                            new Date(request.topic.end_time)
                          )}
                        </Badge>
                        <Badge
                          variant={
                            request.status === "pending" ? "outline" : "default"
                          }
                          className="ml-2"
                        >
                          {request.status === "pending"
                            ? "Pending"
                            : request.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.message && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">
                          Your message:
                        </p>
                        <p className="text-sm">{request.message}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {request.status === "pending" && (
                        <Button
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
                          className="flex items-center gap-2"
                        >
                          {actionLoading[
                            `cancel-${request.topic_id}-${request.requester_id}`
                          ] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          {actionLoading[
                            `cancel-${request.topic_id}-${request.requester_id}`
                          ]
                            ? "Canceling..."
                            : "Cancel Request"}
                        </Button>
                      )}
                      {request.status !== "pending" && (
                        <p className="text-sm text-muted-foreground">
                          This request has been {request.status}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
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
