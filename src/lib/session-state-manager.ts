/**
 * Session State Manager
 * Integrates with database-level session coordination
 * Provides centralized session state management with atomic operations
 */

import { supabase } from './supabase';
import type {
  SelectSessionProviderParams,
  SelectSessionProviderResult,
  CoordinateProviderRecoveryParams,
  CoordinateProviderRecoveryResult,
  UpdateUserSessionStateParams,
  UpdateUserSessionStateResult
} from './database-functions.types';

export type SessionConnectionState = 'initializing' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'ended';
export type VideoProvider = 'daily' | 'p2p' | 'none';

export interface SessionStateInfo {
  sessionId: string;
  activeProvider: VideoProvider;
  fallbackProvider: VideoProvider;
  roomInfo: {
    roomId: string;
    selectedBy: string;
    selectedAt: string;
    recoveryFrom?: string;
    recoveryReason?: string;
  };
  lastProviderChange: string;
  reconnectionInProgress: boolean;
}

export interface UserSessionState {
  userId: string;
  userName: string;
  connectionState: SessionConnectionState;
  currentProvider: VideoProvider;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  lastSeen: string;
  reconnectAttempts: number;
  deviceInfo: any;
}

export interface SessionCoordinationInfo {
  session: SessionStateInfo;
  users: UserSessionState[];
}

export class SessionStateManager {
  private sessionId: string;
  private userId: string;
  private userName: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private stateChangeCallbacks: ((info: SessionCoordinationInfo) => void)[] = [];

  constructor(sessionId: string, userId: string, userName: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userName = userName;
  }

  /**
   * Initialize session state management
   */
  async initialize(): Promise<void> {
    console.log('🎯 Initializing session state manager...');
    
    // Update initial user state
    await this.updateUserState('initializing', 'none');
    
    // Start heartbeat to maintain presence
    this.startHeartbeat();
    
    console.log('✅ Session state manager initialized');
  }

  /**
   * Update user session state
   */
  async updateUserState(
    connectionState: SessionConnectionState,
    currentProvider: VideoProvider,
    deviceInfo: any = {}
  ): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('update_user_session_state', {
        p_session_id: this.sessionId,
        p_user_id: this.userId,
        p_user_name: this.userName,
        p_connection_state: connectionState,
        p_current_provider: currentProvider,
        p_device_info: deviceInfo
      } as UpdateUserSessionStateParams);
      
      if (error) {
        console.error('❌ Failed to update user session state:', error);
        return false;
      }
      
      const result = data as UpdateUserSessionStateResult;
      
      if (!result?.success) {
        console.error('❌ User session state update failed:', result?.error);
        return false;
      }
      
      console.log('✅ User session state updated:', {
        connectionState,
        currentProvider,
        deviceInfo: Object.keys(deviceInfo)
      });
      
      // Notify callbacks of state change
      await this.notifyStateChange();
      
