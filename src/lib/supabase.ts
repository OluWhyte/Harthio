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

// Create typed Supabase client for full type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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

// Create a properly typed client for use in services
export const typedSupabase = supabase as ReturnType<
  typeof createClient<Database>
>;

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
