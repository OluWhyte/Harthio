/**
 * Notifications Page - Unified Feed
 * 
 * Shows all user notifications in a single chronological feed:
 * - Session join requests (incoming)
 * - Request status updates (approved/declined)
 * - AI alerts (pattern detection, reminders) - FUTURE
 * - Milestones (tracker achievements) - FUTURE
 * - System announcements - FUTURE
 * 
 * SECURITY NOTES:
 * ✅ Protected by (authenticated) route group
 * ✅ Requires user login to access
 * ✅ All data filtered by user.uid via RLS policies
 * ✅ Users can only see their own notifications
 * ✅ No cross-user data leakage possible
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOptimizedRequests } from "@/hooks/use-optimized-requests";
import { useToast } from "@/hooks/use-toast";
import { topicService } from "@/lib/supabase-services";
import { formatSessionTimeRange } from "@/lib/time-utils";
import {
  Check,
  X,
  Loader2,
  Bell,
  MessageCircle,
  PartyPopper,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from "lucide-react";
import { MobilePageHeader } from "@/components/harthio/mobile-page-header";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'session_request' | 'ai_alert' | 'milestone' | 'request_status' | 'system';
  icon: any;
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
  actionButtons?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
    loading?: boolean;
  }[];
  data?: any;
}

/**
 * Notifications Page
 * 
 * SECURITY:
 * - Protected by (authenticated) route group - requires login
 * - useOptimizedRequests hook filters data by user.uid automatically
 * - receivedRequests: Only shows requests for sessions YOU created (RLS: author_id = auth.uid())
 * - sentRequests: Only shows requests YOU sent (RLS: requester_id = auth.uid())
 * - All database queries use Row Level Security (RLS) policies
 * - No user can see another user's notifications
 * 
 * FUTURE AI NOTIFICATIONS:
 * - Will be stored in notifications table with user_id column
 * - RLS policy: user_id = auth.uid()
 * - Each user only sees their own AI alerts, milestones, system messages
 */
export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // SECURITY: This hook automatically filters by current user
  // - receivedRequests: WHERE topic.author_id = user.uid (your sessions)
  // - sentRequests: WHERE requester_id = user.uid (your requests)
  const {
    receivedRequests,
    sentRequests,
    isLoading: loading,
    refresh: refreshRequests,
  } = useOptimizedRequests({
    enableCache: true,
    enableRealtime: true,
  });

  // Convert requests to notifications
  useEffect(() => {
    const allNotifications: Notification[] = [];

    // Add received session requests
    receivedRequests.forEach((request) => {
      allNotifications.push({
        id: `request-${request.id}`,
        type: 'session_request',
        icon: Avatar,
        title: `${request.requester_name} wants to join`,
        message: request.topic.title,
        timestamp: new Date(request.created_at),
        read: false,
        data: request,
        actionButtons: [
          {
            label: 'Approve',
            onClick: () => handleApproveRequest(request.topic_id, request.requester_id),
            variant: 'default',
            loading: actionLoading[`approve-${request.topic_id}-${request.requester_id}`],
          },
          {
            label: 'Decline',
            onClick: () => handleRejectRequest(request.topic_id, request.requester_id),
            variant: 'outline',
            loading: actionLoading[`reject-${request.topic_id}-${request.requester_id}`],
          },
        ],
      });
    });

    // Add sent request status updates
    sentRequests.forEach((request) => {
      if (request.status === 'approved') {
        allNotifications.push({
          id: `status-${request.id}`,
          type: 'request_status',
          icon: CheckCircle,
          title: 'Request approved!',
          message: `Your request to join "${request.topic.title}" was approved`,
          timestamp: new Date(request.created_at),
          read: false,
          data: request,
        });
      } else if (request.status === 'rejected') {
        allNotifications.push({
          id: `status-${request.id}`,
          type: 'request_status',
          icon: XCircle,
          title: 'Request declined',
          message: `Your request to join "${request.topic.title}" was declined`,
          timestamp: new Date(request.created_at),
          read: false,
          data: request,
        });
      }
    });

    // Sort by timestamp (most recent first)
    allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setNotifications(allNotifications);
  }, [receivedRequests, sentRequests, actionLoading]);

  const handleApproveRequest = async (topicId: string, requesterId: string) => {
    const actionKey = `approve-${topicId}-${requesterId}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const result = await topicService.approveJoinRequest(topicId, requesterId);
      if (result.success) {
        toast({
          title: 'Request approved!',
          description: 'The user has been added to the session.',
        });
        await refreshRequests(true);
      } else {
        throw new Error(result.error || 'Failed to approve request');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRejectRequest = async (topicId: string, requesterId: string) => {
    const actionKey = `reject-${topicId}-${requesterId}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const result = await topicService.rejectJoinRequest(topicId, requesterId);
      if (result.success) {
        toast({
          title: 'Request declined',
          description: 'The request has been declined.',
        });
        await refreshRequests(true);
      } else {
        throw new Error(result.error || 'Failed to reject request');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobilePageHeader
          actions={[
            {
              icon: Bell,
              onClick: () => {},
              label: 'Notifications',
              badge: 0,
            },
          ]}
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Mobile Header */}
      <MobilePageHeader
        actions={[
          {
            icon: X,
            onClick: () => router.back(),
            label: 'Close',
          },
        ]}
      />

      {/* Desktop Header */}
      <div className="hidden md:block border-b bg-background sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            Stay updated with your activity
          </p>
        </div>
      </div>

      {/* Unified Notification Feed */}
      <div className="max-w-4xl mx-auto px-6 py-6 pb-20 md:pb-6">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-[17px] font-semibold mb-2">You're all caught up!</h3>
            <p className="text-[15px] text-muted-foreground">
              New notifications will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-card border rounded-lg p-4 ${
                  !notification.read ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon/Avatar */}
                  <div className="flex-shrink-0">
                    {notification.type === 'session_request' && notification.data ? (
                      <Avatar className="h-10 w-10 bg-background border border-border">
                        <AvatarFallback className="bg-background">
                          <User className="h-5 w-5 text-accent" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {notification.type === 'ai_alert' && <MessageCircle className="h-5 w-5 text-primary" />}
                        {notification.type === 'milestone' && <PartyPopper className="h-5 w-5 text-primary" />}
                        {notification.type === 'request_status' && notification.data?.status === 'approved' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {notification.type === 'request_status' && notification.data?.status === 'rejected' && (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        {notification.type === 'system' && <Bell className="h-5 w-5 text-primary" />}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium mb-1">{notification.title}</p>
                    {notification.message && (
                      <p className="text-[13px] text-muted-foreground mb-2">{notification.message}</p>
                    )}
                    {notification.data?.topic && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 mb-2">
                        {formatSessionTimeRange(
                          new Date(notification.data.topic.start_time),
                          new Date(notification.data.topic.end_time)
                        )}
                      </Badge>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>

                    {/* Action Buttons */}
                    {notification.actionButtons && notification.actionButtons.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {notification.actionButtons.map((button, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant={button.variant || 'default'}
                            onClick={button.onClick}
                            disabled={button.loading}
                            className="h-8 text-xs"
                          >
                            {button.loading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              button.label
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
