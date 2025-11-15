"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Star,
  Calendar,
  Info,
  Clock,
  Wifi,
  AlertTriangle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { TopicErrorBoundary } from "@/components/common/error-boundary";
import { useState, useEffect } from "react";
import { useTopicErrorHandler } from "@/hooks/use-error-handler";
import { ActionLoading } from "@/components/common/loading-states";
import {
  EnhancedValidationFeedback,
  OperationFeedback,
} from "@/components/common/enhanced-form-validation";

import { PublicProfileDialog } from "./public-profile-dialog";
import { RequestToJoinDialog } from "./request-to-join-dialog";
import { formatSessionTimeRange, formatRelativeTime } from "@/lib/time-utils";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TopicAuthor {
  userId: string;
  name: string;
  avatarUrl: string;
  initials: string;
  rating: number;
  reviews: number;
}

interface TopicJoinRequest {
  requesterId: string;
  requesterName: string;
  message: string;
  timestamp: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  author: TopicAuthor;
  createdAt: Date;
  participants: string[];
  requests: TopicJoinRequest[];
}

interface TopicCardProps {
  topic: Topic;
  onUpdateRequest: () => void;
}

function TopicCardContent({ topic, onUpdateRequest }: TopicCardProps) {
  const { isInOngoingSession, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { handleError, executeWithRetry, clearError } = useTopicErrorHandler();
  const timeString = formatSessionTimeRange(topic.startTime, topic.endTime);

  // Optimistic UI state for request status
  const [optimisticRequestSent, setOptimisticRequestSent] = useState(false);

  // Core user state calculations
  const isUserHost = topic.author.userId === user?.uid;
  const isUserParticipant = topic.participants?.includes(user?.uid || "");

  // Check if user has already sent a request (with optimistic update)
  const hasRequested =
    optimisticRequestSent ||
    topic.requests?.some((req) => req.requesterId === user?.uid) ||
    false;

  // Reset optimistic state when topic data changes (after refetch)
  useEffect(() => {
    if (topic.requests?.some((req) => req.requesterId === user?.uid)) {
      setOptimisticRequestSent(false);
    }
  }, [topic.requests, user?.uid]);

  const timeSinceCreation = formatRelativeTime(topic.createdAt);

  // Enhanced update handler with comprehensive error handling and feedback
  const handleUpdateWithFeedback = async () => {
    // Optimistically update the UI immediately
    setOptimisticRequestSent(true);
    setIsUpdating(true);
    setActionError(null);
    setActionSuccess(null);
    clearError();

    try {
      await executeWithRetry(async () => {
        onUpdateRequest();
        return Promise.resolve();
      }, "updateTopicCard");

      // Show success feedback
      setActionSuccess("Request sent successfully");
      setRetryCount(0);

      // Clear success message after 2 seconds
      setTimeout(() => {
        setActionSuccess(null);
        setIsUpdating(false);
      }, 2000);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticRequestSent(false);
      setIsUpdating(false);
      setRetryCount((prev) => prev + 1);

      const errorDetails = handleError(error, {
        topicId: topic.id,
        operation: "updateTopicCard",
        retryCount: retryCount + 1,
      });
      setActionError(errorDetails.message);

      // Auto-clear error after 8 seconds for retryable errors, 5 seconds for others
      const clearDelay = errorDetails.retryable ? 8000 : 5000;
      setTimeout(() => setActionError(null), clearDelay);
    }
  };

  // Retry handler for failed operations
  const handleRetry = async () => {
    await handleUpdateWithFeedback();
  };

  // Clear error handler
  const handleClearError = () => {
    setActionError(null);
    clearError();
  };

  // Calculate total participants (author + approved participants)
  const approvedParticipants = topic.participants?.length || 0;
  const totalParticipants = approvedParticipants + 1; // +1 for author
  const hasEnoughParticipants = totalParticipants === 2; // Need exactly 2 participants (author + 1 approved participant)

  // Session is "full" when we have exactly 2 participants (author + 1 participant)
  const isSessionFull = totalParticipants === 2;

  // Count pending requests for display (only for hosts)
  const pendingRequestCount = topic.requests?.length || 0;

  const handleShareClick = () => {
    try {
      // Validate topic data before sharing
      if (!topic || !topic.id || !topic.title) {
        throw new Error("Invalid session data for sharing");
      }

      toast({
        title: "Coming Soon!",
        description: "The ability to share sessions is on its way.",
      });
    } catch (error) {
      handleError(error, { topicId: topic?.id, operation: "shareSession" });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow w-full">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PublicProfileDialog userId={topic.author.userId}>
              <div className="cursor-pointer">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={topic.author.avatarUrl || undefined}
                    alt={topic.author.name}
                    data-ai-hint="person"
                  />
                  <AvatarFallback>{topic.author.initials}</AvatarFallback>
                </Avatar>
              </div>
            </PublicProfileDialog>
            <div>
              <PublicProfileDialog userId={topic.author.userId}>
                <span className="font-semibold hover:underline cursor-pointer">
                  {topic.author.name}
                </span>
              </PublicProfileDialog>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>
                  {topic.author.rating > 0
                    ? `${topic.author.rating.toFixed(1)}`
                    : "New"}
                </span>
                <span className="text-xs">
                  ({topic.author.reviews} ratings)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>posted {timeSinceCreation}</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold">{topic.title}</h3>

        {/* Enhanced operation feedback */}
        <OperationFeedback
          isLoading={isUpdating}
          error={actionError}
          success={actionSuccess}
          loadingMessage="Updating session..."
          onRetry={handleRetry}
          onDismissError={handleClearError}
          onDismissSuccess={() => setActionSuccess(null)}
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>
              {totalParticipants} participant
              {totalParticipants !== 1 ? "s" : ""}
              {hasEnoughParticipants
                ? " (ready)"
                : " (waiting for 1 more participant)"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{timeString}</span>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="p-0 text-sm hover:no-underline text-accent justify-start gap-1">
              <Info className="w-4 h-4" />
              <span>Read Description</span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 text-muted-foreground">
              {topic.description}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {isUserHost ? (
          // Host view - show "You are hosting this session" and pending request count
          <div className="mt-2 space-y-2">
            <div className="text-sm text-green-600 font-semibold">
              You are hosting this session
            </div>
            {pendingRequestCount > 0 && (
              <div className="text-sm text-primary font-semibold">
                You have {pendingRequestCount} pending request
                {pendingRequestCount > 1 ? "s" : ""}.{" "}
                <Link href="/requests" className="underline">
                  View now
                </Link>
                .
              </div>
            )}
            {/* Show session buttons based on participant count and timing */}
            {hasEnoughParticipants ? (
              <ActionLoading
                isLoading={isUpdating}
                loadingText="Updating session..."
                className="flex gap-2"
                showProgress={retryCount > 0}
                progress={
                  retryCount > 0 ? Math.min(100, (retryCount / 3) * 100) : 0
                }
                error={actionError}
                onRetry={handleRetry}
              >
                {(() => {
                  const now = new Date();
                  const startTime = new Date(topic.startTime);
                  const endTime = new Date(topic.endTime);

                  if (now < startTime) {
                    // Session is upcoming - show status only
                    return (
                      <Button variant="outline" className="flex-1" disabled>
                        Upcoming Session
                      </Button>
                    );
                  } else if (now >= startTime && now <= endTime) {
                    // Session is active - show status only (join via header button)
                    return (
                      <Button variant="outline" className="flex-1" disabled>
                        Session Active
                      </Button>
                    );
                  }
                  // Session has ended - don't show any buttons
                  return null;
                })()}
              </ActionLoading>
            ) : (
              <div className="text-sm text-blue-600 font-medium">
                Session is open for requests - waiting for participants to join
              </div>
            )}
          </div>
        ) : isUserParticipant ? (
          // Participant view - show "You are confirmed for this session" with session buttons
          <div className="mt-2 space-y-2">
            <div className="text-sm text-green-600 font-semibold">
              You are confirmed for this session
            </div>
            {hasEnoughParticipants ? (
              <div className="flex gap-2">
                {(() => {
                  const now = new Date();
                  const startTime = new Date(topic.startTime);
                  const endTime = new Date(topic.endTime);

                  if (now < startTime) {
                    // Session is upcoming - show status only
                    return (
                      <Button variant="outline" className="flex-1" disabled>
                        Upcoming Session
                      </Button>
                    );
                  } else if (now >= startTime && now <= endTime) {
                    // Session is active - show status only (join via header button)
                    return (
                      <Button variant="outline" className="flex-1" disabled>
                        Session Active
                      </Button>
                    );
                  }
                  // Session has ended - don't show any buttons
                  return null;
                })()}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Waiting for participants
              </div>
            )}
          </div>
        ) : (
          // Non-participant view - show appropriate button based on session state and 3-state system
          <div className="mt-2 flex gap-2">
            {(() => {
              const now = new Date();
              const startTime = new Date(topic.startTime);
              const endTime = new Date(topic.endTime);
              
              // If session is active or ended, don't show request button
              if (now >= startTime) {
                return (
                  <Button variant="outline" className="flex-1" disabled>
                    {now <= endTime ? "Session Active" : "Session Ended"}
                  </Button>
                );
              }
              
              // For upcoming sessions in 3-state system:
              // STATE 1: No approved participants - show request button
              // STATE 2: Has approved participants - show "Session Full" (only author and participant can see)
              return (
                <>
                  <RequestToJoinDialog
                    topicId={topic.id}
                    onSuccess={handleUpdateWithFeedback}
                  >
                    <Button
                      className="flex-1"
                      disabled={
                        isInOngoingSession ||
                        hasRequested ||
                        isSessionFull ||
                        isUpdating
                      }
                      variant={hasRequested ? "outline" : "default"}
                    >
                      {isUpdating && <Wifi className="mr-2 h-4 w-4 animate-pulse" />}
                      {isSessionFull
                        ? "Session Full"
                        : hasRequested
                        ? "Request Sent"
                        : "Request to Join"}
                    </Button>
                  </RequestToJoinDialog>
                  <Button variant="outline" onClick={handleShareClick}>
                    Share
                  </Button>
                </>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TopicCard({ topic, onUpdateRequest }: TopicCardProps) {
  return (
    <TopicErrorBoundary>
      <TopicCardContent topic={topic} onUpdateRequest={onUpdateRequest} />
    </TopicErrorBoundary>
  );
}
