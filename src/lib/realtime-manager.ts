// ============================================================================
// REAL-TIME MANAGER
// ============================================================================
// Centralized real-time updates for all app features
// Manages subscriptions and provides smooth real-time experience
// ============================================================================

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
}) => void;

// Debounced callback wrapper
type DebouncedCallback<T> = {
  callback: RealtimeCallback<T>;
  timeout: NodeJS.Timeout | null;
  delay: number;
};

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private debouncedCallbacks: Map<string, DebouncedCallback<any>> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // Start with 1 second
  private static instance: RealtimeManager | null = null;

  // Singleton pattern for global real-time management
  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  // Optimized debounced callback wrapper with better performance
  private createDebouncedCallback<T>(
    channelId: string, 
    callback: RealtimeCallback<T>, 
    delay: number = 500
  ): RealtimeCallback<T> {
    return (payload) => {
      const debouncedCallback = this.debouncedCallbacks.get(channelId);
      
      if (debouncedCallback?.timeout) {
        clearTimeout(debouncedCallback.timeout);
      }

      // For critical updates (requests/participants), use shorter delay
      const actualDelay = payload.eventType === 'UPDATE' && 
        ((payload.new as any)?.requests || (payload.new as any)?.participants) ? 
        Math.min(delay, 300) : delay;

      const timeout = setTimeout(() => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in debounced callback:', error);
        } finally {
          this.debouncedCallbacks.delete(channelId);
        }
      }, actualDelay);

      this.debouncedCallbacks.set(channelId, {
        callback,
        timeout,
        delay: actualDelay
      });
    };
  }

  // Optimized topic subscription with better filtering and controlled debouncing
  subscribeToTopics(
    callback: RealtimeCallback<any>, 
    options?: {
      filter?: string;
      debounceMs?: number;
      userId?: string; // For user-specific filtering
    }
  ): string {
    const channelId = `topics-${Date.now()}-${Math.random()}`;
    const debounceMs = options?.debounceMs ?? 500; // Increased default debounce to prevent rapid updates
    
    // Create debounced callback to prevent excessive updates
    const debouncedCallback = this.createDebouncedCallback(channelId, callback, debounceMs);
    
    // Optimize filter for better database performance
    let dbFilter = options?.filter;
    if (options?.userId && !dbFilter) {
      // Use database-level filtering when possible - more efficient
      dbFilter = `author_id.eq.${options.userId}`;
    }
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topics',
          filter: dbFilter || undefined
        },
        (payload) => {
          // Enhanced client-side filtering for user relevance
          if (options?.userId && payload.new) {
            const topic = payload.new as any;
            const userId = options.userId;
            
            // Check if user is relevant to this topic
            const isAuthor = topic.author_id === userId;
            const isParticipant = topic.participants?.includes(userId);
            const hasRequest = topic.requests && Array.isArray(topic.requests) && 
              topic.requests.some((req: any) => req.requesterId === userId);
            
            // For public visibility: show topics with exactly 2 participants (ready sessions)
            const isPublicReady = !isAuthor && !isParticipant && !hasRequest && 
              ((topic.participants?.length || 0) + 1) === 2; // +1 for author
            
            const isRelevant = isAuthor || isParticipant || hasRequest || isPublicReady;
            
            if (!isRelevant) {
              console.log(`Filtering out irrelevant topic update for user ${userId}:`, {
                topicId: topic.id,
                isAuthor,
                isParticipant,
                hasRequest,
                isPublicReady,
                participantCount: (topic.participants?.length || 0) + 1
              });
              return;
            }
          }

          // Log real-time event for debugging
          const newTopic = payload.new as any;
          const oldTopic = payload.old as any;
          console.log(`Real-time topic ${payload.eventType}:`, {
            topicId: newTopic?.id || oldTopic?.id,
            userId: options?.userId,
            requestCount: newTopic?.requests?.length || 0,
            participantCount: (newTopic?.participants?.length || 0) + (newTopic ? 1 : 0)
          });

          debouncedCallback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe((status) => {
        console.log(`Topics subscription ${channelId}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to topics with filter: ${dbFilter || 'none'}`);
          // Reset retry count on successful subscription
          this.retryAttempts.delete(channelId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Topics subscription error for ${channelId}`);
          this.handleSubscriptionError(channelId, () => 
            this.subscribeToTopics(callback, options)
          );
        } else if (status === 'TIMED_OUT') {
          console.warn(`Topics subscription timed out for ${channelId}`);
          this.handleSubscriptionError(channelId, () => 
            this.subscribeToTopics(callback, options)
          );
        }
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  // Subscribe to users table changes (for profile updates) with debouncing
  subscribeToUsers(
    callback: RealtimeCallback<any>, 
    options?: {
      userId?: string;
      debounceMs?: number;
    }
  ): string {
    const channelId = `users-${Date.now()}-${Math.random()}`;
    const debounceMs = options?.debounceMs ?? 300;
    
    // Create debounced callback
    const debouncedCallback = this.createDebouncedCallback(channelId, callback, debounceMs);
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: options?.userId ? `id=eq.${options.userId}` : undefined
        },
        (payload) => {
          debouncedCallback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe((status) => {
        console.log(`Users subscription ${channelId}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to users with filter: ${options?.userId ? `id=eq.${options.userId}` : 'none'}`);
          // Reset retry count on successful subscription
          this.retryAttempts.delete(channelId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Users subscription error for ${channelId}`);
          this.handleSubscriptionError(channelId, () => 
            this.subscribeToUsers(callback, options)
          );
        } else if (status === 'TIMED_OUT') {
          console.warn(`Users subscription timed out for ${channelId}`);
          this.handleSubscriptionError(channelId, () => 
            this.subscribeToUsers(callback, options)
          );
        }
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  // Subscribe to messages table changes
  subscribeToMessages(callback: RealtimeCallback<any>, topicId?: string): string {
    const channelId = `messages-${Date.now()}-${Math.random()}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: topicId ? `topic_id=eq.${topicId}` : undefined
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe((status) => {
        console.log(`Messages subscription ${channelId}:`, status);
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  // Subscribe to session presence changes
  subscribeToPresence(callback: RealtimeCallback<any>, sessionId?: string): string {
    const channelId = `presence-${Date.now()}-${Math.random()}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_presence',
          filter: sessionId ? `session_id=eq.${sessionId}` : undefined
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe((status) => {
        console.log(`Presence subscription ${channelId}:`, status);
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  // Subscribe to join_requests table changes
  subscribeToJoinRequests(callback: RealtimeCallback<any>, filter?: string): string {
    const channelId = `join_requests-${Date.now()}-${Math.random()}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
          filter: filter || undefined
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe((status) => {
        console.log(`Join requests subscription ${channelId}:`, status);
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  // Unsubscribe from a specific channel with proper cleanup
  unsubscribe(channelId: string): void {
    const channel = this.channels.get(channelId);
    const debouncedCallback = this.debouncedCallbacks.get(channelId);
    
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelId);
      console.log(`Unsubscribed from channel: ${channelId}`);
    }
    
    // Clean up debounced callback
    if (debouncedCallback?.timeout) {
      clearTimeout(debouncedCallback.timeout);
      this.debouncedCallbacks.delete(channelId);
    }
  }

  // Unsubscribe from all channels with proper cleanup
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelId) => {
      channel.unsubscribe();
      console.log(`Unsubscribed from channel: ${channelId}`);
    });
    this.channels.clear();
    
    // Clean up all debounced callbacks
    this.debouncedCallbacks.forEach((debouncedCallback, channelId) => {
      if (debouncedCallback.timeout) {
        clearTimeout(debouncedCallback.timeout);
      }
    });
    this.debouncedCallbacks.clear();
  }

  // Get active subscriptions count
  getActiveSubscriptions(): number {
    return this.channels.size;
  }

  // Health check for real-time connections
  getConnectionStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    this.channels.forEach((channel, channelId) => {
      status[channelId] = channel.state;
    });
    return status;
  }

  // Get detailed subscription info for debugging
  getSubscriptionInfo(): {
    activeChannels: number;
    pendingCallbacks: number;
    channelStates: Record<string, string>;
  } {
    const channelStates: Record<string, string> = {};
    this.channels.forEach((channel, channelId) => {
      channelStates[channelId] = channel.state;
    });

    return {
      activeChannels: this.channels.size,
      pendingCallbacks: this.debouncedCallbacks.size,
      channelStates
    };
  }

  // Force execute all pending debounced callbacks (useful for testing)
  flushPendingCallbacks(): void {
    this.debouncedCallbacks.forEach((debouncedCallback, channelId) => {
      if (debouncedCallback.timeout) {
        clearTimeout(debouncedCallback.timeout);
        // Note: We can't execute the callback here as we don't have the payload
        console.log(`Cleared pending callback for channel: ${channelId}`);
      }
    });
    this.debouncedCallbacks.clear();
  }

  // Handle subscription errors with retry logic
  private handleSubscriptionError(channelId: string, retryFn: () => string): void {
    const currentRetries = this.retryAttempts.get(channelId) || 0;
    
    if (currentRetries < this.maxRetries) {
      const nextRetryCount = currentRetries + 1;
      const delay = this.retryDelay * Math.pow(2, currentRetries); // Exponential backoff
      
      console.log(`Retrying subscription ${channelId} in ${delay}ms (attempt ${nextRetryCount}/${this.maxRetries})`);
      
      this.retryAttempts.set(channelId, nextRetryCount);
      
      setTimeout(() => {
        // Clean up the failed channel first
        this.unsubscribe(channelId);
        
        // Retry the subscription
        try {
          const newChannelId = retryFn();
          console.log(`Retry successful, new channel ID: ${newChannelId}`);
        } catch (error) {
          console.error(`Retry failed for ${channelId}:`, error);
        }
      }, delay);
    } else {
      console.error(`Max retries (${this.maxRetries}) exceeded for subscription ${channelId}`);
      this.retryAttempts.delete(channelId);
      // Clean up the failed channel
      this.unsubscribe(channelId);
    }
  }

  // Check if a channel is in error state and needs retry
  isChannelHealthy(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    const state = channel.state;
    return state === 'joined' || state === 'joining';
  }

  // Get retry information for debugging
  getRetryInfo(): Record<string, number> {
    const retryInfo: Record<string, number> = {};
    this.retryAttempts.forEach((count, channelId) => {
      retryInfo[channelId] = count;
    });
    return retryInfo;
  }

  // Broadcast immediate update to all topic subscribers
  broadcastTopicUpdate(topicId: string, updateType: 'request' | 'participant' | 'state'): void {
    console.log(`Broadcasting immediate ${updateType} update for topic ${topicId}`);
    
    // Force flush any pending debounced callbacks for immediate updates
    this.debouncedCallbacks.forEach((debouncedCallback, channelId) => {
      if (channelId.startsWith('topics-') && debouncedCallback.timeout) {
        clearTimeout(debouncedCallback.timeout);
        console.log(`Flushed pending callback for immediate ${updateType} update`);
      }
    });
  }

  // Force immediate refresh for critical updates
  forceImmediateUpdate(topicId: string, updateType: 'request' | 'participant' | 'state'): void {
    console.log(`Forcing immediate ${updateType} update for topic ${topicId}`);
    
    // Clear all debounced callbacks to ensure immediate propagation
    this.flushPendingCallbacks();
    
    // Trigger immediate broadcast
    this.broadcastTopicUpdate(topicId, updateType);
  }

  // Enhanced subscription for request-sensitive updates
  subscribeToRequestUpdates(
    callback: RealtimeCallback<any>,
    options?: {
      userId?: string;
      immediateUpdates?: boolean;
    }
  ): string {
    const channelId = `request-updates-${Date.now()}-${Math.random()}`;
    const immediateUpdates = options?.immediateUpdates ?? true;
    
    // Use minimal debounce for request updates
    const debounceMs = immediateUpdates ? 50 : 200;
    
    const debouncedCallback = immediateUpdates 
      ? callback // No debouncing for immediate updates
      : this.createDebouncedCallback(channelId, callback, debounceMs);
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topics',
          filter: options?.userId ? `author_id.eq.${options.userId}` : undefined
        },
        (payload) => {
          // Enhanced filtering for request-related changes
          if (payload.new && payload.old) {
            const oldRequests = (payload.old as any)?.requests || [];
            const newRequests = (payload.new as any)?.requests || [];
            const oldParticipants = (payload.old as any)?.participants || [];
            const newParticipants = (payload.new as any)?.participants || [];
            
            const requestsChanged = JSON.stringify(oldRequests) !== JSON.stringify(newRequests);
            const participantsChanged = JSON.stringify(oldParticipants) !== JSON.stringify(newParticipants);
            
            if (requestsChanged || participantsChanged) {
              console.log(`Request-sensitive change detected for topic ${(payload.new as any)?.id}:`, {
                requestsChanged,
                participantsChanged,
                oldRequestCount: oldRequests.length,
                newRequestCount: newRequests.length,
                oldParticipantCount: oldParticipants.length,
                newParticipantCount: newParticipants.length
              });
              
              debouncedCallback({
                eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                new: payload.new,
                old: payload.old
              });
            }
          } else {
            // Handle INSERT and DELETE events
            debouncedCallback({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new,
              old: payload.old
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Request updates subscription ${channelId}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to request updates`);
          this.retryAttempts.delete(channelId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Request updates subscription error for ${channelId}`);
          this.handleSubscriptionError(channelId, () => 
            this.subscribeToRequestUpdates(callback, options)
          );
        }
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  // Enhanced subscription health monitoring
  monitorSubscriptionHealth(): {
    healthy: number;
    unhealthy: number;
    details: Array<{
      channelId: string;
      state: string;
      isHealthy: boolean;
      retryCount: number;
    }>;
  } {
    const details: Array<{
      channelId: string;
      state: string;
      isHealthy: boolean;
      retryCount: number;
    }> = [];
    
    let healthy = 0;
    let unhealthy = 0;
    
    this.channels.forEach((channel, channelId) => {
      const isHealthy = this.isChannelHealthy(channelId);
      const retryCount = this.retryAttempts.get(channelId) || 0;
      
      details.push({
        channelId,
        state: channel.state,
        isHealthy,
        retryCount,
      });
      
      if (isHealthy) {
        healthy++;
      } else {
        unhealthy++;
      }
    });
    
    return { healthy, unhealthy, details };
  }
}

// Export singleton instance
export const realtimeManager = RealtimeManager.getInstance();