/**
 * Session Quality Logger
 * Aggregates WebRTC stats during calls and saves summary for post-call analysis
 * Database-efficient: Only writes once at session end, not during call
 */

import { supabase } from './supabase';

export interface SessionQualityMetrics {
  sessionId: string;
  userId: string;
  
  // Connection Quality Summary
  avgLatency: number;
  maxLatency: number;
  minLatency: number;
  
  avgPacketLoss: number;
  maxPacketLoss: number;
  
  avgBandwidth: number;
  minBandwidth: number;
  maxBandwidth: number;
  
  // Video Quality Summary
  avgFrameRate: number;
  minFrameRate: number;
  resolutions: string[]; // All resolutions used during call
  
  // Connection Stability
  qualityChanges: number; // How many times quality changed
  connectionDrops: number; // How many times connection was lost
  recoveryAttempts: number;
  
  // Overall Session Quality
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  qualityScore: number; // 0-100
  
  // Session Duration
  sessionDuration: number; // milliseconds
  qualityDuration: number; // milliseconds of good+ quality
  
  // Timestamps
  sessionStarted: Date;
  sessionEnded: Date;
  
  // Additional Context
  provider: 'p2p' | 'daily' | 'fallback';
  deviceInfo?: {
    userAgent: string;
    platform: string;
    isMobile: boolean;
  };
}

export interface RealTimeStats {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  frameRate: number;
  resolution: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  timestamp: number;
}

export class SessionQualityLogger {
  private sessionId: string;
  private userId: string;
  private provider: 'p2p' | 'daily' | 'fallback';
  
  private statsHistory: RealTimeStats[] = [];
  private qualityChanges = 0;
  private connectionDrops = 0;
  private recoveryAttempts = 0;
  private lastQuality: string | null = null;
  
  private sessionStartTime: number;
  private sessionEndTime: number | null = null;
  
  constructor(sessionId: string, userId: string, provider: 'p2p' | 'daily' | 'fallback') {
    this.sessionId = sessionId;
    this.userId = userId;
    this.provider = provider;
    this.sessionStartTime = Date.now();
    
    console.log(`📊 Session quality logging started for ${sessionId} (${provider})`);  }


  /**
   * Record real-time stats (called every 3 seconds during call)
   * Keeps data in memory only - no database writes during call
   */
  recordStats(stats: RealTimeStats): void {
    // Add timestamp if not provided
    if (!stats.timestamp) {
      stats.timestamp = Date.now();
    }
    
    // Track quality changes
    if (this.lastQuality && this.lastQuality !== stats.quality) {
      this.qualityChanges++;
      console.log(`📊 Quality change: ${this.lastQuality} → ${stats.quality}`);
    }
    this.lastQuality = stats.quality;
    
    // Track connection drops
    if (stats.quality === 'failed') {
      this.connectionDrops++;
    }
    
    // Store stats in memory
    this.statsHistory.push(stats);
    
    // Keep only last 100 entries to prevent memory issues on long calls
    if (this.statsHistory.length > 100) {
      this.statsHistory = this.statsHistory.slice(-100);
    }
  }

  /**
   * Record recovery attempt
   */
  recordRecoveryAttempt(): void {
    this.recoveryAttempts++;
    console.log(`🔄 Recovery attempt #${this.recoveryAttempts} for session ${this.sessionId}`);
  }

  /**
   * End session and save quality summary to database
   * This is the ONLY database write - happens once per session
   */
  async endSession(): Promise<void> {
    this.sessionEndTime = Date.now();
    
    if (this.statsHistory.length === 0) {
      console.log('📊 No stats recorded for session', this.sessionId);
      return;
    }

    try {
      const metrics = this.calculateMetrics();
      await this.saveToDatabase(metrics);
      
      console.log(`📊 Session quality summary saved for ${this.sessionId}:`, {
        overallQuality: metrics.overallQuality,
        qualityScore: metrics.qualityScore,
        avgLatency: metrics.avgLatency,
        qualityChanges: metrics.qualityChanges
      });
      
    } catch (error) {
      console.error('❌ Failed to save session quality metrics:', error);
    }
  }

