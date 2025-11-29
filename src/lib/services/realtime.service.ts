/**
 * Real-time Service
 * 
 * Manages real-time subscriptions for live updates using Supabase real-time.
 * Handles subscriptions to topics, messages, and user profiles.
 */

import { supabase } from '../supabase';
import type {
  Topic,
  User,
  SubscriptionCallback,
} from '../database-types';

// Type-safe wrapper for Supabase operations
const typedSupabase = supabase as any;

// Real-time channel type
export type RealtimeChannel = ReturnType<typeof typedSupabase.channel>;

/**
 * Service for managing real-time subscriptions
 */
export const realtimeService = {
  /**
   * Subscribe to changes for a specific topic/session
   * 
   * @param topicId - The topic ID to subscribe to
   * @param callback - Function called when topic changes
   * @returns Channel object for unsubscribing
   * 
   * @example
   * ```typescript
   * const channel = realtimeService.subscribeToTopic('topic-123', (payload) => {
   *   console.log('Topic updated:', payload.new);
   * });
   * 
   * // Later, unsubscribe
   * realtimeService.unsubscribe(channel);
   * ```
   */
  subscribeToTopic(
    topicId: string,
    callback: SubscriptionCallback<Topic>
  ): RealtimeChannel {
    return typedSupabase
      .channel(`topic-${topicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topics',
          filter: `id=eq.${topicId}`,
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Topic | null,
            old: payload.old as Topic | null,
          });
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to changes for all topics
   * 
   * Useful for dashboard views that show all sessions.
   * 
   * @param callback - Function called when any topic changes
   * @returns Channel object for unsubscribing
   * 
   * @example
   * ```typescript
   * const channel = realtimeService.subscribeToAllTopics((payload) => {
   *   if (payload.eventType === 'INSERT') {
   *     console.log('New session created:', payload.new);
   *   }
   * });
   * ```
   */
  subscribeToAllTopics(callback: SubscriptionCallback<Topic>): RealtimeChannel {
    return typedSupabase
      .channel('all-topics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topics',
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Topic | null,
            old: payload.old as Topic | null,
          });
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to user profile changes
   * 
   * @param userId - The user ID to subscribe to
   * @param callback - Function called when user profile changes
   * @returns Channel object for unsubscribing
   * 
   * @example
   * ```typescript
   * const channel = realtimeService.subscribeToUserProfile('user-123', (payload) => {
   *   console.log('Profile updated:', payload.new);
   * });
   * ```
   */
  subscribeToUserProfile(
    userId: string,
    callback: SubscriptionCallback<User>
  ): RealtimeChannel {
    return typedSupabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as User | null,
            old: payload.old as User | null,
          });
        }
      )
      .subscribe();
  },

  /**
   * Unsubscribe from a real-time channel
   * 
   * Always call this when component unmounts to prevent memory leaks.
   * 
   * @param channel - The channel to unsubscribe from
   * 
   * @example
   * ```typescript
   * useEffect(() => {
   *   const channel = realtimeService.subscribeToTopic('topic-123', callback);
   *   
   *   return () => {
   *     realtimeService.unsubscribe(channel);
   *   };
   * }, []);
   * ```
   */
  unsubscribe(channel: RealtimeChannel): void {
    typedSupabase.removeChannel(channel);
  },
};
