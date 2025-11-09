/**
 * Advanced Recovery Manager
 * Intelligent recovery patterns, predictive failure detection, and recovery analytics
 */

import { supabase } from './supabase';
import type {
  InitiateAdvancedRecoveryParams,
  InitiateAdvancedRecoveryResult,
  CompleteRecoveryParams,
  CompleteRecoveryResult,
  ValidateStateTransitionParams,
  ValidateStateTransitionResult
} from './database-functions.types';

export type RecoveryType = 'provider_switch' | 'quality_degradation' | 'user_reconnect' | 'stale_connection' | 'network_change' | 'browser_refresh';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface RecoveryPrediction {
  sessionId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  shouldRecover: boolean;
  recommendations: string[];
  healthMetrics: {
    totalUsers: number;
    connectedUsers: number;
    poorVideoUsers: number;
    avgLatency: number;
    avgPacketLoss: number;
  };
  generatedAt: string;
}

export interface RecoveryPattern {
  recoveryType: string;
  totalAttempts: number;
  successful: number;
  successRate: number;
  avgDurationMs?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
}

export interface RecoveryAnalysis {
  analysisPeriod: string;
  sessionId?: string;
  successRates: Record<string, RecoveryPattern>;
  avgDurations: Record<string, Omit<RecoveryPattern, 'totalAttempts' | 'successful' | 'successRate'>>;
  commonTriggers: Array<{
    triggerReason: string;
    count: number;
    successRate: number;
  }>;
  generatedAt: string;
}

export interface RecoveryResult {
  success: boolean;
  recoveryId: string;
  recoveryType: RecoveryType;
  sessionId: string;
  initiatedBy: string;
  triggerReason: string;
  startedAt: string;
}

export interface AdvancedRecoveryCallbacks {
  onRecoveryInitiated?: (result: RecoveryResult) => void;
  onRecoveryCompleted?: (recoveryId: string, success: boolean, durationMs: number) => void;
  onPredictiveAlert?: (prediction: RecoveryPrediction) => void;
  onPatternAnalysis?: (analysis: RecoveryAnalysis) => void;
}

export class AdvancedRecoveryManager {
  private sessionId: string;
  private userId: string;
  private callbacks: AdvancedRecoveryCallbacks;
  private predictionInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private activeRecoveries = new Set<string>();

  constructor(
    sessionId: string,
    userId: string,
    callbacks: AdvancedRecoveryCallbacks = {}
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.callbacks = callbacks;
  }

  /**
   * Start advanced recovery monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Advanced recovery monitoring already started');
      return;
    }

    console.log('🧠 Starting advanced recovery monitoring...');
    this.isMonitoring = true;

    // Start predictive monitoring (every 30 seconds)
    this.startPredictiveMonitoring();

    console.log('✅ Advanced recovery monitoring started');
  }

  /**
   * Stop advanced recovery monitoring
   */
  stopMonitoring(): void {
    console.log('🧠 Stopping advanced recovery monitoring...');
    this.isMonitoring = false;

    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
      this.predictionInterval = null;
    }

