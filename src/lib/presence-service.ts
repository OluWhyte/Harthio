// ============================================================================
// PRESENCE SERVICE
// ============================================================================
// Handles user presence in sessions - join/leave events and notifications
// Manages session state and user notifications
// ============================================================================

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceEvent {
  session_id: string;
  user_id: string;
  status: 'active' | 'left';
  joined_at: string;
  last_seen: string;
}

export type PresenceCallback = (event: PresenceEvent) => void;

export class PresenceService {
  private channel: RealtimeChannel | null = null;
  private sessionId: string;
  private userId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  // Join a session and start presence tracking
  async joinSession(): Promise<void> {
    try {
      console.log(`Joining session ${this.sessionId} as user ${this.userId}`);
      
      // Call database function to register presence
      const { data, error } = await (supabase as any).rpc('join_session', {
        p_session_id: this.sessionId,
        p_user_id: this.userId
      });

      if (error) {
        console.error('Failed to join session:', error);
        throw new Error(`Failed to join session: ${error.message}`);
      }

      // Start heartbeat to keep presence alive
      this.startHeartbeat();
      
      console.log('Successfully joined session');
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  }

  // Leave a session and cleanup presence
  async leaveSession(): Promise<void> {
    try {
      console.log(`Leaving session ${this.sessionId} as user ${this.userId}`);
      
      // Stop heartbeat
      this.stopHeartbeat();
      
      // Call database function to update presence
      const { data, error } = await (supabase as any).rpc('leave_session', {
        p_session_id: this.sessionId,
        p_user_id: this.userId
      });

      if (error) {
        console.error('Failed to leave session:', error);
        // Don't throw error on leave - best effort
      }

      console.log('Successfully left session');
    } catch (error) {
      console.error('Error leaving session:', error);
      // Don't throw error on leave - best effort
    }
  }

  // Subscribe to presence changes in the session
  subscribeToPresence(callback: PresenceCallback): void {
    console.log(`Subscribing to presence for session ${this.sessionId}`);
    
    this.channel = supabase
      .channel(`presence-${this.sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_presence',
          filter: `session_id=eq.${this.sessionId}`
        },
        (payload) => {
          console.log('Presence change:', payload);
          
          if (payload.new) {
            callback(payload.new as PresenceEvent);
          }
        }
      )
      .subscribe((status) => {
        console.log('Presence subscription status:', status);
      });
  }

  // Get current active users in the session
  async getActiveUsers(): Promise<PresenceEvent[]> {
    try {
      const { data, error } = await supabase
        .from('session_presence')
        .select('*')
        .eq('session_id', this.sessionId)
        .eq('status', 'active')
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

      if (error) {
        console.error('Failed to get active users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  // Start heartbeat to keep presence alive
  private startHeartbeat(): void {
    // Update presence every 30 seconds
    this.heartbeatInterval = setInterval(async () => {
      try {
        await (supabase as any)
          .from('session_presence')
          .update({ last_seen: new Date().toISOString() })
          .eq('session_id', this.sessionId)
          .eq('user_id', this.userId);
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Unsubscribe from presence updates
  unsubscribe(): void {
    console.log('Unsubscribing from presence');
    
    this.stopHeartbeat();
    
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  // Cleanup when component unmounts
  async cleanup(): Promise<void> {
    await this.leaveSession();
    this.unsubscribe();
  }
}