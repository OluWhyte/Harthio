// ============================================================================
// HARTHIO DATABASE TYPES
// ============================================================================
// Comprehensive TypeScript types for the Harthio database schema
// This file provides type definitions that match database-schema.sql v2.0
//
// Usage:
//   import type { User, Topic, Message, Rating } from '@/lib/database-types'
//
// Last updated: 2025-09-22
// ============================================================================

// ============================================================================
// CORE TYPES
// ============================================================================

// Join request structure for topics (JSONB format)
export interface TopicJoinRequest {
  requesterId: string;
  requesterName: string;
  message: string;
  timestamp: string;
}

// Rating constraints (1-5 scale)
export type RatingValue = 1 | 2 | 3 | 4 | 5;

// WebRTC signaling message data types
export interface SignalingMessageData {
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "join"
    | "leave"
    | "user-joined"
    | "user-left";
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  userId?: string;
  userName?: string;
  [key: string]: unknown;
}

// Device and location info types (used in database schema)
export interface DeviceInfo {
  browser: string;
  browser_version: string;
  os: string;
  os_version: string;
  device_type: "desktop" | "mobile" | "tablet";
  device_vendor?: string;
  device_model?: string;
  screen_resolution?: string;
  timezone?: string;
  language?: string;
}

export interface LocationInfo {
  country: string;
  country_code: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

// ============================================================================
// DATABASE SCHEMA TYPES
// ============================================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID, references auth.users(id)
          email: string; // NOT NULL
          display_name: string | null;
          first_name: string | null;
          last_name: string | null;
          headline: string | null;
          phone_number: string | null;
          phone_country_code: string | null; // DEFAULT '+1'
          phone_verified: boolean; // DEFAULT FALSE
          country: string | null;
          avatar_url: string | null;
          created_at: string; // TIMESTAMP WITH TIME ZONE
          updated_at: string; // TIMESTAMP WITH TIME ZONE
        };
        Insert: {
          id: string; // Required - must match auth.users(id)
          email: string; // Required
          display_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          headline?: string | null;
          phone_number?: string | null;
          phone_country_code?: string | null; // DEFAULT '+1'
          phone_verified?: boolean; // DEFAULT FALSE
          country?: string | null;
          avatar_url?: string | null;
          created_at?: string; // Auto-generated if not provided
          updated_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated in practice
          email?: string;
          display_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          headline?: string | null;
          phone_number?: string | null;
          phone_country_code?: string | null;
          phone_verified?: boolean;
          country?: string | null;
          avatar_url?: string | null;
          created_at?: string; // Should not be updated
          updated_at?: string; // Auto-updated by trigger
        };
      };
      topics: {
        Row: {
          id: string; // UUID, auto-generated
          title: string; // NOT NULL
          description: string; // NOT NULL
          author_id: string; // UUID, references users(id), NOT NULL
          start_time: string; // TIMESTAMP WITH TIME ZONE, NOT NULL
          end_time: string; // TIMESTAMP WITH TIME ZONE, NOT NULL
          participants: string[]; // UUID[], defaults to empty array
          requests: TopicJoinRequest[]; // JSONB, defaults to empty array
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          title: string; // Required
          description: string; // Required
          author_id: string; // Required - must be authenticated user
          start_time: string; // Required
          end_time: string; // Required
          participants?: string[]; // Defaults to empty array
          requests?: TopicJoinRequest[]; // Defaults to empty array
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          title?: string;
          description?: string;
          author_id?: string; // Should not be updated after creation
          start_time?: string;
          end_time?: string;
          participants?: string[];
          requests?: TopicJoinRequest[];
          created_at?: string; // Should not be updated
        };
      };
      messages: {
        Row: {
          id: string; // UUID, auto-generated
          topic_id: string; // UUID, references topics(id), NOT NULL
          sender_id: string; // UUID, references users(id), NOT NULL
          text: string; // NOT NULL
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          topic_id: string; // Required
          sender_id: string; // Required - must be authenticated user
          text: string; // Required
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          topic_id?: string; // Should not be updated
          sender_id?: string; // Should not be updated
          text?: string;
          created_at?: string; // Should not be updated
        };
      };
      ratings: {
        Row: {
          id: string; // UUID, auto-generated
          user_id: string; // UUID, references users(id), NOT NULL
          rater_id: string; // UUID, references users(id), NOT NULL
          topic_id: string; // UUID, references topics(id), NOT NULL
          politeness: RatingValue; // 1-5, NOT NULL
          relevance: RatingValue; // 1-5, NOT NULL
          problem_solved: RatingValue; // 1-5, NOT NULL
          communication: RatingValue; // 1-5, NOT NULL
          professionalism: RatingValue; // 1-5, NOT NULL
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          user_id: string; // Required - user being rated
          rater_id: string; // Required - must be authenticated user
          topic_id: string; // Required - must be a session both users participated in
          politeness: RatingValue; // Required, 1-5
          relevance: RatingValue; // Required, 1-5
          problem_solved: RatingValue; // Required, 1-5
          communication: RatingValue; // Required, 1-5
          professionalism: RatingValue; // Required, 1-5
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          user_id?: string; // Should not be updated
          rater_id?: string; // Should not be updated
          topic_id?: string; // Should not be updated
          politeness?: RatingValue;
          relevance?: RatingValue;
          problem_solved?: RatingValue;
          communication?: RatingValue;
          professionalism?: RatingValue;
          created_at?: string; // Should not be updated
        };
      };
      notifications: {
        Row: {
          id: string; // UUID, auto-generated
          user_id: string; // UUID, references users(id), NOT NULL
          title: string; // NOT NULL
          message: string; // NOT NULL
          type:
            | "session_cancelled"
            | "session_approved"
            | "session_reminder"
            | "session_declined"
            | "general"; // NOT NULL
          read: boolean; // DEFAULT FALSE
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          user_id: string; // Required
          title: string; // Required
          message: string; // Required
          type:
            | "session_cancelled"
            | "session_approved"
            | "session_reminder"
            | "session_declined"
            | "general"; // Required
          read?: boolean; // Defaults to false
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          user_id?: string; // Should not be updated
          title?: string;
          message?: string;
          type?:
            | "session_cancelled"
            | "session_approved"
            | "session_reminder"
            | "session_declined"
            | "general";
          read?: boolean;
          created_at?: string; // Should not be updated
        };
      };
      join_requests: {
        Row: {
          id: string; // UUID, auto-generated
          topic_id: string; // UUID, references topics(id), NOT NULL
          requester_id: string; // UUID, references users(id), NOT NULL
          requester_name: string; // NOT NULL
          message: string; // DEFAULT ''
          status: "pending" | "approved" | "rejected"; // DEFAULT 'pending'
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          updated_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          topic_id: string; // Required
          requester_id: string; // Required
          requester_name: string; // Required
          message?: string; // Defaults to ''
          status?: "pending" | "approved" | "rejected"; // Defaults to 'pending'
          created_at?: string; // Auto-generated if not provided
          updated_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          topic_id?: string; // Should not be updated
          requester_id?: string; // Should not be updated
          requester_name?: string;
          message?: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string; // Should not be updated
          updated_at?: string; // Auto-updated by trigger
        };
      };
      session_presence: {
        Row: {
          id: string; // UUID, auto-generated
          session_id: string; // UUID, references topics(id), NOT NULL
          user_id: string; // UUID, references users(id), NOT NULL
          status: "active" | "left"; // NOT NULL
          joined_at: string; // TIMESTAMP WITH TIME ZONE, NOT NULL
          last_seen: string; // TIMESTAMP WITH TIME ZONE, NOT NULL
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          session_id: string; // Required
          user_id: string; // Required
          status?: "active" | "left"; // Defaults to 'active'
          joined_at?: string; // Auto-generated if not provided
          last_seen?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          session_id?: string; // Should not be updated
          user_id?: string; // Should not be updated
          status?: "active" | "left";
          joined_at?: string;
          last_seen?: string;
        };
      };
      signaling: {
        Row: {
          id: string; // UUID, auto-generated
          session_id: string; // UUID, references topics(id), NOT NULL
          sender_id: string; // UUID, references users(id), NOT NULL
          recipient_id: string; // UUID, references users(id), NOT NULL
          message_type: string; // NOT NULL
          message_data: SignalingMessageData; // JSONB, NOT NULL
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          session_id: string; // Required
          sender_id: string; // Required
          recipient_id: string; // Required
          message_type: string; // Required
          message_data: SignalingMessageData; // Required
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          session_id?: string; // Should not be updated
          sender_id?: string; // Should not be updated
          recipient_id?: string; // Should not be updated
          message_type?: string;
          message_data?: SignalingMessageData;
          created_at?: string; // Should not be updated
        };
      };
      blog_posts: {
        Row: {
          id: string; // UUID, auto-generated
          title: string; // NOT NULL
          slug: string; // UNIQUE, NOT NULL
          excerpt: string | null;
          content: string; // NOT NULL
          featured_image_url: string | null;
          category: string; // DEFAULT 'Product Updates'
          status: "draft" | "published" | "archived"; // DEFAULT 'draft'
          author_id: string | null; // UUID, references auth.users(id)
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          updated_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          published_at: string | null; // TIMESTAMP WITH TIME ZONE
          like_count?: number; // Computed field
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          title: string; // Required
          slug: string; // Required, must be unique
          excerpt?: string | null;
          content: string; // Required
          featured_image_url?: string | null;
          category?: string; // Defaults to 'Product Updates'
          status?: "draft" | "published" | "archived"; // Defaults to 'draft'
          author_id?: string | null;
          created_at?: string; // Auto-generated if not provided
          updated_at?: string; // Auto-generated if not provided
          published_at?: string | null;
        };
        Update: {
          id?: string; // Cannot be updated
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          featured_image_url?: string | null;
          category?: string;
          status?: "draft" | "published" | "archived";
          author_id?: string | null;
          created_at?: string; // Should not be updated
          updated_at?: string; // Auto-updated by trigger
          published_at?: string | null;
        };
      };
      blog_likes: {
        Row: {
          id: string; // UUID, auto-generated
          blog_post_id: string; // UUID, references blog_posts(id), NOT NULL
          ip_address: string; // INET, NOT NULL
          user_agent: string | null;
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          blog_post_id: string; // Required
          ip_address: string; // Required
          user_agent?: string | null;
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          blog_post_id?: string; // Should not be updated
          ip_address?: string; // Should not be updated
          user_agent?: string | null;
          created_at?: string; // Should not be updated
        };
      };
      admin_roles: {
        Row: {
          id: string; // UUID, auto-generated
          user_id: string; // UUID, references auth.users(id), UNIQUE, NOT NULL
          role: "admin" | "editor"; // DEFAULT 'admin'
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          user_id: string; // Required, must be unique
          role?: "admin" | "editor"; // Defaults to 'admin'
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          user_id?: string; // Should not be updated
          role?: "admin" | "editor";
          created_at?: string; // Should not be updated
        };
      };
      user_sessions: {
        Row: {
          id: string; // UUID, auto-generated
          user_id: string; // UUID, references auth.users(id)
          session_token: string; // NOT NULL, UNIQUE
          ip_address: string; // INET, NOT NULL
          user_agent: string | null;
          device_info: DeviceInfo; // JSONB, NOT NULL
          location_info: LocationInfo | null; // JSONB
          device_fingerprint: string | null;
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          last_active: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          ended_at: string | null; // TIMESTAMP WITH TIME ZONE
          is_active: boolean; // DEFAULT TRUE
          session_duration_minutes: number | null; // GENERATED ALWAYS AS computed
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          user_id: string; // Required
          session_token: string; // Required, must be unique
          ip_address: string; // Required
          user_agent?: string | null;
          device_info: DeviceInfo; // Required
          location_info?: LocationInfo | null;
          device_fingerprint?: string | null;
          created_at?: string; // Auto-generated if not provided
          last_active?: string; // Auto-generated if not provided
          ended_at?: string | null;
          is_active?: boolean; // Defaults to true
        };
        Update: {
          id?: string; // Cannot be updated
          user_id?: string; // Should not be updated
          session_token?: string; // Should not be updated
          ip_address?: string; // Should not be updated
          user_agent?: string | null;
          device_info?: DeviceInfo;
          location_info?: LocationInfo | null;
          device_fingerprint?: string | null;
          created_at?: string; // Should not be updated
          last_active?: string; // Auto-updated
          ended_at?: string | null;
          is_active?: boolean;
        };
      };
      device_fingerprints: {
        Row: {
          id: string; // UUID, auto-generated
          fingerprint_hash: string; // NOT NULL, UNIQUE
          device_info: DeviceInfo; // JSONB, NOT NULL
          first_seen: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          last_seen: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          total_sessions: number; // DEFAULT 1
          unique_users: number; // DEFAULT 1
          is_suspicious: boolean; // DEFAULT FALSE
          notes: string | null;
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          fingerprint_hash: string; // Required, must be unique
          device_info: DeviceInfo; // Required
          first_seen?: string; // Auto-generated if not provided
          last_seen?: string; // Auto-generated if not provided
          total_sessions?: number; // Defaults to 1
          unique_users?: number; // Defaults to 1
          is_suspicious?: boolean; // Defaults to false
          notes?: string | null;
        };
        Update: {
          id?: string; // Cannot be updated
          fingerprint_hash?: string; // Should not be updated
          device_info?: DeviceInfo;
          first_seen?: string; // Should not be updated
          last_seen?: string; // Auto-updated
          total_sessions?: number;
          unique_users?: number;
          is_suspicious?: boolean;
          notes?: string | null;
        };
      };
      user_roles: {
        Row: {
          id: string; // UUID, auto-generated
          user_id: string; // UUID, references auth.users(id), NOT NULL
          role: "admin" | "user" | "moderator" | "suspended" | "banned"; // NOT NULL
          granted_by: string; // UUID, references auth.users(id), NOT NULL
          granted_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          expires_at: string | null; // TIMESTAMP WITH TIME ZONE
          is_active: boolean; // DEFAULT TRUE
          notes: string | null;
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          user_id: string; // Required
          role: "admin" | "user" | "moderator" | "suspended" | "banned"; // Required
          granted_by: string; // Required
          granted_at?: string; // Auto-generated if not provided
          expires_at?: string | null;
          is_active?: boolean; // Defaults to true
          notes?: string | null;
        };
        Update: {
          id?: string; // Cannot be updated
          user_id?: string; // Should not be updated
          role?: "admin" | "user" | "moderator" | "suspended" | "banned";
          granted_by?: string; // Should not be updated
          granted_at?: string; // Should not be updated
          expires_at?: string | null;
          is_active?: boolean;
          notes?: string | null;
        };
      };
      user_permissions: {
        Row: {
          id: string; // UUID, auto-generated
          user_id: string; // UUID, references auth.users(id), NOT NULL
          permission: "create_sessions" | "join_sessions" | "moderate_content" | "admin_access"; // NOT NULL
          granted_by: string; // UUID, references auth.users(id), NOT NULL
          granted_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          expires_at: string | null; // TIMESTAMP WITH TIME ZONE
          is_active: boolean; // DEFAULT TRUE
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          user_id: string; // Required
          permission: "create_sessions" | "join_sessions" | "moderate_content" | "admin_access"; // Required
          granted_by: string; // Required
          granted_at?: string; // Auto-generated if not provided
          expires_at?: string | null;
          is_active?: boolean; // Defaults to true
        };
        Update: {
          id?: string; // Cannot be updated
          user_id?: string; // Should not be updated
          permission?: "create_sessions" | "join_sessions" | "moderate_content" | "admin_access";
          granted_by?: string; // Should not be updated
          granted_at?: string; // Should not be updated
          expires_at?: string | null;
          is_active?: boolean;
        };
      };
      user_status: {
        Row: {
          id: string; // UUID, auto-generated
          user_id: string; // UUID, references auth.users(id), UNIQUE, NOT NULL
          status: "active" | "suspended" | "banned" | "pending_verification"; // DEFAULT 'active'
          reason: string | null;
          changed_by: string; // UUID, references auth.users(id), NOT NULL
          changed_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          expires_at: string | null; // TIMESTAMP WITH TIME ZONE
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          user_id: string; // Required, must be unique
          status?: "active" | "suspended" | "banned" | "pending_verification"; // Defaults to 'active'
          reason?: string | null;
          changed_by: string; // Required
          changed_at?: string; // Auto-generated if not provided
          expires_at?: string | null;
        };
        Update: {
          id?: string; // Cannot be updated
          user_id?: string; // Should not be updated
          status?: "active" | "suspended" | "banned" | "pending_verification";
          reason?: string | null;
          changed_by?: string;
          changed_at?: string; // Auto-updated
          expires_at?: string | null;
        };
      };
      admin_actions: {
        Row: {
          id: string; // UUID, auto-generated
          admin_id: string; // UUID, references auth.users(id), NOT NULL
          target_user_id: string | null; // UUID, references auth.users(id)
          action_type: "user_created" | "user_suspended" | "user_banned" | "user_role_changed" | "content_moderated" | "system_config_changed"; // NOT NULL
          action_details: Record<string, any>; // JSONB, NOT NULL
          reason: string | null;
          ip_address: string | null; // INET
          user_agent: string | null;
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          admin_id: string; // Required
          target_user_id?: string | null;
          action_type: "user_created" | "user_suspended" | "user_banned" | "user_role_changed" | "content_moderated" | "system_config_changed"; // Required
          action_details: Record<string, any>; // Required
          reason?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          admin_id?: string; // Should not be updated
          target_user_id?: string | null;
          action_type?: "user_created" | "user_suspended" | "user_banned" | "user_role_changed" | "content_moderated" | "system_config_changed";
          action_details?: Record<string, any>;
          reason?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string; // Should not be updated
        };
      };
      admin_notifications: {
        Row: {
          id: string; // UUID, auto-generated
          title: string; // NOT NULL
          message: string; // NOT NULL
          type: string; // NOT NULL
          severity: "low" | "medium" | "high" | "critical"; // DEFAULT 'medium'
          metadata: Record<string, any>; // JSONB, DEFAULT '{}'
          is_read: boolean; // DEFAULT FALSE
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          read_at: string | null; // TIMESTAMP WITH TIME ZONE
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          title: string; // Required
          message: string; // Required
          type: string; // Required
          severity?: "low" | "medium" | "high" | "critical"; // Defaults to 'medium'
          metadata?: Record<string, any>; // Defaults to '{}'
          is_read?: boolean; // Defaults to false
          created_at?: string; // Auto-generated if not provided
          read_at?: string | null;
        };
        Update: {
          id?: string; // Cannot be updated
          title?: string;
          message?: string;
          type?: string;
          severity?: "low" | "medium" | "high" | "critical";
          metadata?: Record<string, any>;
          is_read?: boolean;
          created_at?: string; // Should not be updated
          read_at?: string | null;
        };
      };

    };
    Views: {
      user_footprints: {
        Row: {
          user_id: string;
          email: string;
          display_name: string | null;
          total_sessions: number;
          unique_devices: number;
          unique_ip_addresses: number;
          unique_countries: number;
          first_session: string | null;
          last_session: string | null;
          avg_session_duration: number | null;
          total_session_time: number | null;
          sessions_last_7_days: number;
          sessions_last_30_days: number;
          most_used_device: DeviceInfo | null;
          most_common_location: LocationInfo | null;
          engagement_level: "High" | "Medium" | "Low";
        };
      };
      device_analytics: {
        Row: {
          device_type: string | null;
          browser: string | null;
          operating_system: string | null;
          country: string | null;
          unique_users: number;
          total_sessions: number;
          avg_session_duration: number | null;
          sessions_last_7_days: number;
          sessions_last_30_days: number;
        };
      };
      user_management_view: {
        Row: {
          user_id: string;
          email: string;
          display_name: string | null;
          first_name: string | null;
          last_name: string | null;
          user_created_at: string;
          user_updated_at: string;
          current_role: "admin" | "user" | "moderator" | "suspended" | "banned" | null;
          role_granted_at: string | null;
          role_expires_at: string | null;
          current_status: "active" | "suspended" | "banned" | "pending_verification";
          status_reason: string | null;
          status_changed_at: string;
          total_sessions: number;
          last_login: string | null;
          is_admin: boolean;
        };
      };
    };
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      join_session: {
        Args: {
          p_session_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      leave_session: {
        Args: {
          p_session_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      cleanup_expired_signaling: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      create_user_session: {
        Args: {
          p_user_id: string;
          p_ip_address: string;
          p_user_agent: string | null;
          p_device_info: DeviceInfo;
          p_location_info: LocationInfo | null;
          p_device_fingerprint: string | null;
        };
        Returns: string;
      };
      update_session_activity: {
        Args: {
          p_session_id: string;
        };
        Returns: undefined;
      };
      end_user_session: {
        Args: {
          p_session_id: string;
        };
        Returns: undefined;
      };
      check_returning_device: {
        Args: {
          p_fingerprint: string;
        };
        Returns: boolean;
      };
      cleanup_old_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Extract table types for easier use
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// ============================================================================
// SPECIFIC TABLE TYPES
// ============================================================================

export type User = Tables<"users">;
export type UserInsert = TablesInsert<"users">;
export type UserUpdate = TablesUpdate<"users">;

export type Topic = Tables<"topics">;
export type TopicInsert = TablesInsert<"topics">;
export type TopicUpdate = TablesUpdate<"topics">;

export type Message = Tables<"messages">;
export type MessageInsert = TablesInsert<"messages">;
export type MessageUpdate = TablesUpdate<"messages">;

export type Rating = Tables<"ratings">;
export type RatingInsert = TablesInsert<"ratings">;
export type RatingUpdate = TablesUpdate<"ratings">;

export type Notification = Tables<"notifications">;
export type NotificationInsert = TablesInsert<"notifications">;
export type NotificationUpdate = TablesUpdate<"notifications">;

export type JoinRequest = Tables<"join_requests">;
export type JoinRequestInsert = TablesInsert<"join_requests">;
export type JoinRequestUpdate = TablesUpdate<"join_requests">;

export type SessionPresence = Tables<"session_presence">;
export type SessionPresenceInsert = TablesInsert<"session_presence">;
export type SessionPresenceUpdate = TablesUpdate<"session_presence">;

export type Signaling = Tables<"signaling">;
export type SignalingInsert = TablesInsert<"signaling">;
export type SignalingUpdate = TablesUpdate<"signaling">;

export type BlogPost = Tables<"blog_posts">;
export type BlogPostInsert = TablesInsert<"blog_posts">;
export type BlogPostUpdate = TablesUpdate<"blog_posts">;

export type BlogLike = Tables<"blog_likes">;
export type BlogLikeInsert = TablesInsert<"blog_likes">;
export type BlogLikeUpdate = TablesUpdate<"blog_likes">;

export type AdminRole = Tables<"admin_roles">;
export type AdminRoleInsert = TablesInsert<"admin_roles">;
export type AdminRoleUpdate = TablesUpdate<"admin_roles">;

export type UserSession = Tables<"user_sessions">;
export type UserSessionInsert = TablesInsert<"user_sessions">;
export type UserSessionUpdate = TablesUpdate<"user_sessions">;

export type DeviceFingerprint = Tables<"device_fingerprints">;
export type DeviceFingerprintInsert = TablesInsert<"device_fingerprints">;
export type DeviceFingerprintUpdate = TablesUpdate<"device_fingerprints">;

export type UserRole = Tables<"user_roles">;
export type UserRoleInsert = TablesInsert<"user_roles">;
export type UserRoleUpdate = TablesUpdate<"user_roles">;

export type UserPermission = Tables<"user_permissions">;
export type UserPermissionInsert = TablesInsert<"user_permissions">;
export type UserPermissionUpdate = TablesUpdate<"user_permissions">;

export type UserStatus = Tables<"user_status">;
export type UserStatusInsert = TablesInsert<"user_status">;
export type UserStatusUpdate = TablesUpdate<"user_status">;

export type AdminAction = Tables<"admin_actions">;
export type AdminActionInsert = TablesInsert<"admin_actions">;
export type AdminActionUpdate = TablesUpdate<"admin_actions">;

export type AdminNotification = Tables<"admin_notifications">;
export type AdminNotificationInsert = TablesInsert<"admin_notifications">;
export type AdminNotificationUpdate = TablesUpdate<"admin_notifications">;



// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export type TopicWithAuthor = Topic & {
  author: User;
};

export type MessageWithSender = Message & {
  sender: User;
};

export type TopicWithDetails = Topic & {
  author: User;
  message_count?: number;
  participant_count?: number;
  join_requests?: JoinRequest[];
  session_presence?: SessionPresence[];
  session_status?: SessionStatus;
  actual_duration?: number; // in minutes
  ended_early?: boolean;
  no_show?: boolean;
};

// ============================================================================
// SESSION STATUS TYPES
// ============================================================================

export type SessionStatus =
  | "created" // Just created, no requests yet
  | "has_requests" // Has pending join requests
  | "approved" // Has approved participants, waiting for start time
  | "upcoming" // Approved and start time is near (within 30 minutes)
  | "waiting" // Session time started but no one joined yet
  | "active" // Session is active with participants
  | "ended_complete" // Session ended at scheduled time with participants
  | "ended_early" // Session ended before scheduled time
  | "ended_no_show" // Session ended with no participants showing up
  | "cancelled"; // Session was cancelled

export interface SessionStatusInfo {
  status: SessionStatus;
  color: string;
  description: string;
  priority: number; // For sorting
}

export interface SessionAnalytics {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  no_show_sessions: number;
  early_ended_sessions: number;
  average_actual_duration: number;
  completion_rate: number;
  show_up_rate: number;
}

export type UserWithStats = User & {
  topic_count?: number;
  message_count?: number;
  rating_stats?: UserRatingStats;
};

export type BlogPostWithAuthor = BlogPost & {
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  like_count?: number;
};

// ============================================================================
// RATING AGGREGATION TYPES
// ============================================================================

export interface UserRatingStats {
  user_id: string;
  total_ratings: number;
  average_politeness: number;
  average_relevance: number;
  average_problem_solved: number;
  average_communication: number;
  average_professionalism: number;
  overall_average: number;
}

export interface RatingBreakdown {
  politeness: RatingDistribution;
  relevance: RatingDistribution;
  problem_solved: RatingDistribution;
  communication: RatingDistribution;
  professionalism: RatingDistribution;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  average: number;
  total: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T | null;
  error?: string | null;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface TopicFilters {
  author_id?: string;
  start_date?: string;
  end_date?: string;
  has_participants?: boolean;
  status?: SessionStatus;
  search?: string;
}

export interface UserFilters {
  country?: string;
  created_after?: string;
  created_before?: string;
  has_ratings?: boolean;
  search?: string;
}

// ============================================================================
// REAL-TIME SUBSCRIPTION TYPES
// ============================================================================

export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T | null;
  old?: T | null;
  errors?: string[];
}

export interface TopicSubscriptionPayload extends RealtimePayload<Topic> {}
export interface MessageSubscriptionPayload extends RealtimePayload<Message> {}
export interface PresenceSubscriptionPayload extends RealtimePayload<SessionPresence> {}

// Callback function type for real-time subscriptions
export type SubscriptionCallback<T = any> = (payload: RealtimePayload<T>) => void;

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================

export type UserRoleType = "admin" | "user" | "moderator" | "suspended" | "banned";
export type UserStatusType = "active" | "suspended" | "banned" | "pending_verification";
export type UserPermissionType = "create_sessions" | "join_sessions" | "moderate_content" | "admin_access";
export type AdminActionType = "user_created" | "user_suspended" | "user_banned" | "user_role_changed" | "content_moderated" | "system_config_changed";

export interface UserManagementData {
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  user_created_at: string;
  user_updated_at: string;
  current_role: UserRoleType | null;
  role_granted_at: string | null;
  role_expires_at: string | null;
  current_status: UserStatusType;
  status_reason: string | null;
  status_changed_at: string;
  total_sessions: number;
  last_login: string | null;
  is_admin: boolean;
}

// Analytics types
export interface UserAnalytics {
  total_users: number;
  active_users: number;
  new_users_today: number;
  user_growth_rate: number;
  average_rating?: number;
}

export interface TopicAnalytics {
  total_topics: number;
  active_topics: number;
  completed_topics: number;
  topic_completion_rate: number;
  total_participants?: number;
}

export interface MessageAnalytics {
  total_messages: number;
  messages_today: number;
  average_messages_per_topic: number;
  message_growth_rate: number;
  most_active_topics?: Array<{ topic_id: string; message_count: number; }>;
}

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  userType?: 'all' | 'new' | 'active' | 'inactive';
  topicStatus?: 'all' | 'active' | 'completed' | 'cancelled';
}

// SessionStatus is already defined above

// ============================================================================
// RECOVERY TRACKER TYPES
// ============================================================================

export interface SobrietyTracker {
  id: string;
  user_id: string;
  tracker_type: string;
  tracker_name: string;
  start_date: string;
  is_active: boolean;
  chosen_image: string | null;
  piece_unlock_order: number[] | null;
  current_phase: number;
  pieces_unlocked: number;
  total_pieces: number;
  days_per_piece: number;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  tracker_id: string;
  checkin_date: string;
  mood_rating: number;
  notes: string | null;
  created_at: string;
}

export interface TrackerRelapse {
  id: string;
  user_id: string;
  tracker_id: string;
  relapse_date: string;
  notes: string | null;
  created_at: string;
}

export interface RecoveryStats {
  activeTrackers: number;
  totalCheckins: number;
  visualJourneys: number;
  avgCheckinsPerDay: number;
  trackersByType: { type: string; count: number }[];
  recentRelapses: number;
}

export interface CheckinTrend {
  date: string;
  count: number;
  avgMood: number;
}

export interface MilestoneUser {
  user_id: string;
  display_name: string;
  tracker_type: string;
  days_sober: number;
  milestone: number;
  start_date: string;
}

export interface AtRiskUser {
  user_id: string;
  display_name: string;
  tracker_type: string;
  last_checkin: string;
  days_since_checkin: number;
  current_streak: number;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export default Database;
