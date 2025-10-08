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
          type: 'session_cancelled' | 'session_approved' | 'session_reminder' | 'session_declined' | 'general'; // NOT NULL
          read: boolean; // DEFAULT FALSE
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          user_id: string; // Required
          title: string; // Required
          message: string; // Required
          type: 'session_cancelled' | 'session_approved' | 'session_reminder' | 'session_declined' | 'general'; // Required
          read?: boolean; // Defaults to false
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          user_id?: string; // Should not be updated
          title?: string;
          message?: string;
          type?: 'session_cancelled' | 'session_approved' | 'session_reminder' | 'session_declined' | 'general';
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
          status: 'pending' | 'approved' | 'rejected'; // DEFAULT 'pending'
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
          updated_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          topic_id: string; // Required
          requester_id: string; // Required
          requester_name: string; // Required
          message?: string; // Defaults to ''
          status?: 'pending' | 'approved' | 'rejected'; // Defaults to 'pending'
          created_at?: string; // Auto-generated if not provided
          updated_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          topic_id?: string; // Should not be updated
          requester_id?: string; // Should not be updated
          requester_name?: string;
          message?: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string; // Should not be updated
          updated_at?: string; // Auto-updated by trigger
        };
      };
      session_presence: {
        Row: {
          id: string; // UUID, auto-generated
          session_id: string; // UUID, references topics(id), NOT NULL
          user_id: string; // UUID, references users(id), NOT NULL
          status: 'active' | 'left'; // NOT NULL
          joined_at: string; // TIMESTAMP WITH TIME ZONE, NOT NULL
          last_seen: string; // TIMESTAMP WITH TIME ZONE, NOT NULL
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          session_id: string; // Required
          user_id: string; // Required
          status?: 'active' | 'left'; // Defaults to 'active'
          joined_at?: string; // Auto-generated if not provided
          last_seen?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          session_id?: string; // Should not be updated
          user_id?: string; // Should not be updated
          status?: 'active' | 'left';
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
          message_data: any; // JSONB, NOT NULL
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          session_id: string; // Required
          sender_id: string; // Required
          recipient_id: string; // Required
          message_type: string; // Required
          message_data: any; // Required
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          session_id?: string; // Should not be updated
          sender_id?: string; // Should not be updated
          recipient_id?: string; // Should not be updated
          message_type?: string;
          message_data?: any;
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
          status: 'draft' | 'published' | 'archived'; // DEFAULT 'draft'
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
          status?: 'draft' | 'published' | 'archived'; // Defaults to 'draft'
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
          status?: 'draft' | 'published' | 'archived';
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
          role: 'admin' | 'editor'; // DEFAULT 'admin'
          created_at: string; // TIMESTAMP WITH TIME ZONE, auto-generated
        };
        Insert: {
          id?: string; // Auto-generated if not provided
          user_id: string; // Required, must be unique
          role?: 'admin' | 'editor'; // Defaults to 'admin'
          created_at?: string; // Auto-generated if not provided
        };
        Update: {
          id?: string; // Cannot be updated
          user_id?: string; // Should not be updated
          role?: 'admin' | 'editor';
          created_at?: string; // Should not be updated
        };
      };
    };
    Views: {
      [_ in never]: never;
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
};

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

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// REAL-TIME SUBSCRIPTION TYPES
// ============================================================================

export interface SubscriptionCallback<T> {
  (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T | null;
    old: T | null;
  }): void;
}

export interface RealtimePayload<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T | null;
  old: T | null;
  errors: string[] | null;
}

// ============================================================================
// FORM AND INPUT TYPES
// ============================================================================

export interface TopicFormData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

export interface MessageFormData {
  text: string;
}

export interface RatingFormData {
  politeness: RatingValue;
  relevance: RatingValue;
  problem_solved: RatingValue;
  communication: RatingValue;
  professionalism: RatingValue;
}

export interface UserProfileFormData {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

// ============================================================================
// FILTER AND SEARCH TYPES
// ============================================================================

export interface TopicFilters {
  author_id?: string;
  start_date?: string;
  end_date?: string;
  search_query?: string;
  participant_id?: string;
  status?: "upcoming" | "active" | "ended";
}

export interface MessageFilters {
  topic_id: string;
  sender_id?: string;
  date_from?: string;
  date_to?: string;
  search_query?: string;
}

export interface UserFilters {
  search_query?: string;
  min_rating?: number;
  has_avatar?: boolean;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export interface ValidationSchema<T> {
  validate: (data: T) => ValidationResult;
  sanitize: (data: T) => T;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
  hint?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface UserPermissions {
  canCreateTopic: boolean;
  canJoinTopic: (topicId: string) => boolean;
  canSendMessage: (topicId: string) => boolean;
  canRateUser: (userId: string, topicId: string) => boolean;
  canUpdateProfile: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface TopicAnalytics {
  total_topics: number;
  active_topics: number;
  total_participants: number;
  average_duration: number;
  popular_times: { hour: number; count: number }[];
}

export interface UserAnalytics {
  total_users: number;
  active_users: number;
  new_users_today: number;
  average_rating: number;
  top_rated_users: UserWithStats[];
}

export interface MessageAnalytics {
  total_messages: number;
  messages_today: number;
  average_messages_per_topic: number;
  most_active_topics: TopicWithDetails[];
}

// ============================================================================
// END OF TYPES
// ============================================================================
// All types are already exported above - no need for re-export
