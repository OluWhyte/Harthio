/**
 * Session Health Monitor
 * Proactive monitoring of connection health and quality
 * Automatic detection of issues and recovery recommendations
 */

import { supabase } from './supabase';
import type {
  UpdateSessionHealthParams,
  UpdateSessionHealthResult,
  HeartbeatPingParams,
  HeartbeatPingResult
} from './database-functions.types';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed';
export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'off';

export interface QualityMetrics {
  videoQuality?: QualityLevel;
  audioQuality?: QualityLevel;
  latency?: number; // milliseconds
  packetLoss?: number; // percentage
  bandwidth?: number; // kbps
  deviceType?: string;
  browserInfo?: any;
  networkType?: string; // wifi, cellular, ethernet, unknown
}

export interface HealthAlert {
  type: 'stale_connections' | 'poor_quality' | 'failed_connections';
  severity: 'info' | 'warning' | 'error';
  count: number;
  message: string;
}

export interface SessionHealthOverview {
  sessionId: string;
  users: Array<{
    userId: string;
    connectionStatus: ConnectionStatus;
    videoQuality?: QualityLevel;
    audioQuality?: QualityLevel;
    networkLatency?: number;
    packetLossPercent?: number;
    bandwidthKbps?: number;
    deviceType?: string;
    networkType?: string;
    lastPing: string;
    connectedAt?: string;
    disconnectedAt?: string;
    pingAgeSeconds: number;
  }>;
  stats: {
    totalUsers: number;
    connectedUsers: number;
    reconnectingUsers: number;
    failedUsers: number;
    avgLatency?: number;
    avgPacketLoss?: number;
    avgBandwidth?: number;
    staleConnections: number;
  };
  generatedAt: string;
}

export interface HealthMonitorCallbacks {
  onHealthChange?: (overview: SessionHealthOverview) => void;
  onAlert?: (alerts: HealthAlert[]) => void;
  onRecoveryRecommended?: (reason: string, metrics: any) => void;
  onStaleConnectionDetected?: (userIds: string[]) => void;
}

export class SessionHealthMonitor {
  private sessionId: string;
  private userId: string;
  private callbacks: HealthMonitorCallbacks;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private lastHealthOverview: SessionHealthOverview | null = null;

  constructor(
    sessionId: string,
    userId: string,
    callbacks: HealthMonitorCallbacks = {}
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.callbacks = callbacks;
  }

  /**
   * Start health monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Health monitoring already started');
      return;
    }

    console.log('🏥 Starting session health monitoring...');
    this.isMonitoring = true;

    // Start heartbeat (every 15 seconds)
    this.startHeartbeat();

    // Start health monitoring (every 10 seconds)
    this.startHealthChecks();

    console.log('✅ Session health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    console.log('🏥 Stopping session health monitoring...');
    this.isMonitoring = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('✅ Session health monitoring stopped');
  }

  /**
   * Update health status with quality metrics
   */
  async updateHealth(
    status: ConnectionStatus,
    metrics: QualityMetrics = {}
  ): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('update_session_health', {
        p_session_id: this.sessionId,
        p_user_id: this.userId,
        p_status: status,
        p_quality_metrics: metrics
      } as UpdateSessionHealthParams);

      if (error) {
        console.error('❌ Failed to update session health:', error);
        return false;
      }

      const result = data as UpdateSessionHealthResult;

      if (!result?.success) {
        console.error('❌ Health update failed:', result?.error);
        return false;
      }

      console.log('✅ Health updated:', {
        status,
        metrics: Object.keys(metrics)
      });

