/**
 * Provider Coordinator
 * Simple system to ensure both users in a session use the same video provider
 * Intelligent selection based on quality and availability
 */

import { supabase } from './supabase';

export type VideoProvider = 'daily' | 'p2p';

export interface ProviderSelection {
  provider: VideoProvider;
  roomId: string;
  reason: string;
}

export interface ProviderQuality {
  provider: VideoProvider;
  score: number; // 0-100, higher is better
  latency?: number;
  connectionTime?: number;
  failures: number;
  lastTested: number;
}

export class ProviderCoordinator {
  private sessionId: string;
  private userId: string;
  private channel: any;
  private providerQualities: Map<VideoProvider, ProviderQuality> = new Map();
  private recoveryCallback: ((selection: ProviderSelection) => void) | null = null;
  
  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    
    // Initialize provider quality tracking
    this.providerQualities.set('daily', {
      provider: 'daily',
      score: 80, // Start with Daily.co preferred
      failures: 0,
      lastTested: 0
    });
    
    this.providerQualities.set('p2p', {
      provider: 'p2p', 
      score: 60, // P2P as backup
      failures: 0,
      lastTested: 0
    });
  }

  /**
   * Initialize coordination channel
   */
  async initialize(): Promise<void> {
    console.log('🎯 Initializing provider coordinator...');
    
    this.channel = supabase.channel(`provider-coord-${this.sessionId}`)
      .on('broadcast', { event: 'provider-selected' }, (payload) => {
        console.log('📡 Received provider selection:', payload.payload);
      })
      .on('broadcast', { event: 'coordinated-recovery' }, (payload) => {
        console.log('🚨 Received coordinated recovery request:', payload.payload);
        this.handleCoordinatedRecoveryRequest(payload.payload);
      })
      .subscribe();
  }

  /**
   * Select the best provider for this session
   * Uses atomic database function to prevent race conditions
   */
  async selectProvider(): Promise<ProviderSelection> {
    console.log('🤔 Selecting best provider for session...');
    
    try {
      // Determine best provider based on quality scores
      const bestProvider = this.getBestProvider();
      const roomId = this.generateRoomId(bestProvider);
      
      console.log(`🎯 Attempting to select ${bestProvider} with room ID: ${roomId}`);
      
      // Use atomic database function to select provider (prevents race conditions)
      const { data, error } = await (supabase as any).rpc('select_session_provider', {
        p_session_id: this.sessionId,
        p_user_id: this.userId,
        p_provider: bestProvider,
        p_room_id: roomId
      });
      
      if (error) {
        console.error('❌ Failed to select provider via database:', error);
        throw new Error(`Provider selection failed: ${error.message}`);
      }
      
      if (!data?.success) {
        console.error('❌ Provider selection returned failure:', data);
        throw new Error('Provider selection failed');
      }
      
      const selection: ProviderSelection = {
        provider: data.provider,
        roomId: data.room_id,
        reason: data.is_new_selection ? 
          `Selected ${data.provider} as first user (score: ${this.providerQualities.get(data.provider)?.score})` :
          `Using existing ${data.provider} selection by ${data.selected_by}`
      };
      
      // Broadcast selection to other users for real-time coordination
      if (data.is_new_selection) {
        await this.broadcastProviderSelection(selection);
      }
      
      console.log('✅ Provider selection successful:', {
        provider: selection.provider,
        roomId: selection.roomId,
        isNewSelection: data.is_new_selection,
        reason: selection.reason
      });
      
      return selection;
      
    } catch (error) {
      console.error('❌ Critical error in provider selection:', error);
      
      // Fallback to P2P if database selection fails
      const fallbackSelection: ProviderSelection = {
        provider: 'p2p',
        roomId: this.sessionId,
        reason: 'Fallback to P2P due to coordination failure'
      };
      
      console.log('🔄 Using fallback provider selection:', fallbackSelection);
      return fallbackSelection;
    }
  }

  /**
   * Report provider performance for quality tracking
   */
  async reportProviderPerformance(
    provider: VideoProvider, 
    success: boolean, 
    metrics?: {
      connectionTime?: number;
      latency?: number;
      quality?: number;
    }
  ): Promise<void> {
    const quality = this.providerQualities.get(provider);
    if (!quality) return;
    
    if (success) {
      // Improve score on success
      quality.score = Math.min(100, quality.score + 5);
      quality.failures = Math.max(0, quality.failures - 1);
      
      if (metrics?.connectionTime) {
        quality.connectionTime = metrics.connectionTime;
      }
      if (metrics?.latency) {
        quality.latency = metrics.latency;
      }
    } else {
      // Decrease score on failure - this is critical for coordinated recovery
      quality.score = Math.max(0, quality.score - 15);
      quality.failures += 1;
      
      console.log(`🚨 Provider ${provider} failed - checking if coordinated recovery needed`);
      
      // If this is a mid-call failure, trigger coordinated recovery
      await this.handleProviderFailureDuringCall(provider);
    }
    
    quality.lastTested = Date.now();
    
    console.log(`📊 Updated ${provider} quality:`, quality);
  }

  /**
   * Handle provider failure during active call - CRITICAL for edge case
   * Uses atomic database function to coordinate recovery across all users
   */
  async handleProviderFailureDuringCall(failedProvider: VideoProvider): Promise<void> {
    console.log(`🚨 CRITICAL: ${failedProvider} failed during active call - coordinating recovery`);
    
    try {
      // Use atomic database function for coordinated recovery
      const { data, error } = await (supabase as any).rpc('coordinate_provider_recovery', {
        p_session_id: this.sessionId,
        p_failed_provider: failedProvider,
        p_initiated_by: this.userId
      });
      
      if (error) {
        console.error('❌ Failed to coordinate recovery via database:', error);
        throw new Error(`Recovery coordination failed: ${error.message}`);
      }
      
      if (!data?.success) {
        console.error('❌ Recovery coordination returned failure:', data);
        throw new Error('Recovery coordination failed');
      }
      
      console.log('✅ Database recovery coordination successful:', {
        failedProvider: data.failed_provider,
        newProvider: data.new_provider,
        roomId: data.room_id,
        affectedUsers: data.affected_users,
        initiatedBy: data.initiated_by
      });
      
      // Create recovery selection object
      const recoverySelection: ProviderSelection = {
        provider: data.new_provider,
        roomId: data.room_id,
        reason: data.recovery_reason
      };
      
      // Broadcast coordinated recovery to ALL users in session for real-time updates
      await this.broadcastCoordinatedRecovery(recoverySelection, failedProvider);
      
      // Update local quality scores
      const failedQuality = this.providerQualities.get(failedProvider);
      if (failedQuality) {
        failedQuality.score = Math.max(0, failedQuality.score - 20); // Penalize failed provider
        failedQuality.failures += 1;
      }
      
      console.log(`✅ Coordinated recovery completed - ${data.affected_users?.length || 0} users switching to ${data.new_provider}`);
      
    } catch (error) {
      console.error('❌ Critical error in coordinated recovery:', error);
      
      // Fallback to simple broadcast if database coordination fails
      const alternativeProvider = failedProvider === 'daily' ? 'p2p' : 'daily';
      const fallbackSelection: ProviderSelection = {
        provider: alternativeProvider,
        roomId: this.sessionId,
        reason: `Fallback recovery from ${failedProvider} failure`
      };
      
      await this.broadcastCoordinatedRecovery(fallbackSelection, failedProvider);
      console.log('🔄 Used fallback recovery coordination');
    }
  }

  /**
   * Broadcast coordinated recovery to all session participants
   */
  private async broadcastCoordinatedRecovery(
    recoverySelection: ProviderSelection, 
    failedProvider: VideoProvider
  ): Promise<void> {
    if (!this.channel) return;
    
    console.log(`📡 Broadcasting coordinated recovery to all session participants`);
    
    await this.channel.send({
      type: 'broadcast',
      event: 'coordinated-recovery',
      payload: {
        sessionId: this.sessionId,
        failedProvider: failedProvider,
        newProvider: recoverySelection.provider,
        roomId: recoverySelection.roomId,
        reason: recoverySelection.reason,
        initiatedBy: this.userId,
        timestamp: Date.now(),
        urgent: true // This is an emergency recovery
      }
    });
  }

  /**
   * Get current provider quality scores
   */
  getProviderQualities(): ProviderQuality[] {
    return Array.from(this.providerQualities.values());
  }

  /**
   * Handle coordinated recovery request from other users
   */
  private async handleCoordinatedRecoveryRequest(payload: any): Promise<void> {
    if (payload.sessionId !== this.sessionId || payload.initiatedBy === this.userId) {
      return; // Ignore if not our session or if we initiated it
    }
    
    console.log(`🚨 COORDINATED RECOVERY: Switching from ${payload.failedProvider} to ${payload.newProvider}`);
    console.log(`📋 Recovery reason: ${payload.reason}`);
    
    // This will trigger the video service manager to switch providers
    // The callback system will handle the actual provider switching
    if (this.recoveryCallback) {
      this.recoveryCallback({
        provider: payload.newProvider,
        roomId: payload.roomId,
        reason: payload.reason
      });
    }
  }

  /**
   * Set recovery callback for coordinated provider switching
   */
  setRecoveryCallback(callback: (selection: ProviderSelection) => void): void {
    this.recoveryCallback = callback;
  }

  /**
   * Cleanup coordinator
   */
  async cleanup(): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
  }

  // Private methods

  private getBestProvider(): VideoProvider {
    // Temporarily disable Daily.co - P2P is working perfectly
    // TODO: Re-enable Daily.co when properly configured with API keys and room creation
    return 'p2p';
    
    /* COMMENTED OUT - Daily.co provider selection
    const dailyQuality = this.providerQualities.get('daily')!;
    const p2pQuality = this.providerQualities.get('p2p')!;
    
    // Prefer P2P as it's more reliable (no room creation needed)
    // Only use Daily.co if it's significantly better than P2P
    if (dailyQuality.score > p2pQuality.score + 30 && dailyQuality.failures === 0) {
      return 'daily';
    }
    
    return 'p2p';
    */
  }

  private generateRoomId(provider: VideoProvider): string {
    if (provider === 'daily') {
      // Use sessionId as Daily.co room name for consistency
      return this.sessionId;
    } else {
      // Use sessionId as P2P channel
      return this.sessionId;
    }
  }

  /**
   * Update user session state in database
   */
  async updateUserSessionState(
    connectionState: string,
    currentProvider: VideoProvider,
    userName: string,
    deviceInfo: any = {}
  ): Promise<void> {
    try {
      const { data, error } = await (supabase as any).rpc('update_user_session_state', {
        p_session_id: this.sessionId,
        p_user_id: this.userId,
        p_user_name: userName,
        p_connection_state: connectionState,
        p_current_provider: currentProvider,
        p_device_info: deviceInfo
      });
      
      if (error) {
        console.warn('Failed to update user session state:', error);
        return;
      }
      
      if (!data?.success) {
        console.warn('User session state update failed:', data?.error);
        return;
      }
      
      console.log('✅ User session state updated:', {
        connectionState,
        currentProvider,
        userName
      });
      
    } catch (error) {
      console.warn('Error updating user session state:', error);
    }
  }

  /**
   * Get current session coordination info
   */
  async getSessionCoordinationInfo(): Promise<any> {
    try {
      const { data, error } = await (supabase as any).rpc('get_session_coordination_info', {
        p_session_id: this.sessionId
      });
      
      if (error) {
        console.warn('Failed to get session coordination info:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Error getting session coordination info:', error);
      return null;
    }
  }

  private async broadcastProviderSelection(selection: ProviderSelection): Promise<void> {
    if (!this.channel) return;
    
    await this.channel.send({
      type: 'broadcast',
      event: 'provider-selected',
      payload: {
        sessionId: this.sessionId,
        userId: this.userId,
        selection: selection,
        timestamp: Date.now()
      }
    });
  }
}

// Global coordinator instance
let globalCoordinator: ProviderCoordinator | null = null;

/**
 * Create provider coordinator for session
 */
export function createProviderCoordinator(sessionId: string, userId: string): ProviderCoordinator {
  if (globalCoordinator) {
    globalCoordinator.cleanup();
  }
  
  globalCoordinator = new ProviderCoordinator(sessionId, userId);
  return globalCoordinator;
}

/**
 * Get current provider coordinator
 */
export function getProviderCoordinator(): ProviderCoordinator | null {
  return globalCoordinator;
}