import { createClient } from "@supabase/supabase-js";
import type { Database, Tables } from "./database.types";

// ============================================================================
// SUPABASE CLIENT CONFIGURATION
// ============================================================================
// Typed Supabase client for the Harthio application
// Provides full type safety for all database operations
// Last updated: 2025-09-22

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

// ============================================================================
// TYPED SUPABASE CLIENT
// ============================================================================

// Create a singleton Supabase client to prevent multiple instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// Create typed Supabase client for full type safety
// Use singleton pattern to prevent multiple GoTrueClient instances
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        debug: false, // Never debug in production
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'harthio-auth',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          "X-Client-Info": "harthio-web",
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    });
  }
  return supabaseInstance!;
})();

// Create a properly typed client for use in services
export const typedSupabase = supabase as ReturnType<
  typeof createClient<Database>
>;

// Export the same client with different name for backward compatibility
// Use 'any' type to bypass strict typing issues after dependency updates
export const supabaseClient = supabase as any;

// Export typed client type for use in other files
export type TypedSupabaseClient = typeof supabase;

// Export database type for convenience
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "./database.types";

// Create type aliases from database tables for convenience
export type User = Tables<'users'>;
export type Topic = Tables<'topics'>;
export type Message = Tables<'messages'>;
export type Rating = Tables<'ratings'>;
export type JoinRequest = Tables<'join_requests'>;
export type Notification = Tables<'notifications'>;
export type UserProfile = Tables<'users'>;

// Composite types for common queries
export type TopicWithAuthor = Topic & { author: User };
export type MessageWithSender = Message & { sender: User };

// Helper types
export type UserRatingStats = {
  average_rating: number;
  total_ratings: number;
};

export type RatingValue = 1 | 2 | 3 | 4 | 5;

export type ApiResponse<T = any> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

export type SubscriptionCallback<T = any> = (payload: T) => void;

// Temporary workaround: Export supabase with any type to fix dependency issues
export const supabaseAny = supabase as any;
