import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database-types";

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
        // Add cookie options for better mobile support
        cookieOptions: {
          name: 'harthio-auth',
          lifetime: 60 * 60 * 24 * 7, // 7 days
          domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
          path: '/',
          sameSite: 'lax', // Better mobile compatibility than 'strict'
        },
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
  return supabaseInstance;
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
export type { Database } from "./database-types";

// Re-export commonly used types
export type {
  User,
  Topic,
  Message,
  Rating,
  TopicWithAuthor,
  MessageWithSender,
  UserRatingStats,
  JoinRequest,
  RatingValue,
  ApiResponse,
  SubscriptionCallback,
} from "./database-types";

// Temporary workaround: Export supabase with any type to fix dependency issues
export const supabaseAny = supabase as any;
