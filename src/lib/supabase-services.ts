import { supabase } from "./supabase";
import { withDatabaseTimeout, DB_TIMEOUTS } from "./timeout-utils";
import {
  parseError,
  withRetry,
  ErrorType,
  logError,
  validateTopicId,
  validateUserId,
  validateMessage,
} from "./error-utils";
import type {
  User,
  UserUpdate,
  Topic,
  TopicInsert,
  TopicUpdate,
  Message,
  MessageInsert,
  Rating,
  RatingInsert,
  TopicWithAuthor,
  MessageWithSender,
  UserRatingStats,
  TopicJoinRequest,
  RatingValue,
  ApiResponse,
  SubscriptionCallback,
} from "./database-types";

// Type-safe wrapper for Supabase operations to work around type inference issues
const typedSupabase = supabase as any;

// Real-time channel type
export type RealtimeChannel = ReturnType<typeof typedSupabase.channel>;

// ============================================================================
// TOPIC SERVICES
// ============================================================================
// Service functions for managing conversation topics/sessions

export const topicService = {
  // Get all topics with author information - with timeout protection
  async getAllTopics(): Promise<TopicWithAuthor[]> {
    try {
      const { data, error } = await withDatabaseTimeout(
        () => typedSupabase
          .from("topics")
          .select(
            `
            *,
            author:users!topics_author_id_fkey(*)
          `
          )
          .order("start_time", { ascending: true }),
        DB_TIMEOUTS.COMPLEX_QUERY
      ) as any;

      if (error) {
        logError("getAllTopics", error);

        if (error.code === "42501") {
          throw new Error("Access denied to topics");
        }
        if (error.code === "PGRST301") {
          throw new Error("Network connection error");
        }

        throw new Error(`Failed to fetch topics: ${error.message}`);
      }

      // Filter out sessions that reached start time without participants
      // These sessions can't proceed and should not be shown on timeline
      const now = new Date();
      const filteredData = (data || []).filter((topic: any) => {
        const startTime = new Date(topic.start_time);
        const hasParticipants = topic.participants && Array.isArray(topic.participants) && topic.participants.length > 0;
        
        // Show if:
        // 1. Session hasn't started yet (regardless of participants)
        // 2. Session has started AND has participants
        // Hide if: Session has started WITHOUT participants
        if (startTime <= now && !hasParticipants) {
          console.log(`🚫 Hiding session "${topic.title}" - started without participants`);
          return false;
        }
        
        return true;
      });

      return filteredData;
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        logError("getAllTopics", error);
        // Return empty array instead of throwing error to prevent UI breakage
        console.warn("Topics loading timed out, returning empty array");
        return [];
      }
      logError("getAllTopics", error);
      throw error;
    }
  },

  // Get a single topic by ID
  async getTopicById(topicId: string): Promise<TopicWithAuthor | null> {
    try {
      const validTopicId = validateTopicId(topicId);

      const { data, error } = await typedSupabase
        .from("topics")
        .select(
          `
          *,
          author:users!topics_author_id_fkey(*)
        `
        )
        .eq("id", validTopicId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Topic not found
        }

        logError("getTopicById", error, { topicId: validTopicId });
        throw new Error(`Failed to fetch topic: ${error.message}`);
      }

      return data as any;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Topic ID is required")
      ) {
        throw error;
      }

      logError("getTopicById", error, { topicId });
      return null;
    }
  },

  // Get topics by user ID (topics authored by user)
  async getTopicsByUserId(userId: string): Promise<TopicWithAuthor[]> {
    const { data, error } = await typedSupabase
      .from("topics")
      .select(
        `
        *,
        author:users!topics_author_id_fkey(*)
      `
      )
      .eq("author_id", userId)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching user topics:", error);
      throw new Error("Failed to fetch user topics");
    }

    return data || [];
  },

  // Get topics where user is a participant
  async getParticipantTopics(userId: string): Promise<TopicWithAuthor[]> {
    const { data, error } = await typedSupabase
      .from("topics")
      .select(
        `
        *,
        author:users!topics_author_id_fkey(*)
      `
      )
      .contains("participants", [userId])
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching participant topics:", error);
      throw new Error("Failed to fetch participant topics");
    }

    return data || [];
  },

  // Create a new topic
  async createTopic(
    topicData: Omit<TopicInsert, "id" | "created_at">
  ): Promise<Topic> {
    // Check for schedule conflicts before creating
    // Authors cannot schedule sessions that overlap with their sessions that have approved participants
    const { checkNewSessionConflict } = await import('./schedule-conflict-detector');
    const conflictCheck = await checkNewSessionConflict(
      topicData.author_id,
      new Date(topicData.start_time),
      new Date(topicData.end_time)
    );
    
    if (!conflictCheck.canApprove) {
      throw new Error(conflictCheck.reason || 'Schedule conflict detected');
    }
    
    const insertData = {
      title: topicData.title,
      description: topicData.description,
      author_id: topicData.author_id,
      start_time: topicData.start_time,
      end_time: topicData.end_time,
      participants: topicData.participants || [],
      requests: topicData.requests || [],
    };

    const { data, error } = await typedSupabase
      .from("topics")
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating topic:", error);
      throw new Error("Failed to create topic");
    }

    return data as any;
  },

  // Update a topic
  async updateTopic(topicId: string, updates: TopicUpdate): Promise<Topic> {
    const { data, error } = await typedSupabase
      .from("topics")
      .update(updates as any)
      .eq("id", topicId)
      .select()
      .single();

    if (error) {
      console.error("Error updating topic:", error);
      throw new Error("Failed to update topic");
    }

    return data as Topic;
  },

  // Add a join request to a topic (using JSONB array in topics table)
  async addJoinRequest(
    topicId: string,
    requesterId: string,
    message?: string
  ): Promise<ApiResponse<void>> {
    try {
      console.log("Adding join request:", { topicId, requesterId, message });

      // Enhanced input validation
      if (
        !topicId ||
        typeof topicId !== "string" ||
        topicId.trim().length === 0
      ) {
        throw new Error("Valid topic ID is required");
      }

      if (
        !requesterId ||
        typeof requesterId !== "string" ||
        requesterId.trim().length === 0
      ) {
        throw new Error("Valid requester ID is required");
      }

      // Get requester info and topic info with better error handling
      const [requesterResult, topicResult] = await Promise.all([
        typedSupabase
          .from("users")
          .select("display_name, first_name, last_name")
          .eq("id", requesterId.trim())
          .single(),
        typedSupabase
          .from("topics")
          .select("id, title, author_id, participants, requests")
          .eq("id", topicId.trim())
          .single(),
      ]);

      if (requesterResult.error) {
        console.error("User fetch error:", requesterResult.error);
        if (requesterResult.error.code === "PGRST116") {
          throw new Error("User profile not found");
        }
        throw new Error("Failed to load user profile");
      }

      if (topicResult.error) {
        console.error("Topic fetch error:", topicResult.error);
        if (topicResult.error.code === "PGRST116") {
          throw new Error("Topic not found");
        }
        if (topicResult.error.code === "42501") {
          throw new Error("Access denied to this topic");
        }
        throw new Error("Failed to load topic information");
      }

      const requester = requesterResult.data;
      const topic = topicResult.data as any;

      if (!requester || !topic) {
        throw new Error("Required data not found");
      }

      // Validate business rules
      if (topic.author_id === requesterId) {
        throw new Error("Cannot request to join your own topic");
      }

      if (topic.participants && topic.participants.includes(requesterId)) {
        throw new Error("You are already a participant in this session");
      }

      // Check for participant request conflicts
      const { checkJoinRequestConflict } = await import('./schedule-conflict-detector');
      const conflictCheck = await checkJoinRequestConflict(topicId, requesterId);
      
      if (!conflictCheck.canApprove) {
        throw new Error(conflictCheck.reason || 'You cannot request to join overlapping sessions');
      }

      // Create requester name with fallback logic
      const requesterName =
        (requester as any).display_name ||
        `${(requester as any).first_name || ""} ${
          (requester as any).last_name || ""
        }`.trim() ||
        "Anonymous User";

      // Validate message length
      const requestMessage = (message || "").trim();
      if (requestMessage.length > 200) {
        throw new Error("Message cannot exceed 200 characters");
      }

      // Get current requests array
      const currentRequests = Array.isArray((topic as any).requests)
        ? (topic as any).requests
        : [];

      // Check if user already has a pending request
      const existingRequestIndex = currentRequests.findIndex(
        (req: any) =>
          req && typeof req === "object" && req.requesterId === requesterId
      );

      // Create new request object
      const newRequest = {
        requesterId,
        requesterName,
        message: requestMessage,
        timestamp: new Date().toISOString(),
      };

      let updatedRequests;
      if (existingRequestIndex >= 0) {
        // Update existing request
        updatedRequests = [...currentRequests];
        updatedRequests[existingRequestIndex] = newRequest;
      } else {
        // Add new request
        updatedRequests = [...currentRequests, newRequest];
      }

      // Update the topic with the new request
      const updateData: TopicUpdate = { requests: updatedRequests };
      const { error: updateError } = await typedSupabase
        .from("topics")
        .update(updateData as any)
        .eq("id", topicId);

      if (updateError) {
        console.error("Update topic error:", updateError);

        // Provide specific error messages based on error codes
        if (updateError.code === "23505") {
          throw new Error("A request with this information already exists");
        }
        if (updateError.code === "42501") {
          throw new Error(
            "You don't have permission to add requests to this topic"
          );
        }
        if (updateError.code === "PGRST116") {
          throw new Error("Topic not found");
        }

        throw new Error(
          `Failed to add join request: ${
            updateError.message || "Unknown database error"
          }`
        );
      }

      // Trigger immediate real-time update broadcast
      const { realtimeManager } = await import("./realtime-manager");
      realtimeManager.forceImmediateUpdate(topicId, "request");

      console.log("Join request added successfully:", {
        topicId,
        requesterId,
        isUpdate: existingRequestIndex >= 0,
      });

      // Send notification to topic author (non-blocking)
      console.log('🔔 [JOIN REQUEST] Preparing to send notification to author:', topic.author_id);
      try {
        const { notificationService } = await import("./notification-service");

        // Get author email for enhanced notification
        console.log('📧 [JOIN REQUEST] Fetching author email...');
        const { data: authorData, error: emailError } = await typedSupabase
          .from("users")
          .select("email")
          .eq("id", topic.author_id)
          .single();

        if (emailError) {
          console.error('❌ [JOIN REQUEST] Error fetching author email:', emailError);
        }

        console.log('📧 [JOIN REQUEST] Author data:', {
          hasEmail: !!authorData?.email,
          email: authorData?.email ? `${authorData.email.substring(0, 3)}***` : 'none',
        });

        if (authorData?.email) {
          // Send enhanced notification with email
          console.log('📧 [JOIN REQUEST] Sending enhanced notification with email...');
          await notificationService.notifyNewJoinRequestWithEmail(
            topic.author_id,
            authorData.email,
            requesterName,
            topic.title,
            topic.description,
            requestMessage
          );
          console.log('✅ [JOIN REQUEST] Enhanced notification sent successfully');
        } else {
          // Fallback to in-app only
          console.log('⚠️ [JOIN REQUEST] No email found, sending in-app notification only');
          await notificationService.notifyNewJoinRequest(
            topic.author_id,
            requesterName,
            topic.title
          );
        }
      } catch (notificationError) {
        console.error(
          "❌ [JOIN REQUEST] Failed to send join request notification:",
          notificationError
        );
        console.error("❌ [JOIN REQUEST] Notification error details:", {
          message: notificationError instanceof Error ? notificationError.message : 'Unknown error',
          stack: notificationError instanceof Error ? notificationError.stack : undefined,
        });
        // Don't fail the request if notification fails
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error adding join request:", errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  },

  // Get join requests for topics authored by the user (received requests)
  async getReceivedJoinRequests(userId: string): Promise<any[]> {
    const startTime = Date.now();
    try {
      // Validate input
      if (!userId) {
        console.error(
          "[SECURITY] getReceivedJoinRequests: User ID is required"
        );
        return [];
      }

      console.log(
        `[SECURITY] getReceivedJoinRequests: Fetching received requests for user ${userId}`
      );

      // SECURE: Only fetch topics authored by this user (database-level filtering)
      // This ensures users can only see requests for topics they own
      const { data: topics, error } = (await typedSupabase
        .from("topics")
        .select(
          `
          id, title, description, start_time, end_time, requests,
          author:users!topics_author_id_fkey(id, display_name, avatar_url)
        `
        )
        .eq("author_id", userId)) as { data: any[] | null; error: any }; // CRITICAL: Database-level filtering by ownership

      if (error) {
        console.error(
          "[SECURITY] Error fetching user topics for received requests:",
          error
        );
        return [];
      }

      if (!topics) {
        console.log(`[SECURITY] No topics found for user ${userId}`);
        return [];
      }

      console.log(
        `[SECURITY] Found ${topics.length} topics authored by user ${userId}`
      );

      // Convert JSONB requests to the expected format with validation
      const receivedRequests: any[] = [];
      let totalRequestsProcessed = 0;
      let invalidRequestsSkipped = 0;

      for (const topic of topics) {
        // Skip topics that have reached start time (past sessions)
        // Requests for past sessions should not be shown
        const topicStartTime = new Date(topic.start_time);
        if (topicStartTime <= new Date()) {
          console.log(`[SECURITY] Skipping past session: ${topic.title}`);
          continue;
        }

        // Ensure requests is a valid array
        if (
          !(topic as any).requests ||
          !Array.isArray((topic as any).requests)
        ) {
          continue;
        }

        totalRequestsProcessed += (topic as any).requests.length;

        for (const request of (topic as any).requests) {
          // Validate request structure more thoroughly
          if (
            !request ||
            typeof request !== "object" ||
            !request.requesterId ||
            !request.requesterName ||
            typeof request.requesterId !== "string" ||
            typeof request.requesterName !== "string"
          ) {
            console.warn(
              "[SECURITY] Invalid request structure found:",
              request
            );
            invalidRequestsSkipped++;
            continue;
          }

          // Additional security check: Ensure requester is not the topic author
          if (request.requesterId === userId) {
            console.warn(
              `[SECURITY] Skipping self-request found in topic ${topic.id}`
            );
            invalidRequestsSkipped++;
            continue;
          }

          try {
            receivedRequests.push({
              id: `${topic.id}-${request.requesterId}`,
              topic_id: topic.id,
              requester_id: request.requesterId,
              requester_name: request.requesterName,
              message: request.message || "",
              status: "pending",
              created_at: request.timestamp || new Date().toISOString(),
              topic: {
                id: topic.id,
                title: topic.title,
                description: topic.description,
                start_time: topic.start_time,
                end_time: topic.end_time,
                author: topic.author,
              },
            });
          } catch (requestError) {
            console.error(
              "[SECURITY] Error processing request:",
              requestError,
              request
            );
            invalidRequestsSkipped++;
            continue;
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[SECURITY] getReceivedJoinRequests completed for user ${userId}:`,
        {
          topicsChecked: topics.length,
          totalRequestsProcessed,
          validRequestsReturned: receivedRequests.length,
          invalidRequestsSkipped,
          durationMs: duration,
        }
      );

      return receivedRequests;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[SECURITY] Error in getReceivedJoinRequests for user ${userId}:`,
        {
          error: error instanceof Error ? error.message : error,
          durationMs: duration,
        }
      );
      return [];
    }
  },

  // Get join requests sent by the user (only their own sent requests)
  async getSentJoinRequests(userId: string): Promise<any[]> {
    const startTime = Date.now();
    try {
      // Validate input
      if (!userId) {
        console.error("[SECURITY] getSentJoinRequests: User ID is required");
        return [];
      }

      console.log(
        `[SECURITY] getSentJoinRequests: Fetching sent requests for user ${userId}`
      );

      // SECURITY IMPROVEMENT: Use a more targeted approach to minimize data exposure
      // Instead of fetching all topics and filtering client-side, we use database functions
      // to filter at the database level using JSONB operations

      // SECURE: Only get topics where the user has made a request (database-level filtering)
      // This uses PostgreSQL JSONB operations to filter at the database level
      const { data: topics, error } = (await typedSupabase
        .from("topics")
        .select(
          `
          id, title, description, start_time, end_time, requests,
          author:users!topics_author_id_fkey(id, display_name, avatar_url)
        `
        )
        .neq("author_id", userId) // Can't send requests to own topics
        .not("requests", "is", null) // Only topics with requests
        .filter(
          "requests",
          "cs",
          JSON.stringify([{ requesterId: userId }])
        )) as { data: any[] | null; error: any }; // JSONB contains operation

      // If the JSONB filter doesn't work as expected, fall back to a safer approach
      if (error && error.message.includes("cs")) {
        console.log(
          "[SECURITY] JSONB filter not supported, using safer fallback approach"
        );

        // Fallback: Get only a limited set of topics and filter more carefully
        const { data: fallbackTopics, error: fallbackError } =
          (await typedSupabase
            .from("topics")
            .select(
              `
            id, title, description, start_time, end_time, requests,
            author:users!topics_author_id_fkey(id, display_name, avatar_url)
          `
            )
            .neq("author_id", userId)
            .not("requests", "is", null)
            .limit(100)) as { data: any[] | null; error: any }; // Limit to prevent excessive data exposure

        if (fallbackError) {
          console.error(
            "[SECURITY] Error fetching topics for sent requests (fallback):",
            fallbackError
          );
          return [];
        }

        // Filter client-side but with strict validation and logging
        const filteredTopics = (fallbackTopics || []).filter((topic) => {
          if (
            !(topic as any).requests ||
            !Array.isArray((topic as any).requests)
          ) {
            return false;
          }

          return (topic as any).requests.some(
            (req: any) =>
              req && typeof req === "object" && req.requesterId === userId
          );
        });

        console.log(
          `[SECURITY] Fallback filtering: ${
            fallbackTopics?.length || 0
          } topics checked, ${filteredTopics.length} contain user requests`
        );

        return this.processSentRequestsFromTopics(
          userId,
          filteredTopics,
          startTime
        );
      }

      if (error) {
        console.error(
          "[SECURITY] Error fetching topics for sent requests:",
          error
        );
        return [];
      }

      if (!topics) {
        console.log(
          `[SECURITY] No topics found with sent requests by user ${userId}`
        );
        return [];
      }

      console.log(
        `[SECURITY] Found ${topics.length} topics with potential requests from user ${userId}`
      );

      return this.processSentRequestsFromTopics(userId, topics, startTime);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[SECURITY] Error in getSentJoinRequests for user ${userId}:`,
        {
          error: error instanceof Error ? error.message : error,
          durationMs: duration,
        }
      );
      return [];
    }
  },

  // Helper method to process sent requests from topics (extracted for reuse)
  processSentRequestsFromTopics(
    userId: string,
    topics: any[],
    startTime: number
  ): any[] {
    const sentRequests: any[] = [];
    let topicsProcessed = 0;
    let requestsFound = 0;
    let invalidRequestsSkipped = 0;

    for (const topic of topics) {
      topicsProcessed++;

      // Ensure requests is a valid array
      if (!(topic as any).requests || !Array.isArray((topic as any).requests)) {
        continue;
      }

      // Find this user's request in the topic (with strict validation)
      const userRequest = (topic as any).requests.find(
        (req: any) =>
          req &&
          typeof req === "object" &&
          req.requesterId === userId &&
          typeof req.requesterId === "string"
      );

      if (userRequest) {
        requestsFound++;

        // Validate request structure more thoroughly
        if (
          !userRequest.requesterName ||
          typeof userRequest.requesterName !== "string"
        ) {
          console.warn(
            "[SECURITY] Invalid sent request structure found:",
            userRequest
          );
          invalidRequestsSkipped++;
          continue;
        }

        // Additional security check: Ensure this is not a request to own topic
        if (topic.author_id === userId) {
          console.warn(`[SECURITY] Skipping request to own topic ${topic.id}`);
          invalidRequestsSkipped++;
          continue;
        }

        try {
          sentRequests.push({
            id: `${topic.id}-${userId}`,
            topic_id: topic.id,
            requester_id: userId,
            requester_name: userRequest.requesterName,
            message: userRequest.message || "",
            status: "pending",
            created_at: userRequest.timestamp || new Date().toISOString(),
            topic: {
              id: topic.id,
              title: topic.title,
              description: topic.description,
              start_time: topic.start_time,
              end_time: topic.end_time,
              author: topic.author,
            },
          });
        } catch (requestError) {
          console.error(
            "[SECURITY] Error processing sent request:",
            requestError,
            userRequest
          );
          invalidRequestsSkipped++;
          continue;
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[SECURITY] getSentJoinRequests completed for user ${userId}:`,
      {
        topicsProcessed,
        requestsFound,
        validRequestsReturned: sentRequests.length,
        invalidRequestsSkipped,
        durationMs: duration,
      }
    );

    return sentRequests;
  },

  // Approve a join request (using JSONB array in topics table)
  async approveJoinRequest(
    topicId: string,
    requesterId: string
  ): Promise<ApiResponse<void>> {
    try {
      console.log("Approving join request:", { topicId, requesterId });

      // Validate input parameters
      if (!topicId || !requesterId) {
        throw new Error("Topic ID and requester ID are required");
      }

      // Check for schedule conflicts before approving
      const { checkScheduleConflict } = await import('./schedule-conflict-detector');
      const conflictCheck = await checkScheduleConflict(topicId, requesterId);
      
      if (!conflictCheck.canApprove) {
        throw new Error(conflictCheck.reason || 'Schedule conflict detected');
      }

      // Get the topic info (with RLS ensuring only author can access)
      const { data: topic, error: fetchError } = await typedSupabase
        .from("topics")
        .select("id, title, author_id, participants, requests, start_time, end_time")
        .eq("id", topicId)
        .single();

      if (fetchError) {
        console.error("Topic fetch error:", fetchError);
        throw new Error("Topic not found or access denied");
      }

      if (!topic) {
        throw new Error("Topic not found");
      }

      // Get current requests and participants
      const currentRequests = Array.isArray((topic as any).requests)
        ? (topic as any).requests
        : [];
      const currentParticipants = Array.isArray((topic as any).participants)
        ? (topic as any).participants
        : [];

      // Find the specific request
      const requestIndex = currentRequests.findIndex(
        (req: any) =>
          req && typeof req === "object" && req.requesterId === requesterId
      );

      if (requestIndex === -1) {
        throw new Error("Join request not found");
      }

      // Check if user is already a participant
      if (currentParticipants.includes(requesterId)) {
        throw new Error("User is already a participant");
      }

      // Check if session already has a participant (only 1 participant allowed)
      if (currentParticipants.length >= 1) {
        throw new Error("This session already has a participant");
      }

      // Add user to participants and clear all requests
      const updatedParticipants = [...currentParticipants, requesterId];
      const updatedRequests: any[] = []; // Clear all requests when one is approved

      // Update the topic
      const updateData: TopicUpdate = {
        participants: updatedParticipants,
        requests: updatedRequests,
      };
      const { error: updateError } = await typedSupabase
        .from("topics")
        .update(updateData as any)
        .eq("id", topicId);

      if (updateError) {
        console.error("Update topic error:", updateError);
        throw new Error(`Failed to approve request: ${updateError.message}`);
      }

      // Trigger immediate real-time update broadcast
      const { realtimeManager } = await import("./realtime-manager");
      realtimeManager.forceImmediateUpdate(topicId, "participant");

      console.log("Join request approved successfully:", {
        topicId,
        requesterId,
        requestsCleared: currentRequests.length,
        newParticipantCount: updatedParticipants.length,
      });

      // Send notifications (non-blocking)
      try {
        const { notificationService } = await import("./notification-service");

        // Get user emails for enhanced notifications
        const { data: usersData } = await typedSupabase
          .from("users")
          .select("id, email, display_name")
          .in("id", [requesterId, topic.author_id]);

        const requesterUser = usersData?.find((u: any) => u.id === requesterId);
        const approverUser = usersData?.find(
          (u: any) => u.id === topic.author_id
        );

        if (requesterUser?.email && approverUser?.email && topic.start_time && topic.end_time) {
          // Send enhanced approval notification with emails
          await notificationService.notifyRequestApprovedWithEmail(
            requesterId,
            requesterUser.email,
            topic.author_id,
            approverUser.email,
            approverUser.display_name || "Host",
            (topic as any).title,
            new Date(topic.start_time),
            new Date(topic.end_time),
            topicId
          );
        } else {
          // Fallback to in-app only
          await notificationService.notifyRequestApproved(
            requesterId,
            (topic as any).title
          );
        }

        // Also notify other requesters that their requests were automatically rejected
        const otherRequesters = currentRequests.filter(
          (req: any) =>
            req && typeof req === "object" && req.requesterId !== requesterId
        );

        if (otherRequesters.length > 0) {
          // Get emails for other requesters
          const otherRequesterIds = otherRequesters.map(
            (req: any) => req.requesterId
          );
          const { data: otherUsersData } = await typedSupabase
            .from("users")
            .select("id, email")
            .in("id", otherRequesterIds);

          for (const otherReq of otherRequesters) {
            if (otherReq.requesterId) {
              const otherUser = otherUsersData?.find(
                (u: any) => u.id === otherReq.requesterId
              );

              if (otherUser?.email) {
                // Send enhanced rejection notification with email
                await notificationService.notifyRequestRejectedWithEmail(
                  otherReq.requesterId,
                  otherUser.email,
                  (topic as any).title
                );
              } else {
                // Fallback to in-app only
                await notificationService.notifyRequestRejected(
                  otherReq.requesterId,
                  (topic as any).title
                );
              }
            }
          }
        }
      } catch (notificationError) {
        console.error("Failed to send notifications:", notificationError);
        // Don't fail the approval if notification fails
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error approving join request:", errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  },

  // Reject a join request (using JSONB array in topics table)
  async rejectJoinRequest(
    topicId: string,
    requesterId: string
  ): Promise<ApiResponse<void>> {
    try {
      console.log("Rejecting join request:", { topicId, requesterId });

      // Validate input parameters
      if (!topicId || !requesterId) {
        throw new Error("Topic ID and requester ID are required");
      }

      // Get the topic info (with RLS ensuring only author can access for rejection, or user can access their own)
      const { data: topic, error: fetchError } = await typedSupabase
        .from("topics")
        .select("id, title, author_id, requests")
        .eq("id", topicId)
        .single();

      if (fetchError) {
        console.error("Topic fetch error:", fetchError);
        throw new Error("Topic not found or access denied");
      }

      if (!topic) {
        throw new Error("Topic not found");
      }

      // Get current requests
      const currentRequests = Array.isArray((topic as any).requests)
        ? (topic as any).requests
        : [];

      // Find the specific request
      const requestIndex = currentRequests.findIndex(
        (req: any) =>
          req && typeof req === "object" && req.requesterId === requesterId
      );

      if (requestIndex === -1) {
        throw new Error("Join request not found");
      }

      // Remove the specific request
      const updatedRequests = currentRequests.filter(
        (req: any) =>
          !(req && typeof req === "object" && req.requesterId === requesterId)
      );

      // Update the topic
      const updateData: TopicUpdate = { requests: updatedRequests };
      const { error: updateError } = await typedSupabase
        .from("topics")
        .update(updateData as any)
        .eq("id", topicId);

      if (updateError) {
        console.error("Update topic error:", updateError);
        throw new Error(`Failed to reject request: ${updateError.message}`);
      }

      // Trigger immediate real-time update broadcast
      const { realtimeManager } = await import("./realtime-manager");
      realtimeManager.forceImmediateUpdate(topicId, "request");

      console.log("Join request rejected successfully:", {
        topicId,
        requesterId,
        previousRequestsCount: currentRequests.length,
        newRequestsCount: updatedRequests.length,
      });

      // Send notification to the rejected user (non-blocking)
      try {
        const { notificationService } = await import("./notification-service");

        // Get requester email for enhanced notification
        const { data: requesterData } = await typedSupabase
          .from("users")
          .select("email")
          .eq("id", requesterId)
          .single();

        if (requesterData?.email) {
          // Send enhanced rejection notification with email
          await notificationService.notifyRequestRejectedWithEmail(
            requesterId,
            requesterData.email,
            (topic as any).title
          );
        } else {
          // Fallback to in-app only
          await notificationService.notifyRequestRejected(
            requesterId,
            (topic as any).title
          );
        }
      } catch (notificationError) {
        console.error(
          "Failed to send rejection notification:",
          notificationError
        );
        // Don't fail the rejection if notification fails
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error rejecting join request:", errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  },

  // Cancel a sent join request (for users to withdraw their own requests)
  async cancelJoinRequest(
    topicId: string,
    requesterId: string
  ): Promise<ApiResponse<void>> {
    try {
      console.log("Canceling join request:", { topicId, requesterId });

      // Validate input parameters
      if (!topicId || !requesterId) {
        throw new Error("Topic ID and requester ID are required");
      }

      // Get the topic info (user should be able to access any topic to cancel their own request)
      const { data: topic, error: fetchError } = await typedSupabase
        .from("topics")
        .select("id, title, author_id, requests")
        .eq("id", topicId)
        .single();

      if (fetchError) {
        console.error("Topic fetch error:", fetchError);
        throw new Error("Topic not found");
      }

      if (!topic) {
        throw new Error("Topic not found");
      }

      // Get current requests
      const currentRequests = Array.isArray((topic as any).requests)
        ? (topic as any).requests
        : [];

      // Find the user's specific request
      const requestIndex = currentRequests.findIndex(
        (req: any) =>
          req && typeof req === "object" && req.requesterId === requesterId
      );

      if (requestIndex === -1) {
        throw new Error("Your join request was not found");
      }

      // Remove the user's request
      const updatedRequests = currentRequests.filter(
        (req: any) =>
          !(req && typeof req === "object" && req.requesterId === requesterId)
      );

      // Update the topic
      const updateData: TopicUpdate = { requests: updatedRequests };
      const { error: updateError } = await typedSupabase
        .from("topics")
        .update(updateData as any)
        .eq("id", topicId);

      if (updateError) {
        console.error("Update topic error:", updateError);
        throw new Error(`Failed to cancel request: ${updateError.message}`);
      }

      // Trigger immediate real-time update broadcast
      const { realtimeManager } = await import("./realtime-manager");
      realtimeManager.forceImmediateUpdate(topicId, "request");

      console.log("Join request canceled successfully:", {
        topicId,
        requesterId,
        previousRequestsCount: currentRequests.length,
        newRequestsCount: updatedRequests.length,
      });

      // Send cancellation notification to topic author (non-blocking)
      try {
        const { notificationService } = await import("./notification-service");

        // Get author email and requester name for enhanced notification
        const [authorResult, requesterResult] = await Promise.all([
          typedSupabase
            .from("users")
            .select("email")
            .eq("id", topic.author_id)
            .single(),
          typedSupabase
            .from("users")
            .select("display_name, first_name, last_name")
            .eq("id", requesterId)
            .single(),
        ]);

        if (authorResult.data?.email && requesterResult.data) {
          const requesterName =
            requesterResult.data.display_name ||
            `${requesterResult.data.first_name || ""} ${
              requesterResult.data.last_name || ""
            }`.trim() ||
            "A user";

          // Send enhanced cancellation notification with email
          await notificationService.notifyRequestCancelledWithEmail(
            authorResult.data.email,
            requesterName,
            (topic as any).title
          );
        }
      } catch (notificationError) {
        console.error(
          "Failed to send cancellation notification:",
          notificationError
        );
        // Don't fail the cancellation if notification fails
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error canceling join request:", errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  },

  // Delete a topic
  async deleteTopic(topicId: string): Promise<void> {
    const { error } = await supabase.from("topics").delete().eq("id", topicId);

    if (error) {
      console.error("Error deleting topic:", error);
      throw new Error("Failed to delete topic");
    }
  },

  // Check if a session should start (has at least 2 participants)
  async canSessionStart(topicId: string): Promise<boolean> {
    try {
      const { data: topic, error } = await typedSupabase
        .from("topics")
        .select("participants")
        .eq("id", topicId)
        .single();

      if (error || !topic) {
        return false;
      }

      return ((topic as any).participants?.length || 0) >= 2;
    } catch (error) {
      console.error("Error checking session start eligibility:", error);
      return false;
    }
  },

  // Get archived sessions for a user (sessions they authored or participated in)
  async getArchivedSessions(userId: string): Promise<any[]> {
    try {
      if (!userId) {
        console.error("getArchivedSessions: User ID is required");
        return [];
      }

      // Fetch archived sessions without FK join (Supabase can't see auth.users FK)
      const { data, error } = await typedSupabase
        .from("topics_archive")
        .select(`
          id, title, description, author_id, start_time, end_time,
          participants, created_at, archived_at, archive_reason
        `)
        .order("archived_at", { ascending: false });

      if (error) {
        console.error("Error fetching archived sessions:", error);
        return [];
      }

      // Filter for user's sessions
      const filtered = (data || []).filter(session => 
        session.author_id === userId || 
        (session.participants && session.participants.includes(userId))
      );

      // Manually fetch author details (batch query)
      const authorIds = [...new Set(filtered.map(s => s.author_id))];
      const { data: authors } = await typedSupabase
        .from("users")
        .select("id, display_name, avatar_url, first_name, last_name, email")
        .in("id", authorIds);

      // Map authors to sessions
      const authorsMap = new Map(authors?.map(a => [a.id, a]) || []);
      const withAuthors = filtered.map(session => ({
        ...session,
        author: authorsMap.get(session.author_id)
      }));

      console.log(`📦 [ARCHIVE] Found ${withAuthors.length} archived sessions for user ${userId}`);
      return withAuthors;
    } catch (error) {
      console.error("Error in getArchivedSessions:", error);
      return [];
    }
  },

  // Manually archive a session (for cancellations)
  async archiveSession(topicId: string, reason: string = "cancelled"): Promise<ApiResponse> {
    try {
      const validTopicId = validateTopicId(topicId);

      const { data, error } = await typedSupabase
        .rpc("archive_session", {
          p_topic_id: validTopicId,
          p_reason: reason,
        });

      if (error) {
        console.error("Error archiving session:", error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error in archiveSession:", errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  },
};

// ============================================================================
// MESSAGE SERVICES
// ============================================================================
// Service functions for managing real-time chat messages

export const messageService = {
  // Get messages for a topic
  async getTopicMessages(topicId: string): Promise<MessageWithSender[]> {
    const { data, error } = await typedSupabase
      .from("messages")
      .select(
        `
        *,
        sender:users!messages_sender_id_fkey(*)
      `
      )
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw new Error("Failed to fetch messages");
    }

    return data || [];
  },

  // Send a message with security validation
  async sendMessage(
    messageData: Omit<MessageInsert, "id" | "created_at">
  ): Promise<Message> {
    try {
      console.log('MessageService.sendMessage called with:', messageData);
      
      // Validate message data
      if (!messageData.topic_id || !messageData.sender_id || !messageData.text?.trim()) {
        console.error('Invalid message data:', messageData);
        throw new Error("Invalid message data");
      }

      console.log('Checking topic permissions...');
      // Check if user has permission to send messages in this topic
      const { data: topic, error: topicError } = await typedSupabase
        .from("topics")
        .select("author_id, participants")
        .eq("id", messageData.topic_id)
        .single();

      if (topicError) {
        console.error("Error checking topic permissions:", topicError);
        throw new Error(`Session not found or access denied: ${topicError.message}`);
      }

      console.log('Topic data retrieved:', topic);

      // Verify user is either author or approved participant
      const isAuthor = topic.author_id === messageData.sender_id;
      const isParticipant = topic.participants?.includes(messageData.sender_id) || false;

      console.log('Permission check:', {
        authorId: topic.author_id,
        senderId: messageData.sender_id,
        participants: topic.participants,
        isAuthor,
        isParticipant
      });

      if (!isAuthor && !isParticipant) {
        console.error('Permission denied for message sending');
        throw new Error("You don't have permission to send messages in this session");
      }

      console.log('Inserting message into database...');
      // Send the message
      const { data, error } = await typedSupabase
        .from("messages")
        .insert({
          topic_id: messageData.topic_id,
          sender_id: messageData.sender_id,
          text: messageData.text.trim()
        })
        .select()
        .single();

      if (error) {
        console.error("Database error sending message:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to send message: ${error.message}`);
      }

      console.log('Message sent successfully:', data);
      return data as Message;
    } catch (error) {
      console.error("Message sending error:", error);
      throw error;
    }
  },

  // Subscribe to new messages for a topic
  subscribeToMessages(
    topicId: string,
    callback: SubscriptionCallback<MessageWithSender>
  ): RealtimeChannel {
    return typedSupabase
      .channel(`topic-${topicId}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `topic_id=eq.${topicId}`,
        },
        async (payload: any) => {
          // Fetch the full message with sender info
          const { data } = await typedSupabase
            .from("messages")
            .select(
              `
              *,
              sender:users!messages_sender_id_fkey(*)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            callback({
              eventType: "INSERT",
              new: data as MessageWithSender,
              old: null,
            });
          }
        }
      )
      .subscribe();
  },
};

// ============================================================================
// USER SERVICES
// ============================================================================
// Service functions for managing user profiles and data

export const userService = {
  // Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await typedSupabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data as any;
  },

  // Update user profile
  async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    try {
      const { data, error } = await typedSupabase
        .from("users")
        .update(updates as any)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);

        // Provide more specific error messages
        if (error.message.includes("Failed to fetch")) {
          throw new Error(
            "Network connection error. Please check your internet connection and try again."
          );
        } else if (error.message.includes("JWT")) {
          throw new Error(
            "Session expired. Please refresh the page and try again."
          );
        } else if (error.code === "PGRST116") {
          throw new Error(
            "User not found. Please refresh the page and try again."
          );
        } else {
          throw new Error(`Failed to update profile: ${error.message}`);
        }
      }

      return data as any;
    } catch (error: any) {
      console.error("Error updating user profile:", error);

      // Handle network errors specifically
      if (
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      ) {
        throw new Error(
          "Network connection error. Please check your internet connection and try again."
        );
      }

      // Re-throw if it's already a formatted error
      if (
        error.message.startsWith("Network connection error") ||
        error.message.startsWith("Session expired") ||
        error.message.startsWith("User not found")
      ) {
        throw error;
      }

      throw new Error(
        `Failed to update user profile: ${
          error.message || error
        }. Please try again.`
      );
    }
  },

  // Upload profile picture
  async uploadProfilePicture(userId: string, file: File): Promise<string> {
    try {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Please upload a JPEG, PNG, or WebP image."
        );
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        throw new Error(
          "File too large. Please upload an image smaller than 2MB."
        );
      }

      // Generate unique filename (just the filename, not the path)
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      const { data: userData } = await typedSupabase
        .from("users")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if ((userData as any)?.avatar_url) {
        // Extract filename from URL and delete old file
        const urlParts = (userData as any).avatar_url.split("/");
        const oldFileName = urlParts[urlParts.length - 1];
        if (oldFileName && oldFileName.includes(userId)) {
          await supabase.storage.from("avatars").remove([oldFileName]);
        }
      }

      // Upload new file (fileName only, not avatars/fileName)
      const { data: uploadData, error: uploadError } =
        await typedSupabase.storage.from("avatars").upload(fileName, file, {
          cacheControl: "3600",
          upsert: true, // Allow overwriting
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = typedSupabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL for uploaded image");
      }

      // Update user profile with new avatar URL
      const updateData: UserUpdate = { avatar_url: urlData.publicUrl };
      const { error: updateError } = await typedSupabase
        .from("users")
        .update(updateData as any)
        .eq("id", userId);

      if (updateError) {
        // If database update fails, clean up uploaded file
        await supabase.storage.from("avatars").remove([fileName]);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  },

  // Delete profile picture
  async deleteProfilePicture(userId: string): Promise<void> {
    try {
      // Get current avatar URL
      const { data: userData, error: fetchError } = await typedSupabase
        .from("users")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch user data: ${fetchError.message}`);
      }

      if ((userData as any)?.avatar_url) {
        // Extract filename from URL
        const urlParts = (userData as any).avatar_url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        if (fileName && fileName.includes(userId)) {
          // Delete file from storage (just filename, not avatars/filename)
          const { error: deleteError } = await typedSupabase.storage
            .from("avatars")
            .remove([fileName]);

          if (deleteError) {
            console.warn("Failed to delete file from storage:", deleteError);
          }
        }

        // Update user profile to remove avatar URL
        const updateData: UserUpdate = { avatar_url: null };
        const { error: updateError } = await typedSupabase
          .from("users")
          .update(updateData as any)
          .eq("id", userId);

        if (updateError) {
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      throw error;
    }
  },

  // Send phone verification code
  async sendPhoneVerification(phoneNumber: string): Promise<void> {
    try {
      // Clean phone number (remove spaces, dashes, parentheses)
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");

      const { error } = await typedSupabase.auth.signInWithOtp({
        phone: cleanPhone,
      });

      if (error) {
        throw new Error(`Failed to send verification code: ${error.message}`);
      }
    } catch (error) {
      console.error("Error sending phone verification:", error);
      throw error;
    }
  },

  // Verify phone number with code
  async verifyPhoneNumber(
    phoneNumber: string,
    code: string,
    userId: string
  ): Promise<void> {
    try {
      // Clean phone number
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");

      const { error } = await typedSupabase.auth.verifyOtp({
        phone: cleanPhone,
        token: code,
        type: "sms",
      });

      if (error) {
        throw new Error(`Verification failed: ${error.message}`);
      }

      // Update user profile to mark phone as verified
      const updateData: UserUpdate = {
        phone_number: cleanPhone,
        phone_verified: true,
      };
      const { error: updateError } = await typedSupabase
        .from("users")
        .update(updateData as any)
        .eq("id", userId);

      if (updateError) {
        throw new Error(
          `Failed to update phone verification status: ${updateError.message}`
        );
      }
    } catch (error) {
      console.error("Error verifying phone number:", error);
      throw error;
    }
  },

  // Get user ratings with statistics
  async getUserRatings(userId: string): Promise<UserRatingStats | null> {
    const { data, error } = await typedSupabase
      .from("ratings")
      .select(
        "politeness, relevance, problem_solved, communication, professionalism"
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user ratings:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        user_id: userId,
        total_ratings: 0,
        average_politeness: 0,
        average_relevance: 0,
        average_problem_solved: 0,
        average_communication: 0,
        average_professionalism: 0,
        overall_average: 0,
      };
    }

    // Calculate averages
    const totals = data.reduce(
      (
        acc: {
          politeness: number;
          relevance: number;
          problem_solved: number;
          communication: number;
          professionalism: number;
        },
        rating: any
      ) => ({
        politeness: acc.politeness + rating.politeness,
        relevance: acc.relevance + rating.relevance,
        problem_solved: acc.problem_solved + rating.problem_solved,
        communication: acc.communication + rating.communication,
        professionalism: acc.professionalism + rating.professionalism,
      }),
      {
        politeness: 0,
        relevance: 0,
        problem_solved: 0,
        communication: 0,
        professionalism: 0,
      }
    );

    const count = data.length;
    const averages = {
      average_politeness: totals.politeness / count,
      average_relevance: totals.relevance / count,
      average_problem_solved: totals.problem_solved / count,
      average_communication: totals.communication / count,
      average_professionalism: totals.professionalism / count,
    };

    const overall_average =
      Object.values(averages).reduce((sum, avg) => sum + avg, 0) / 5;

    return {
      user_id: userId,
      total_ratings: count,
      ...averages,
      overall_average,
    };
  },

  // Get user statistics for public profile
  async getUserStats(userId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    sessionsHosted: number;
    sessionsJoined: number;
  }> {
    try {
      // Get rating statistics
      const ratingStats = await this.getUserRatings(userId);

      // Get sessions hosted (where user is author)
      const { data: hostedSessions, error: hostedError } = await typedSupabase
        .from("topics")
        .select("id")
        .eq("author_id", userId);

      if (hostedError) {
        console.error("Error fetching hosted sessions:", hostedError);
      }

      // Get sessions joined (where user is in participants but not author)
      const { data: joinedSessions, error: joinedError } = await typedSupabase
        .from("topics")
        .select("id, author_id, participants")
        .contains("participants", [userId]);

      if (joinedError) {
        console.error("Error fetching joined sessions:", joinedError);
      }

      // Filter out sessions where user is the author (to avoid double counting)
      const actuallyJoined =
        joinedSessions?.filter(
          (session: any) => session.author_id !== userId
        ) || [];

      return {
        averageRating: ratingStats?.overall_average || 0,
        totalReviews: ratingStats?.total_ratings || 0,
        sessionsHosted: hostedSessions?.length || 0,
        sessionsJoined: actuallyJoined.length || 0,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return {
        averageRating: 0,
        totalReviews: 0,
        sessionsHosted: 0,
        sessionsJoined: 0,
      };
    }
  },
};

// ============================================================================
// RATING SERVICES
// ============================================================================
// Service functions for managing user ratings and feedback

export const ratingService = {
  // Submit a rating for a user
  async submitRating(
    ratingData: Omit<RatingInsert, "id" | "created_at">
  ): Promise<ApiResponse<Rating>> {
    try {
      // Validate rating values
      const ratingValues: RatingValue[] = [
        ratingData.politeness,
        ratingData.relevance,
        ratingData.problem_solved,
        ratingData.communication,
        ratingData.professionalism,
      ];

      const invalidRatings = ratingValues.filter(
        (value) => value < 1 || value > 5
      );
      if (invalidRatings.length > 0) {
        throw new Error("All ratings must be between 1 and 5");
      }

      // Check if rating already exists
      const { data: existingRating } = await typedSupabase
        .from("ratings")
        .select("id")
        .eq("user_id", ratingData.user_id)
        .eq("rater_id", ratingData.rater_id)
        .eq("topic_id", ratingData.topic_id)
        .single();

      if (existingRating) {
        throw new Error("You have already rated this user for this session");
      }

      const { data, error } = await typedSupabase
        .from("ratings")
        .insert(ratingData as any)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit rating: ${error.message}`);
      }

      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error submitting rating:", errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  },

  // Get ratings for a specific topic
  async getTopicRatings(topicId: string): Promise<Rating[]> {
    const { data, error } = await typedSupabase
      .from("ratings")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching topic ratings:", error);
      throw new Error("Failed to fetch topic ratings");
    }

    return data || [];
  },

  // Check if user can rate another user for a specific topic
  async canUserRate(
    raterId: string,
    userId: string,
    topicId: string
  ): Promise<boolean> {
    try {
      // Check if both users participated in the topic
      const { data: topic, error: topicError } = await typedSupabase
        .from("topics")
        .select("participants, author_id")
        .eq("id", topicId)
        .single();

      if (topicError || !topic) {
        return false;
      }

      const allParticipants = [
        (topic as any).author_id,
        ...((topic as any).participants || []),
      ];
      const raterParticipated = allParticipants.includes(raterId);
      const userParticipated = allParticipants.includes(userId);

      if (!raterParticipated || !userParticipated || raterId === userId) {
        return false;
      }

      // Check if rating already exists
      const { data: existingRating } = await typedSupabase
        .from("ratings")
        .select("id")
        .eq("user_id", userId)
        .eq("rater_id", raterId)
        .eq("topic_id", topicId)
        .single();

      return !existingRating;
    } catch (error) {
      console.error("Error checking rating eligibility:", error);
      return false;
    }
  },
};

// ============================================================================
// REAL-TIME SERVICES
// ============================================================================
// Service functions for managing real-time subscriptions

export const realtimeService = {
  // Subscribe to topic changes
  subscribeToTopic(
    topicId: string,
    callback: SubscriptionCallback<Topic>
  ): RealtimeChannel {
    return typedSupabase
      .channel(`topic-${topicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "topics",
          filter: `id=eq.${topicId}`,
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: payload.new as Topic | null,
            old: payload.old as Topic | null,
          });
        }
      )
      .subscribe();
  },

  // Subscribe to all topics changes
  subscribeToAllTopics(callback: SubscriptionCallback<Topic>): RealtimeChannel {
    return typedSupabase
      .channel("all-topics")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "topics",
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: payload.new as Topic | null,
            old: payload.old as Topic | null,
          });
        }
      )
      .subscribe();
  },

  // Unsubscribe from a channel
  unsubscribe(channel: RealtimeChannel): void {
    typedSupabase.removeChannel(channel);
  },

  // Subscribe to user profile changes
  subscribeToUserProfile(
    userId: string,
    callback: SubscriptionCallback<User>
  ): RealtimeChannel {
    return typedSupabase
      .channel(`user-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: payload.new as User | null,
            old: payload.old as User | null,
          });
        }
      )
      .subscribe();
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
// Helper functions for common database operations

export const dbUtils = {
  // Check if user exists
  async userExists(userId: string): Promise<boolean> {
    const { data, error } = await typedSupabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    return !error && !!data;
  },

  // Check if topic exists
  async topicExists(topicId: string): Promise<boolean> {
    const { data, error } = await typedSupabase
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .single();

    return !error && !!data;
  },

  // Get topic participant count
  async getTopicParticipantCount(topicId: string): Promise<number> {
    const { data, error } = await typedSupabase
      .from("topics")
      .select("participants, author_id")
      .eq("id", topicId)
      .single();

    if (error || !data) {
      return 0;
    }

    // Type assertion to ensure TypeScript knows the structure
    const topic = data as { participants: string[] | null; author_id: string };
    return (topic.participants?.length || 0) + 1; // +1 for author
  },

  // Get topic message count
  async getTopicMessageCount(topicId: string): Promise<number> {
    const { count, error } = await typedSupabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("topic_id", topicId);

    return error ? 0 : count || 0;
  },

  // Check if user is topic participant
  async isTopicParticipant(userId: string, topicId: string): Promise<boolean> {
    const { data, error } = await typedSupabase
      .from("topics")
      .select("participants, author_id")
      .eq("id", topicId)
      .single();

    if (error || !data) {
      return false;
    }

    // Type assertion to ensure TypeScript knows the structure
    const topic = data as { participants: string[] | null; author_id: string };
    return (
      topic.author_id === userId || (topic.participants || []).includes(userId)
    );
  },

  // Format user display name
  formatUserDisplayName(user: User): string {
    if (user.display_name) {
      return user.display_name;
    }

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    if (fullName) {
      return fullName;
    }

    return user.email.split("@")[0] || "Anonymous User";
  },

  // Validate rating values
  isValidRating(value: number): value is RatingValue {
    return Number.isInteger(value) && value >= 1 && value <= 5;
  },

  // Calculate time until topic starts
  getTimeUntilTopicStart(topic: Topic): number {
    return new Date(topic.start_time).getTime() - Date.now();
  },

  // Check if topic is currently active (within time window) AND has enough participants
  isTopicActive(topic: Topic): boolean {
    const now = Date.now();
    const startTime = new Date(topic.start_time).getTime();
    const endTime = new Date(topic.end_time).getTime();

    // Must be within time window (session has started and not ended)
    const isWithinTimeWindow = now >= startTime && now <= endTime;

    // Must have exactly 2 participants (author + 1 approved participant)
    const approvedParticipants = topic.participants?.length || 0;
    const totalParticipants = approvedParticipants + 1; // +1 for author
    const hasEnoughParticipants = totalParticipants === 2;

    return isWithinTimeWindow && hasEnoughParticipants;
  },

  // Check if topic is ready (has enough participants) but not started yet
  isTopicReady(topic: Topic): boolean {
    const now = Date.now();
    const startTime = new Date(topic.start_time).getTime();

    // Must be before start time
    const isBeforeStart = now < startTime;

    // Must have exactly 2 participants (author + 1 approved participant)
    const approvedParticipants = topic.participants?.length || 0;
    const totalParticipants = approvedParticipants + 1; // +1 for author
    const hasEnoughParticipants = totalParticipants === 2;

    return isBeforeStart && hasEnoughParticipants;
  },

  // Check if topic has ended
  hasTopicEnded(topic: Topic): boolean {
    return Date.now() > new Date(topic.end_time).getTime();
  },

  // Check if user can join an active session (must be author or approved participant)
  canUserJoinSession(topic: Topic, userId: string): boolean {
    const isAuthor = topic.author_id === userId;
    const isApprovedParticipant = topic.participants?.includes(userId) || false;
    return isAuthor || isApprovedParticipant;
  },

  // Get total participant count for display (author + approved participants)
  getTotalParticipantCount(topic: Topic): number {
    const approvedParticipants = topic.participants?.length || 0;
    return approvedParticipants + 1; // +1 for author
  },

  // Check if topic needs cleanup (session time passed without enough participants)
  needsCleanup(topic: Topic): boolean {
    const now = Date.now();
    const endTime = new Date(topic.end_time).getTime();
    const totalParticipants = this.getTotalParticipantCount(topic);

    // Session has ended and never had exactly 2 participants
    return now > endTime && totalParticipants !== 2;
  },

  // Clean up topics that ended without enough participants
  async cleanupExpiredTopics(): Promise<void> {
    try {
      const { data: topics, error } = await typedSupabase
        .from("topics")
        .select("*")
        .lt("end_time", new Date().toISOString());

      if (error) throw error;

      if (topics && topics.length > 0) {
        // Type assertion to ensure TypeScript knows the structure
        const typedTopics = topics as Topic[];
        const topicsToCleanup = typedTopics.filter((topic) =>
          this.needsCleanup(topic)
        );

        if (topicsToCleanup.length > 0) {
          const topicIds = topicsToCleanup.map((t) => t.id);

          // Delete expired topics that never had participants
          const { error: deleteError } = await typedSupabase
            .from("topics")
            .delete()
            .in("id", topicIds);

          if (deleteError) throw deleteError;

          console.log(
            `Cleaned up ${topicIds.length} expired topics without participants`
          );
        }
      }
    } catch (error) {
      console.error("Error cleaning up expired topics:", error);
    }
  },
};

// ============================================================================
// ERROR HANDLING
// ============================================================================
// Centralized error handling for database operations

export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = "DatabaseError";
  }
}

export const handleDatabaseError = (error: any, operation: string): never => {
  console.error(`Database error in ${operation}:`, error);

  if (error.code) {
    throw new DatabaseError(
      `Database operation failed: ${error.message}`,
      error.code,
      error.details
    );
  }

  throw new DatabaseError(`Failed to ${operation}: ${error.message}`);
};

// ============================================================================
// TYPE GUARDS
// ============================================================================
// Runtime type checking functions

export const isValidUser = (obj: any): obj is User => {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.email === "string" &&
    typeof obj.created_at === "string"
  );
};

export const isValidTopic = (obj: any): obj is Topic => {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.description === "string" &&
    typeof obj.author_id === "string" &&
    typeof obj.start_time === "string" &&
    typeof obj.end_time === "string" &&
    Array.isArray(obj.participants)
  );
};

export const isValidMessage = (obj: any): obj is Message => {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.topic_id === "string" &&
    typeof obj.sender_id === "string" &&
    typeof obj.text === "string" &&
    typeof obj.created_at === "string"
  );
};

export const isValidRatingValue = (value: any): value is RatingValue => {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
};
