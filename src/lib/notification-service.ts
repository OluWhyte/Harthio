// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================
// Service for handling user notifications about session changes

import { supabase } from "./supabase";
import type { Notification, NotificationInsert } from "./database-types";
import { emailService } from "./email-service";
import { formatSessionTimeRange } from "./time-utils";

// Helper functions with explicit typing to avoid TypeScript issues
const notificationsTable = () => (supabase as any).from("notifications");

export const notificationService = {
  // Send notification to a specific user about session cancellation
  async notifySessionCancelled(
    userId: string,
    sessionTitle: string,
    reason: string
  ): Promise<void> {
    try {
      // Validate that userId is provided and is a valid UUID
      if (!userId || typeof userId !== "string") {
        console.error("Invalid userId provided for notification:", userId);
        return;
      }

      // Check if notifications table exists by attempting to query it
      const { error: tableCheckError } = await notificationsTable()
        .select("id")
        .limit(1);

      // If table doesn't exist, skip notification
      if (tableCheckError?.code === "PGRST116") {
        console.warn(
          "Notifications table doesn't exist yet. Skipping notification."
        );
        return;
      }

      const notificationData: NotificationInsert = {
        user_id: userId, // This ensures the notification goes ONLY to this specific user
        title: "Session Cancelled",
        message: `Your session "${sessionTitle}" has been cancelled. Reason: ${reason}`,
        type: "session_cancelled",
        read: false,
      };

      console.log(
        "Sending cancellation notification to user:",
        userId,
        "for session:",
        sessionTitle
      );
      const { error } = await notificationsTable().insert(notificationData);

      if (error) {
        console.error("Error sending cancellation notification:", error);
      } else {
        console.log(
          "Cancellation notification sent successfully to user:",
          userId
        );
      }
    } catch (error) {
      console.error("Failed to send cancellation notification:", error);
    }
  },

  // Send notification to a specific user about request approval
  async notifyRequestApproved(
    userId: string,
    sessionTitle: string
  ): Promise<void> {
    try {
      // Validate that userId is provided and is a valid UUID
      if (!userId || typeof userId !== "string") {
        console.error(
          "Invalid userId provided for approval notification:",
          userId
        );
        return;
      }

      // Check if notifications table exists by attempting to query it
      const { error: tableCheckError } = await notificationsTable()
        .select("id")
        .limit(1);

      // If table doesn't exist, skip notification
      if (tableCheckError?.code === "PGRST116") {
        console.warn(
          "Notifications table doesn't exist yet. Skipping notification."
        );
        return;
      }

      const notificationData: NotificationInsert = {
        user_id: userId, // This ensures the notification goes ONLY to this specific user
        title: "Request Approved!",
        message: `Your request to join "${sessionTitle}" has been approved!`,
        type: "session_approved",
        read: false,
      };

      console.log(
        "Sending approval notification to user:",
        userId,
        "for session:",
        sessionTitle
      );
      const { error } = await notificationsTable().insert(notificationData);

      if (error) {
        console.error("Error sending approval notification:", error);
      } else {
        console.log("Approval notification sent successfully to user:", userId);
      }
    } catch (error) {
      console.error("Failed to send approval notification:", error);
    }
  },

  // Send notification to session author when someone requests to join
  async notifyNewJoinRequest(
    authorId: string,
    requesterName: string,
    sessionTitle: string
  ): Promise<void> {
    try {
      // Validate that authorId is provided and is a valid UUID
      if (!authorId || typeof authorId !== "string") {
        console.error(
          "Invalid authorId provided for join request notification:",
          authorId
        );
        return;
      }

      // Check if notifications table exists by attempting to query it
      const { error: tableCheckError } = await notificationsTable()
        .select("id")
        .limit(1);

      // If table doesn't exist, skip notification
      if (tableCheckError?.code === "PGRST116") {
        console.warn(
          "Notifications table doesn't exist yet. Skipping notification."
        );
        return;
      }

      const notificationData: NotificationInsert = {
        user_id: authorId, // This ensures the notification goes ONLY to the session author
        title: "New Join Request",
        message: `${requesterName} has requested to join your session "${sessionTitle}".`,
        type: "general",
        read: false,
      };

      console.log(
        "Sending join request notification to author:",
        authorId,
        "from requester:",
        requesterName
      );
      const { error } = await notificationsTable().insert(notificationData);

      if (error) {
        console.error("Error sending join request notification:", error);
      } else {
        console.log(
          "Join request notification sent successfully to author:",
          authorId
        );
      }
    } catch (error) {
      console.error("Failed to send join request notification:", error);
    }
  },

  // Get notifications for a specific user (with proper filtering)
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      // Validate that userId is provided
      if (!userId || typeof userId !== "string") {
        console.error(
          "Invalid userId provided for fetching notifications:",
          userId
        );
        return [];
      }

      // Check if notifications table exists
      const { error: tableCheckError } = await notificationsTable()
        .select("id")
        .limit(1);

      // If table doesn't exist, return empty array
      if (tableCheckError?.code === "PGRST116") {
        console.warn(
          "Notifications table doesn't exist yet. Returning empty array."
        );
        return [];
      }

      console.log("Fetching notifications for user:", userId);
      const { data, error } = await notificationsTable()
        .select("*")
        .eq("user_id", userId) // This ensures we only get notifications for THIS specific user
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error(
          "Error fetching notifications for user",
          userId,
          ":",
          error
        );
        return [];
      }

      console.log(`Found ${data?.length || 0} notifications for user:`, userId);
      return data || [];
    } catch (error) {
      console.error(
        "Failed to fetch notifications for user",
        userId,
        ":",
        error
      );
      return [];
    }
  },

  // Send notification to a specific user about request rejection
  async notifyRequestRejected(
    userId: string,
    sessionTitle: string
  ): Promise<void> {
    try {
      // Validate that userId is provided and is a valid UUID
      if (!userId || typeof userId !== "string") {
        console.error(
          "Invalid userId provided for rejection notification:",
          userId
        );
        return;
      }

      // Check if notifications table exists by attempting to query it
      const { error: tableCheckError } = await notificationsTable()
        .select("id")
        .limit(1);

      // If table doesn't exist, skip notification
      if (tableCheckError?.code === "PGRST116") {
        console.warn(
          "Notifications table doesn't exist yet. Skipping notification."
        );
        return;
      }

      const notificationData: NotificationInsert = {
        user_id: userId, // This ensures the notification goes ONLY to this specific user
        title: "Request Declined",
        message: `Your request to join "${sessionTitle}" has been declined.`,
        type: "session_declined",
        read: false,
      };

      console.log(
        "Sending rejection notification to user:",
        userId,
        "for session:",
        sessionTitle
      );
      const { error } = await notificationsTable().insert(notificationData);

      if (error) {
        console.error("Error sending rejection notification:", error);
      } else {
        console.log("Rejection notification sent successfully to user:", userId);
      }
    } catch (error) {
      console.error("Failed to send rejection notification:", error);
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Check if notifications table exists
      const { error: tableCheckError } = await notificationsTable()
        .select("id")
        .limit(1);

      // If table doesn't exist, skip operation
      if (tableCheckError?.code === "PGRST116") {
        console.warn(
          "Notifications table doesn't exist yet. Skipping mark as read."
        );
        return;
      }

      const { error } = await notificationsTable()
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  // Enhanced method: Send new join request notification (in-app + email)
  async notifyNewJoinRequestWithEmail(
    authorId: string,
    authorEmail: string,
    requesterName: string,
    sessionTitle: string,
    sessionDescription?: string,
    requestMessage?: string
  ): Promise<void> {
    console.log('🔔 [JOIN REQUEST EMAIL] Starting notification process:', {
      authorId,
      authorEmail,
      requesterName,
      sessionTitle,
      hasDescription: !!sessionDescription,
      hasMessage: !!requestMessage,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
    });

    try {
      // Send in-app notification
      console.log('📱 [JOIN REQUEST EMAIL] Sending in-app notification...');
      await this.notifyNewJoinRequest(authorId, requesterName, sessionTitle);
      console.log('✅ [JOIN REQUEST EMAIL] In-app notification sent');

      // Send email notification
      console.log('📧 [JOIN REQUEST EMAIL] Calling email service...');
      const emailSent = await emailService.sendNewRequestNotification(authorEmail, {
        requesterName,
        sessionTitle,
        sessionDescription,
        requestMessage,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com',
      });

      if (emailSent) {
        console.log(`✅ [JOIN REQUEST EMAIL] Email notification sent successfully to ${authorEmail}`);
      } else {
        console.error(`❌ [JOIN REQUEST EMAIL] Email service returned false for ${authorEmail}`);
      }
    } catch (error) {
      console.error("❌ [JOIN REQUEST EMAIL] Failed to send enhanced join request notification:", error);
      console.error("❌ [JOIN REQUEST EMAIL] Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Re-throw to see the error in production logs
      throw error;
    }
  },

  // Enhanced method: Send request approval notification (in-app + email to both users)
  async notifyRequestApprovedWithEmail(
    requesterId: string,
    requesterEmail: string,
    approverId: string,
    approverEmail: string,
    approverName: string,
    sessionTitle: string,
    sessionStartTime: Date,
    sessionEndTime: Date,
    sessionId: string
  ): Promise<void> {
    try {
      // Send in-app notification to requester
      await this.notifyRequestApproved(requesterId, sessionTitle);

      // Create session URL
      const sessionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com'}/session/${sessionId}`;
      const sessionTimeString = formatSessionTimeRange(sessionStartTime, sessionEndTime);

      // Send email to requester (User A)
      const requesterEmailSent = await emailService.sendRequestApprovedNotification(requesterEmail, {
        approverName,
        sessionTitle,
        sessionStartTime: sessionTimeString,
        sessionUrl,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com',
      });

      // Send confirmation email to approver (User B)
      const approverEmailSent = await emailService.sendRequestApprovedConfirmation(approverEmail, {
        approverName,
        sessionTitle,
        sessionStartTime: sessionTimeString,
        sessionUrl,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com',
      });

      if (requesterEmailSent) {
        console.log(`Approval email sent to requester: ${requesterEmail}`);
      } else {
        console.warn(`Failed to send approval email to requester: ${requesterEmail}`);
      }

      if (approverEmailSent) {
        console.log(`Confirmation email sent to approver: ${approverEmail}`);
      } else {
        console.warn(`Failed to send confirmation email to approver: ${approverEmail}`);
      }
    } catch (error) {
      console.error("Failed to send enhanced approval notification:", error);
    }
  },

  // Enhanced method: Send request rejection notification (in-app + email)
  async notifyRequestRejectedWithEmail(
    requesterId: string,
    requesterEmail: string,
    sessionTitle: string
  ): Promise<void> {
    try {
      // Send in-app notification
      await this.notifyRequestRejected(requesterId, sessionTitle);

      // Send email notification
      const emailSent = await emailService.sendRequestDeclinedNotification(requesterEmail, {
        sessionTitle,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com',
      });

      if (emailSent) {
        console.log(`Rejection email sent to ${requesterEmail}`);
      } else {
        console.warn(`Failed to send rejection email to ${requesterEmail}`);
      }
    } catch (error) {
      console.error("Failed to send enhanced rejection notification:", error);
    }
  },

  // New method: Send request cancellation notification (email only to recipient)
  async notifyRequestCancelledWithEmail(
    recipientEmail: string,
    requesterName: string,
    sessionTitle: string
  ): Promise<void> {
    try {
      // Send email notification (no in-app notification needed for cancellation)
      const emailSent = await emailService.sendRequestCancelledNotification(recipientEmail, {
        requesterName,
        sessionTitle,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com',
      });

      if (emailSent) {
        console.log(`Cancellation email sent to ${recipientEmail}`);
      } else {
        console.warn(`Failed to send cancellation email to ${recipientEmail}`);
      }
    } catch (error) {
      console.error("Failed to send cancellation notification:", error);
    }
  },
};
