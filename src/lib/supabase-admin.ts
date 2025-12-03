import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Admin Supabase Client (Service Role)
 * 
 * WARNING: This client has FULL database access and bypasses RLS.
 * Only use in API routes and server-side code.
 * NEVER expose this client to the browser.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

// Create admin client with service role key
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