      return true;
    } catch (error) {
      console.error('❌ Error updating user session state:', error);
      return false;
    }
  }

  /**
   * Get current session coordination info
   */
  async getSessionInfo(): Promise<SessionCoordinationInfo | null> {
    try {
      const { data, error } = await (supabase as any).rpc('get_session_coordination_info', {
        p_session_id: this.sessionId
      });
      
      if (error) {
        console.error('❌ Failed to get session coordination info:', error);
        return null;
      }
      
      return data as SessionCoordinationInfo;
    } catch (error) {
      console.error('❌ Error getting session coordination info:', error);
      return null;
    }
  }

  /**
   * Select provider atomically
   */
  async selectProvider(provider: VideoProvider, roomId: string): Promise<{
    success: boolean;
    provider: VideoProvider;
    roomId: string;
    isNewSelection: boolean;
    selectedBy: string;
    reason: string;
  } | null> {
    try {
      const { data, error } = await (supabase as any).rpc('select_session_provider', {
        p_session_id: this.sessionId,
        p_user_id: this.userId,
        p_provider: provider,
        p_room_id: roomId
      } as SelectSessionProviderParams);
      
      if (error) {
        console.error('❌ Failed to select provider:', error);
        return null;
      }
      
      const result = data as SelectSessionProviderResult;
      
      if (!result?.success) {
        console.error('❌ Provider selection failed:', result?.error);
        return null;
      }
      
      console.log('✅ Provider selection result:', {
        provider: result.provider,
        roomId: result.room_id,
        isNewSelection: result.is_new_selection,
        selectedBy: result.selected_by
      });
      
      return {
        success: true,
        provider: result.provider as VideoProvider,
        roomId: result.room_id,
        isNewSelection: result.is_new_selection,
        selectedBy: result.selected_by,
        reason: result.reason
      };
    } catch (error) {
      console.error('❌ Error selecting provider:', error);
      return null;
    }
  }

  /**
   * Coordinate provider recovery
   */
  async coordinateRecovery(failedProvider: VideoProvider): Promise<{
    success: boolean;
    newProvider: VideoProvider;
    roomId: string;
    affectedUsers: string[];
    recoveryReason: string;
  } | null> {
    try {
      const { data, error } = await (supabase as any).rpc('coordinate_provider_recovery', {
        p_session_id: this.sessionId,
        p_failed_provider: failedProvider,
        p_initiated_by: this.userId
      } as CoordinateProviderRecoveryParams);
      
      if (error) {
        console.error('❌ Failed to coordinate recovery:', error);
        return null;
      }
      
      const result = data as CoordinateProviderRecoveryResult;
      
      if (!result?.success) {
        console.error('❌ Recovery coordination failed:', result?.error);
        return null;
      }
      
      console.log('✅ Recovery coordination result:', {
        failedProvider: result.failed_provider,
        newProvider: result.new_provider,
        roomId: result.room_id,
        affectedUsers: result.affected_users
      });
      
      return {
        success: true,
        newProvider: result.new_provider as VideoProvider,
        roomId: result.room_id,
        affectedUsers: result.affected_users || [],
        recoveryReason: result.recovery_reason
      };
    } catch (error) {
      console.error('❌ Error coordinating recovery:', error);
      return null;
    }
  }

  /**
   * Update audio/video toggle states
   */
  async updateMediaState(isAudioMuted: boolean, isVideoOff: boolean): Promise<void> {
    try {
      // Use function call instead of direct table update
      const { data, error } = await (supabase as any).rpc('update_user_session_state', {
        p_session_id: this.sessionId,
        p_user_id: this.userId,
        p_user_name: this.userName,
        p_connection_state: 'connected', // Assume connected if updating media
        p_current_provider: 'p2p', // Current provider
        p_device_info: {
          is_audio_muted: isAudioMuted,
          is_video_off: isVideoOff,
          updated_at: new Date().toISOString()
        }
      } as UpdateUserSessionStateParams);
      
      if (error) {
        console.warn('Failed to update media state via function:', error);
        return;
      }
      
      console.log('✅ Media state updated via function:', { isAudioMuted, isVideoOff });
    } catch (error) {
      console.warn('Error updating media state:', error);
    }
  }

  /**
   * Subscribe to session state changes
   */
  onStateChange(callback: (info: SessionCoordinationInfo) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Remove state change callback
   */
  offStateChange(callback: (info: SessionCoordinationInfo) => void): void {
    this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Start heartbeat to maintain presence
   */
  private startHeartbeat(): void {
    // Update presence every 15 seconds using function call
    this.heartbeatInterval = setInterval(async () => {
      try {
        const { data, error } = await (supabase as any).rpc('heartbeat_ping', {
          p_session_id: this.sessionId,
          p_user_id: this.userId
        });
        
        if (error) {
          console.warn('Heartbeat function failed:', error);
        } else {
          // Success - no need to log every heartbeat
        }
      } catch (error) {
        console.warn('Heartbeat error:', error);
      }
    }, 15000);
  }

  /**
   * Notify callbacks of state changes
   */
  private async notifyStateChange(): Promise<void> {
    if (this.stateChangeCallbacks.length === 0) return;
    
    const sessionInfo = await this.getSessionInfo();
    if (sessionInfo) {
      this.stateChangeCallbacks.forEach(callback => {
        try {
          callback(sessionInfo);
        } catch (error) {
          console.error('Error in state change callback:', error);
        }
      });
    }
  }

  /**
   * Cleanup session state manager
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up session state manager...');
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Update user state to ended
    await this.updateUserState('ended', 'none');
    
    // Clear callbacks
    this.stateChangeCallbacks = [];
    
    console.log('✅ Session state manager cleanup complete');
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalUsers: number;
    connectedUsers: number;
    currentProvider: VideoProvider;
    reconnectionInProgress: boolean;
    lastProviderChange: string;
  } | null> {
    const sessionInfo = await this.getSessionInfo();
    if (!sessionInfo) return null;
    
    const connectedUsers = sessionInfo.users.filter(
      user => user.connectionState === 'connected'
    ).length;
    
    return {
      totalUsers: sessionInfo.users.length,
      connectedUsers,
      currentProvider: sessionInfo.session.activeProvider,
      reconnectionInProgress: sessionInfo.session.reconnectionInProgress,
      lastProviderChange: sessionInfo.session.lastProviderChange
    };
  }
}

/**
 * Create session state manager instance
 */
export function createSessionStateManager(
  sessionId: string,
  userId: string,
  userName: string
): SessionStateManager {
  return new SessionStateManager(sessionId, userId, userName);
}