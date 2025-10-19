/**
 * Performance Monitor
 * Tracks real-time subscription performance and provides optimization insights
 */

import { realtimeManager } from './realtime-manager';
import { connectionHealthMonitor } from './connection-health-monitor';

export interface PerformanceMetrics {
  subscriptionCount: number;
  healthyConnections: number;
  unhealthyConnections: number;
  averageResponseTime: number;
  memoryUsage: number;
  recommendations: string[];
  lastCheck: Date;
}

export class RealtimePerformanceMonitor {
  private static instance: RealtimePerformanceMonitor | null = null;
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 10; // Keep last 10 measurements
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): RealtimePerformanceMonitor {
    if (!RealtimePerformanceMonitor.instance) {
      RealtimePerformanceMonitor.instance = new RealtimePerformanceMonitor();
    }
    return RealtimePerformanceMonitor.instance;
  }

  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    console.log('Starting performance monitoring');
    
    // Initial measurement
    this.measurePerformance();
    
    // Set up periodic measurements
    this.monitoringInterval = setInterval(() => {
      this.measurePerformance();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Stopped performance monitoring');
    }
  }

  private measurePerformance(): void {
    const subscriptionInfo = realtimeManager.getSubscriptionInfo();
    const healthInfo = realtimeManager.monitorSubscriptionHealth();
    
    // Calculate memory usage (if available)
    let memoryUsage = 0;
    if ('memory' in performance && (performance as any).memory) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // Generate recommendations based on current state
    const recommendations = this.generateRecommendations(subscriptionInfo, healthInfo);

    const metrics: PerformanceMetrics = {
      subscriptionCount: subscriptionInfo.activeChannels,
      healthyConnections: healthInfo.healthy,
      unhealthyConnections: healthInfo.unhealthy,
      averageResponseTime: this.calculateAverageResponseTime(),
      memoryUsage,
      recommendations,
      lastCheck: new Date()
    };

    // Add to history
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log performance issues
    if (recommendations.length > 0) {
      console.warn('Performance recommendations:', recommendations);
    }
  }

  private generateRecommendations(subscriptionInfo: any, healthInfo: any): string[] {
    const recommendations: string[] = [];

    // Too many subscriptions
    if (subscriptionInfo.activeChannels > 10) {
      recommendations.push('Consider reducing the number of active subscriptions');
    }

    // Too many unhealthy connections
    if (healthInfo.unhealthy > 2) {
      recommendations.push('Multiple connection failures detected - check network stability');
    }

    // High memory usage
    if (this.metrics.length > 0) {
      const currentMemory = this.metrics[this.metrics.length - 1]?.memoryUsage || 0;
      if (currentMemory > 100) { // 100MB
        recommendations.push('High memory usage detected - consider optimizing subscriptions');
      }
    }

    // Pending callbacks accumulating
    if (subscriptionInfo.pendingCallbacks > 5) {
      recommendations.push('Many pending callbacks - consider increasing debounce times');
    }

    // Connection health degrading over time
    if (this.metrics.length >= 3) {
      const recentMetrics = this.metrics.slice(-3);
      const healthTrend = recentMetrics.map(m => m.healthyConnections);
      const isDecreasing = healthTrend.every((val, i) => i === 0 || val <= healthTrend[i - 1]);
      
      if (isDecreasing && healthTrend[0] > healthTrend[healthTrend.length - 1]) {
        recommendations.push('Connection health is degrading - consider refreshing the page');
      }
    }

    return recommendations;
  }

  private calculateAverageResponseTime(): number {
    // This is a placeholder - in a real implementation, you'd track actual response times
    // For now, return a simulated value based on connection health
    const healthInfo = realtimeManager.monitorSubscriptionHealth();
    const healthRatio = healthInfo.healthy / (healthInfo.healthy + healthInfo.unhealthy || 1);
    
    // Simulate response time: healthy connections = ~100ms, unhealthy = ~1000ms
    return Math.round(100 + (1 - healthRatio) * 900);
  }

  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getPerformanceSummary(): {
    averageSubscriptions: number;
    averageHealthyConnections: number;
    averageResponseTime: number;
    totalRecommendations: number;
    mostCommonRecommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageSubscriptions: 0,
        averageHealthyConnections: 0,
        averageResponseTime: 0,
        totalRecommendations: 0,
        mostCommonRecommendations: []
      };
    }

    const averageSubscriptions = this.metrics.reduce((sum, m) => sum + m.subscriptionCount, 0) / this.metrics.length;
    const averageHealthyConnections = this.metrics.reduce((sum, m) => sum + m.healthyConnections, 0) / this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / this.metrics.length;
    
    // Count all recommendations
    const allRecommendations = this.metrics.flatMap(m => m.recommendations);
    const recommendationCounts = allRecommendations.reduce((counts, rec) => {
      counts[rec] = (counts[rec] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mostCommonRecommendations = Object.entries(recommendationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([rec]) => rec);

    return {
      averageSubscriptions: Math.round(averageSubscriptions),
      averageHealthyConnections: Math.round(averageHealthyConnections),
      averageResponseTime: Math.round(averageResponseTime),
      totalRecommendations: allRecommendations.length,
      mostCommonRecommendations
    };
  }

  // Force a performance measurement (useful for debugging)
  forceCheck(): PerformanceMetrics {
    this.measurePerformance();
    return this.getCurrentMetrics()!;
  }

  // Clear metrics history
  clearHistory(): void {
    this.metrics = [];
    console.log('Performance metrics history cleared');
  }
}

// Export singleton instance
export const realtimePerformanceMonitor = RealtimePerformanceMonitor.getInstance();

// React hook for performance monitoring
import React from 'react';

export function usePerformanceMonitor(autoStart: boolean = true) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  React.useEffect(() => {
    if (autoStart) {
      realtimePerformanceMonitor.startMonitoring();
      setIsMonitoring(true);
    }

    // Check for current metrics
    const currentMetrics = realtimePerformanceMonitor.getCurrentMetrics();
    if (currentMetrics) {
      setMetrics(currentMetrics);
    }

    // Set up periodic updates
    const interval = setInterval(() => {
      const latestMetrics = realtimePerformanceMonitor.getCurrentMetrics();
      if (latestMetrics) {
        setMetrics(latestMetrics);
      }
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      if (autoStart) {
        realtimePerformanceMonitor.stopMonitoring();
        setIsMonitoring(false);
      }
    };
  }, [autoStart]);

  return {
    metrics,
    isMonitoring,
    summary: realtimePerformanceMonitor.getPerformanceSummary(),
    forceCheck: realtimePerformanceMonitor.forceCheck.bind(realtimePerformanceMonitor),
    clearHistory: realtimePerformanceMonitor.clearHistory.bind(realtimePerformanceMonitor)
  };
}