  /**
   * Calculate aggregated metrics from stats history
   */
  private calculateMetrics(): SessionQualityMetrics {
    const validStats = this.statsHistory.filter(s => 
      s.latency > 0 && s.latency < 10000 // Filter out invalid readings
    );

    if (validStats.length === 0) {
      throw new Error('No valid stats to calculate metrics');
    }

    // Latency metrics
    const latencies = validStats.map(s => s.latency);
    const avgLatency = Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length);
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);

    // Packet loss metrics
    const packetLosses = validStats.map(s => s.packetLoss);
    const avgPacketLoss = Math.round((packetLosses.reduce((sum, p) => sum + p, 0) / packetLosses.length) * 100) / 100;
    const maxPacketLoss = Math.max(...packetLosses);

    // Bandwidth metrics
    const bandwidths = validStats.map(s => s.bandwidth);
    const avgBandwidth = Math.round(bandwidths.reduce((sum, b) => sum + b, 0) / bandwidths.length);
    const minBandwidth = Math.min(...bandwidths);
    const maxBandwidth = Math.max(...bandwidths);

    // Frame rate metrics
    const frameRates = validStats.map(s => s.frameRate).filter(f => f > 0);
    const avgFrameRate = frameRates.length > 0 
      ? Math.round(frameRates.reduce((sum, f) => sum + f, 0) / frameRates.length)
      : 0;
    const minFrameRate = frameRates.length > 0 ? Math.min(...frameRates) : 0;

    // Resolution tracking
    const resolutions = [...new Set(validStats.map(s => s.resolution).filter(r => r && r !== 'unknown'))];

    // Quality duration calculation
    const goodQualityStats = validStats.filter(s => 
      s.quality === 'excellent' || s.quality === 'good'
    );
    const qualityDuration = goodQualityStats.length * 3000; // 3 seconds per stat

    // Overall quality calculation
    const qualityScores = validStats.map(s => {
      switch (s.quality) {
        case 'excellent': return 100;
        case 'good': return 80;
        case 'fair': return 60;
        case 'poor': return 40;
        case 'failed': return 0;
        default: return 50;
      }
    });
    
    const qualityScore: number = Math.round(qualityScores.reduce((sum: number, q) => sum + q, 0) / qualityScores.length);
    
    let overallQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
    if (qualityScore >= 90) overallQuality = 'excellent';
    else if (qualityScore >= 75) overallQuality = 'good';
    else if (qualityScore >= 60) overallQuality = 'fair';
    else if (qualityScore >= 30) overallQuality = 'poor';
    else overallQuality = 'failed';

    // Session duration
    const sessionDuration = this.sessionEndTime! - this.sessionStartTime;

    // Device info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      
      avgLatency,
      maxLatency,
      minLatency,
      
      avgPacketLoss,
      maxPacketLoss,
      
      avgBandwidth,
      minBandwidth,
      maxBandwidth,
      
      avgFrameRate,
      minFrameRate,
      resolutions,
      
      qualityChanges: this.qualityChanges,
      connectionDrops: this.connectionDrops,
      recoveryAttempts: this.recoveryAttempts,
      
      overallQuality,
      qualityScore,
      
      sessionDuration,
      qualityDuration,
      
      sessionStarted: new Date(this.sessionStartTime),
      sessionEnded: new Date(this.sessionEndTime!),
      
      provider: this.provider,
      deviceInfo
    };
  }

  /**
   * Save metrics to database - single write per session
   */
  private async saveToDatabase(metrics: SessionQualityMetrics): Promise<void> {
    
    const { error } = await supabase
      .from('session_quality_logs')
      .insert({
        session_id: metrics.sessionId,
        user_id: metrics.userId,
        
        // Connection metrics
        avg_latency: metrics.avgLatency,
        max_latency: metrics.maxLatency,
        min_latency: metrics.minLatency,
        avg_packet_loss: metrics.avgPacketLoss,
        max_packet_loss: metrics.maxPacketLoss,
        avg_bandwidth: metrics.avgBandwidth,
        min_bandwidth: metrics.minBandwidth,
        max_bandwidth: metrics.maxBandwidth,
        
        // Video metrics
        avg_frame_rate: metrics.avgFrameRate,
        min_frame_rate: metrics.minFrameRate,
        resolutions: metrics.resolutions,
        
        // Stability metrics
        quality_changes: metrics.qualityChanges,
        connection_drops: metrics.connectionDrops,
        recovery_attempts: metrics.recoveryAttempts,
        
        // Overall quality
        overall_quality: metrics.overallQuality,
        quality_score: metrics.qualityScore,
        
        // Duration metrics
        session_duration: metrics.sessionDuration,
        quality_duration: metrics.qualityDuration,
        
        // Timestamps
        session_started: metrics.sessionStarted.toISOString(),
        session_ended: metrics.sessionEnded.toISOString(),
        
        // Context
        provider: metrics.provider,
        device_info: metrics.deviceInfo,
        
        created_at: new Date().toISOString()
      } as any);

    if (error) {
      throw error;
    }
  }

  /**
   * Get current session stats summary (for real-time display)
   */
  getCurrentSummary(): {
    statsCount: number;
    avgLatency: number;
    avgQuality: string;
    qualityChanges: number;
    connectionDrops: number;
  } {
    if (this.statsHistory.length === 0) {
      return {
        statsCount: 0,
        avgLatency: 0,
        avgQuality: 'unknown',
        qualityChanges: 0,
        connectionDrops: 0
      };
    }

    const validStats = this.statsHistory.filter(s => s.latency > 0 && s.latency < 10000);
    const avgLatency = validStats.length > 0 
      ? Math.round(validStats.reduce((sum, s) => sum + s.latency, 0) / validStats.length)
      : 0;

    // Most common quality in recent stats
    const recentStats = this.statsHistory.slice(-10);
    const qualityCounts = recentStats.reduce((counts, s) => {
      counts[s.quality] = (counts[s.quality] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const avgQuality = Object.entries(qualityCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

    return {
      statsCount: this.statsHistory.length,
      avgLatency,
      avgQuality,
      qualityChanges: this.qualityChanges,
      connectionDrops: this.connectionDrops
    };
  }
}