      return true;
    } catch (error) {
      console.error('❌ Error updating health:', error);
      return false;
    }
  }

  /**
   * Get current session health overview
   */
  async getHealthOverview(): Promise<SessionHealthOverview | null> {
    try {
      const { data, error } = await (supabase as any).rpc('get_session_health_overview', {
        p_session_id: this.sessionId
      });

      if (error) {
        console.error('❌ Failed to get health overview:', error);
        return null;
      }

      return data as SessionHealthOverview;
    } catch (error) {
      console.error('❌ Error getting health overview:', error);
      return null;
    }
  }

  /**
   * Detect stale connections
   */
  async detectStaleConnections(): Promise<{
    staleUsersDetected: boolean;
    staleUserIds: string[];
    recoveryNeeded: boolean;
  } | null> {
    try {
      const { data, error } = await (supabase as any).rpc('detect_stale_connections', {
        p_session_id: this.sessionId
      });

      if (error) {
        console.error('❌ Failed to detect stale connections:', error);
        return null;
      }

      if (data?.stale_users_detected) {
        console.log('⚠️ Stale connections detected:', data.stale_user_ids);
        this.callbacks.onStaleConnectionDetected?.(data.stale_user_ids);
      }

      return {
        staleUsersDetected: data?.stale_users_detected || false,
        staleUserIds: data?.stale_user_ids || [],
        recoveryNeeded: data?.recovery_needed || false
      };
    } catch (error) {
      console.error('❌ Error detecting stale connections:', error);
      return null;
    }
  }

  /**
   * Get recovery recommendation based on quality
   */
  async getRecoveryRecommendation(): Promise<{
    recommendation: string;
    shouldRecover: boolean;
    metrics: any;
  } | null> {
    try {
      const { data, error } = await (supabase as any).rpc('recommend_quality_recovery', {
        p_session_id: this.sessionId
      });

      if (error) {
        console.error('❌ Failed to get recovery recommendation:', error);
        return null;
      }

      if (data?.should_recover) {
        console.log('🚨 Recovery recommended:', data.recommendation);
        this.callbacks.onRecoveryRecommended?.(data.recommendation, data.metrics);
      }

      return {
        recommendation: data?.recommendation || 'unknown',
        shouldRecover: data?.should_recover || false,
        metrics: data?.metrics || {}
      };
    } catch (error) {
      console.error('❌ Error getting recovery recommendation:', error);
      return null;
    }
  }

  /**
   * Get current health alerts
   */
  async getHealthAlerts(): Promise<HealthAlert[]> {
    try {
      const { data, error } = await (supabase as any).rpc('get_session_health_alerts', {
        p_session_id: this.sessionId
      });

      if (error) {
        console.error('❌ Failed to get health alerts:', error);
        return [];
      }

      const alerts = data?.alerts || [];
      
      if (alerts.length > 0) {
        console.log('⚠️ Health alerts:', alerts);
        this.callbacks.onAlert?.(alerts);
      }

      return alerts;
    } catch (error) {
      console.error('❌ Error getting health alerts:', error);
      return [];
    }
  }

  /**
   * Send heartbeat ping
   */
  async sendHeartbeat(): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('heartbeat_ping', {
        p_session_id: this.sessionId,
        p_user_id: this.userId
      } as HeartbeatPingParams);

      if (error) {
        console.warn('⚠️ Heartbeat failed:', error);
        return false;
      }

      const result = data as HeartbeatPingResult;
      return result?.success || false;
    } catch (error) {
      console.warn('⚠️ Heartbeat error:', error);
      return false;
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.isMonitoring) {
        await this.sendHeartbeat();
      }
    }, 15000); // Every 15 seconds
  }

  /**
   * Start health monitoring checks
   */
  private startHealthChecks(): void {
    this.monitoringInterval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        // Get current health overview
        const overview = await this.getHealthOverview();
        if (overview) {
          // Check if health changed significantly
          if (this.hasHealthChanged(overview)) {
            this.callbacks.onHealthChange?.(overview);
            this.lastHealthOverview = overview;
          }
        }

        // Check for stale connections
        await this.detectStaleConnections();

        // Check for recovery recommendations
        await this.getRecoveryRecommendation();

        // Get current alerts
        await this.getHealthAlerts();

      } catch (error) {
        console.error('❌ Health monitoring check failed:', error);
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Check if health overview has changed significantly
   */
  private hasHealthChanged(newOverview: SessionHealthOverview): boolean {
    if (!this.lastHealthOverview) return true;

    const oldStats = this.lastHealthOverview.stats;
    const newStats = newOverview.stats;

    // Check for significant changes
    return (
      oldStats.connectedUsers !== newStats.connectedUsers ||
      oldStats.reconnectingUsers !== newStats.reconnectingUsers ||
      oldStats.failedUsers !== newStats.failedUsers ||
      oldStats.staleConnections !== newStats.staleConnections ||
      Math.abs((oldStats.avgLatency || 0) - (newStats.avgLatency || 0)) > 100 ||
      Math.abs((oldStats.avgPacketLoss || 0) - (newStats.avgPacketLoss || 0)) > 2
    );
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    sessionId: string;
    userId: string;
    hasHeartbeat: boolean;
    hasHealthChecks: boolean;
  } {
    return {
      isMonitoring: this.isMonitoring,
      sessionId: this.sessionId,
      userId: this.userId,
      hasHeartbeat: this.heartbeatInterval !== null,
      hasHealthChecks: this.monitoringInterval !== null
    };
  }
}

/**
 * Create session health monitor instance
 */
export function createSessionHealthMonitor(
  sessionId: string,
  userId: string,
  callbacks: HealthMonitorCallbacks = {}
): SessionHealthMonitor {
  return new SessionHealthMonitor(sessionId, userId, callbacks);
}