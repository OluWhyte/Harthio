/**
 * Custom SWR Hooks for Common Data Fetching Patterns
 * Phase 2 Performance Optimization
 */

import useSWR from 'swr';
import { supabaseFetcher } from '@/lib/swr-config';
import { supabase } from '@/lib/supabase';

/**
 * Hook to fetch user profile with caching
 */
export function useUserProfile(userId: string | null) {
  return useSWR(
    userId ? ['user-profile', userId] : null,
    async () => {
      if (!userId) return { data: null, error: null };
      const result = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      return { data: result.data, error: result.error };
    },
    {
      dedupingInterval: 300000, // Cache for 5 minutes
      revalidateOnFocus: false,
    }
  );
}

/**
 * Hook to fetch user sessions with caching
 */
export function useUserSessions(userId: string | null) {
  return useSWR(
    userId ? ['user-sessions', userId] : null,
    async () => {
      if (!userId) return { data: null, error: null };
      const result = await supabase
        .from('topics')
        .select('*')
        .eq('creator_id', userId)
        .order('start_time', { ascending: false })
        .limit(20);
      return { data: result.data, error: result.error };
    },
    {
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );
}

/**
 * Hook to fetch available sessions with caching
 */
export function useAvailableSessions() {
  return useSWR(
    'available-sessions',
    async () => {
      const now = new Date().toISOString();
      const result = await supabase
        .from('topics')
        .select('*, users!topics_creator_id_fkey(first_name, last_name, profile_picture_url)')
        .gte('start_time', now)
        .eq('is_private', false)
        .order('start_time', { ascending: true })
        .limit(20);
      return { data: result.data, error: result.error };
    },
    {
      dedupingInterval: 30000, // Cache for 30 seconds
      refreshInterval: 60000, // Auto-refresh every minute
    }
  );
}

/**
 * Hook to fetch notifications with caching
 */
export function useNotifications(userId: string | null) {
  return useSWR(
    userId ? ['notifications', userId] : null,
    async () => {
      if (!userId) return { data: null, error: null };
      const result = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      return { data: result.data, error: result.error };
    },
    {
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );
}

/**
 * Hook to fetch recovery trackers with caching
 */
export function useRecoveryTrackers(userId: string | null) {
  return useSWR(
    userId ? ['recovery-trackers', userId] : null,
    async () => {
      if (!userId) return { data: null, error: null };
      const result = await supabase
        .from('sobriety_trackers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return { data: result.data, error: result.error };
    },
    {
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );
}