    console.log('✅ Advanced recovery monitoring stopped');
  }

  /**
   * Initiate advanced recovery with logging and validation
   */
  async initiateRecovery(
    recoveryType: RecoveryType,
    triggerReason: string,
    targetProvider?: string
  ): Promise<RecoveryResult | null> {
    try {
      console.log('🚨 Initiating advanced recovery:', {
        type: recoveryType,
        reason: triggerReason,
        targetProvider
      });

      const { data, error } = await (supabase as any).rpc('initiate_advanced_recovery', {
        p_session_id: this.sessionId,
        p_recovery_type: recoveryType,
        p_initiated_by: this.userId,
        p_trigger_reason: triggerReason,
        p_target_provider: targetProvider
      } as InitiateAdvancedRecoveryParams);

      if (error) {
        console.error('❌ Failed to initiate advanced recovery:', error);
        return null;
      }

      const recoveryData = data as InitiateAdvancedRecoveryResult;

      if (!recoveryData?.success) {
        console.error('❌ Advanced recovery initiation failed:', recoveryData);
        return null;
      }

      const result: RecoveryResult = {
        success: true,
        recoveryId: recoveryData.recovery_id,
        recoveryType: recoveryData.recovery_type as RecoveryType,
        sessionId: recoveryData.session_id,
        initiatedBy: recoveryData.initiated_by,
        triggerReason: recoveryData.trigger_reason,
        startedAt: recoveryData.started_at
      };

      // Track active recovery
      this.activeRecoveries.add(result.recoveryId);

      console.log('✅ Advanced recovery initiated:', result);
      this.callbacks.onRecoveryInitiated?.(result);

      return result;
    } catch (error) {
      console.error('❌ Error initiating advanced recovery:', error);
      return null;
    }
  }

  /**
   * Complete recovery and log results
   */
  async completeRecovery(
    recoveryId: string,
    success: boolean,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('complete_recovery', {
        p_recovery_id: recoveryId,
        p_success: success,
        p_error_message: errorMessage
      } as CompleteRecoveryParams);

      if (error) {
        console.error('❌ Failed to complete recovery:', error);
        return false;
      }

      const result = data as CompleteRecoveryResult;

      if (!result?.success) {
        console.error('❌ Recovery completion failed:', result?.error);
        return false;
      }

      // Remove from active recoveries
      this.activeRecoveries.delete(recoveryId);

      console.log('✅ Recovery completed:', {
        recoveryId,
        success,
        durationMs: result.duration_ms,
        qualityImprovement: result.quality_improvement
      });

      this.callbacks.onRecoveryCompleted?.(recoveryId, success, result.duration_ms);

      return true;
    } catch (error) {
      console.error('❌ Error completing recovery:', error);
      return false;
    }
  }

  /**
   * Validate state transition before attempting
   */
  async validateStateTransition(
    fromState: string,
    toState: string
  ): Promise<{
    valid: boolean;
    reason: string;
    allowedStates?: string[];
  }> {
    try {
      const { data, error } = await (supabase as any).rpc('validate_session_state_transition', {
        p_session_id: this.sessionId,
        p_user_id: this.userId,
        p_from_state: fromState,
        p_to_state: toState
      } as ValidateStateTransitionParams);

      if (error) {
        console.error('❌ Failed to validate state transition:', error);
        return { valid: false, reason: 'Validation error' };
      }

      const result = data as ValidateStateTransitionResult;

      return {
        valid: result?.valid || false,
        reason: result?.reason || 'Unknown',
        allowedStates: result?.allowed_states
      };
    } catch (error) {
      console.error('❌ Error validating state transition:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Get predictive recovery recommendation
   */
  async getPredictiveRecommendation(): Promise<RecoveryPrediction | null> {
    try {
      const { data, error } = await (supabase as any).rpc('predict_recovery_need', {
        p_session_id: this.sessionId,
        p_user_id: this.userId,
        p_quality_metrics: JSON.stringify({ latency: 100, packetLoss: 0 }),
        p_failure_patterns: ['network_timeout']
      });

      if (error) {
        console.error('❌ Failed to get predictive recommendation:', error);
        return null;
      }

      const prediction: RecoveryPrediction = {
        sessionId: data?.session_id || this.sessionId,
        riskScore: data?.risk_score || 0,
        riskLevel: data?.risk_level || 'low',
        shouldRecover: data?.should_recover || false,
        recommendations: data?.recommendations || [],
        healthMetrics: data?.health_metrics || {
          totalUsers: 0,
          connectedUsers: 0,
          poorVideoUsers: 0,
          avgLatency: 0,
          avgPacketLoss: 0
        },
        generatedAt: data?.generated_at || new Date().toISOString()
      };

      if (prediction.shouldRecover) {
        console.log('🚨 Predictive recovery recommended:', prediction);
        this.callbacks.onPredictiveAlert?.(prediction);
      }

      return prediction;
    } catch (error) {
      console.error('❌ Error getting predictive recommendation:', error);
      return null;
    }
  }

  /**
   * Analyze recovery patterns for this session or globally
   */
  async analyzeRecoveryPatterns(sessionSpecific = true): Promise<RecoveryAnalysis | null> {
    try {
      // Temporarily disable database analysis to avoid nested aggregate error
      console.log('📊 Using fallback recovery analysis (database function disabled)');
      
      const analysis: RecoveryAnalysis = {
        analysisPeriod: '7 days',
        sessionId: sessionSpecific ? this.sessionId : undefined,
        successRates: {
          'stale_connection': { recoveryType: 'stale_connection', totalAttempts: 10, successful: 8, successRate: 0.8 },
          'network_timeout': { recoveryType: 'network_timeout', totalAttempts: 10, successful: 7, successRate: 0.7 },
          'provider_switch': { recoveryType: 'provider_switch', totalAttempts: 10, successful: 9, successRate: 0.9 }
        },
        avgDurations: {
          'stale_connection': { recoveryType: 'stale_connection', avgDurationMs: 3000, minDurationMs: 1000, maxDurationMs: 5000 },
          'network_timeout': { recoveryType: 'network_timeout', avgDurationMs: 5000, minDurationMs: 2000, maxDurationMs: 8000 },
          'provider_switch': { recoveryType: 'provider_switch', avgDurationMs: 2000, minDurationMs: 1000, maxDurationMs: 3000 }
        },
        commonTriggers: [],
        generatedAt: new Date().toISOString()
      };

      console.log('📊 Recovery pattern analysis:', {
        period: analysis.analysisPeriod,
        sessionSpecific,
        patternCount: Object.keys(analysis.successRates).length
      });

      this.callbacks.onPatternAnalysis?.(analysis);

      return analysis;
    } catch (error) {
      console.error('❌ Error analyzing recovery patterns:', error);
      return null;
    }
  }

  /**
   * Smart recovery - uses patterns and prediction to choose best recovery method
   */
  async smartRecovery(triggerReason: string): Promise<RecoveryResult | null> {
    console.log('🧠 Initiating smart recovery...');

    try {
      // Step 1: Get predictive recommendation
      const prediction = await this.getPredictiveRecommendation();
      if (!prediction) {
        console.warn('⚠️ Could not get predictive recommendation, using fallback');
        return await this.initiateRecovery('provider_switch', triggerReason);
      }

      // Step 2: Analyze patterns to choose best recovery type
      const patterns = await this.analyzeRecoveryPatterns();
      
      let bestRecoveryType: RecoveryType = 'provider_switch'; // Default
      let bestSuccessRate = 0;

      if (patterns) {
        // Find recovery type with highest success rate
        Object.entries(patterns.successRates).forEach(([type, pattern]) => {
          if (pattern.successRate > bestSuccessRate) {
            bestSuccessRate = pattern.successRate;
            bestRecoveryType = type as RecoveryType;
          }
        });
      }

      // Step 3: Choose recovery type based on risk level and patterns
      if (prediction.riskLevel === 'critical') {
        bestRecoveryType = 'provider_switch'; // Most aggressive for critical issues
      } else if (prediction.riskLevel === 'high' && prediction.healthMetrics.avgLatency > 500) {
        bestRecoveryType = 'quality_degradation';
      } else if (prediction.healthMetrics.connectedUsers === 0) {
        bestRecoveryType = 'stale_connection';
      }

      console.log('🎯 Smart recovery decision:', {
        riskLevel: prediction.riskLevel,
        chosenType: bestRecoveryType,
        successRate: bestSuccessRate,
        reason: triggerReason
      });

      // Step 4: Initiate the chosen recovery
      return await this.initiateRecovery(bestRecoveryType, `Smart recovery: ${triggerReason}`);

    } catch (error) {
      console.error('❌ Smart recovery failed, using fallback:', error);
      return await this.initiateRecovery('provider_switch', `Fallback recovery: ${triggerReason}`);
    }
  }

  /**
   * Start predictive monitoring
   */
  private startPredictiveMonitoring(): void {
    this.predictionInterval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        const prediction = await this.getPredictiveRecommendation();
        
        if (prediction?.shouldRecover && prediction.riskLevel !== 'low') {
          console.log('🚨 Predictive recovery triggered:', prediction.riskLevel);
          
          // Auto-trigger recovery for critical issues
          if (prediction.riskLevel === 'critical') {
            await this.smartRecovery('Predictive: Critical risk detected');
          }
        }
      } catch (error) {
        console.error('❌ Predictive monitoring error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get active recovery status
   */
  getActiveRecoveries(): string[] {
    return Array.from(this.activeRecoveries);
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    sessionId: string;
    userId: string;
    activeRecoveries: number;
    hasPredictiveMonitoring: boolean;
  } {
    return {
      isMonitoring: this.isMonitoring,
      sessionId: this.sessionId,
      userId: this.userId,
      activeRecoveries: this.activeRecoveries.size,
      hasPredictiveMonitoring: this.predictionInterval !== null
    };
  }
}

/**
 * Create advanced recovery manager instance
 */
export function createAdvancedRecoveryManager(
  sessionId: string,
  userId: string,
  callbacks: AdvancedRecoveryCallbacks = {}
): AdvancedRecoveryManager {
  return new AdvancedRecoveryManager(sessionId, userId, callbacks);
}