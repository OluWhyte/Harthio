/**
 * Performance Monitor
 * Tracks and optimizes session initialization performance
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  sessionId: string;
  userId: string;
  totalTime: number;
  metrics: PerformanceMetric[];
  optimizations: string[];
  recommendations: string[];
  timestamp: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private reports: PerformanceReport[] = [];
  private optimizations: string[] = [];
  
  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }
  
  /**
   * Start tracking a performance metric
   */
  startMetric(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.metrics.set(name, metric);
    console.log(`📊 Performance: Started tracking "${name}"`);
  }
  
  /**
   * End tracking a performance metric
   */
  endMetric(name: string, metadata?: Record<string, any>): number {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`📊 Performance: Metric "${name}" not found`);
      return 0;
    }
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata };
    }
    
    console.log(`📊 Performance: "${name}" completed in ${duration.toFixed(2)}ms`);
    return duration;
  }
  
  /**
   * Record an optimization that was applied
   */
  recordOptimization(optimization: string): void {
    this.optimizations.push(optimization);
    console.log(`⚡ Optimization applied: ${optimization}`);
  }
  
  /**
   * Generate performance report
   */
  generateReport(sessionId: string, userId: string): PerformanceReport {
    const completedMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.duration !== undefined);
    
    const totalTime = completedMetrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
    
    const recommendations = this.generateRecommendations(completedMetrics);
    
    const report: PerformanceReport = {
      sessionId,
      userId,
      totalTime,
      metrics: completedMetrics,
      optimizations: [...this.optimizations],
      recommendations,
      timestamp: Date.now()
    };
    
    this.reports.push(report);
    this.logReport(report);
    
    return report;
  }
  
  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    
    // Check for slow camera initialization
    const cameraMetric = metrics.find(m => m.name === 'camera_init');
    if (cameraMetric && cameraMetric.duration! > 2000) {
      recommendations.push('Camera initialization is slow - consider caching constraints');
    }
    
    // Check for slow session data loading
    const sessionDataMetric = metrics.find(m => m.name === 'session_data');
    if (sessionDataMetric && sessionDataMetric.duration! > 1000) {
      recommendations.push('Session data loading is slow - consider caching or pre-loading');
    }
    
    // Check for slow provider testing
    const providerTestMetric = metrics.find(m => m.name === 'provider_test');
    if (providerTestMetric && providerTestMetric.duration! > 3000) {
      recommendations.push('Provider testing is slow - consider caching results');
    }
    
    // Check for sequential operations
    const parallelizableMetrics = ['camera_init', 'session_data', 'provider_test', 'messaging_init'];
    const hasSequentialOps = parallelizableMetrics.some(name => 
      metrics.find(m => m.name === name && m.duration! > 500)
    );
    
    if (hasSequentialOps) {
      recommendations.push('Consider running initialization operations in parallel');
    }
    
    // Check total time
    const totalTime = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    if (totalTime > 5000) {
      recommendations.push('Total initialization time is high - enable fast-track mode');
    }
    
    return recommendations;
  }
  
  /**
   * Log performance report
   */
  private logReport(report: PerformanceReport): void {
    console.group('📊 Performance Report');
    console.log(`Session: ${report.sessionId}`);
    console.log(`Total Time: ${report.totalTime.toFixed(2)}ms`);
    
    console.group('Metrics:');
    report.metrics.forEach(metric => {
      console.log(`  ${metric.name}: ${metric.duration?.toFixed(2)}ms`, metric.metadata);
    });
    console.groupEnd();
    
    if (report.optimizations.length > 0) {
      console.group('Optimizations Applied:');
      report.optimizations.forEach(opt => console.log(`  ⚡ ${opt}`));
      console.groupEnd();
    }
    
    if (report.recommendations.length > 0) {
      console.group('Recommendations:');
      report.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
      console.groupEnd();
    }
    
    console.groupEnd();
  }
  
  /**
   * Get performance insights
   */
  getInsights(): {
    averageInitTime: number;
    fastestInit: number;
    slowestInit: number;
    commonOptimizations: string[];
    topRecommendations: string[];
  } {
    if (this.reports.length === 0) {
      return {
        averageInitTime: 0,
        fastestInit: 0,
        slowestInit: 0,
        commonOptimizations: [],
        topRecommendations: []
      };
    }
    
    const initTimes = this.reports.map(r => r.totalTime);
    const averageInitTime = initTimes.reduce((sum, time) => sum + time, 0) / initTimes.length;
    const fastestInit = Math.min(...initTimes);
    const slowestInit = Math.max(...initTimes);
    
    // Count optimization frequency
    const optimizationCounts = new Map<string, number>();
    this.reports.forEach(report => {
      report.optimizations.forEach(opt => {
        optimizationCounts.set(opt, (optimizationCounts.get(opt) || 0) + 1);
      });
    });
    
    const commonOptimizations = Array.from(optimizationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([opt]) => opt);
    
    // Count recommendation frequency
    const recommendationCounts = new Map<string, number>();
    this.reports.forEach(report => {
      report.recommendations.forEach(rec => {
        recommendationCounts.set(rec, (recommendationCounts.get(rec) || 0) + 1);
      });
    });
    
    const topRecommendations = Array.from(recommendationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rec]) => rec);
    
    return {
      averageInitTime,
      fastestInit,
      slowestInit,
      commonOptimizations,
      topRecommendations
    };
  }
  
  /**
   * Clear metrics (for new session)
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.optimizations = [];
  }
  
  /**
   * Export performance data
   */
  exportData(): {
    reports: PerformanceReport[];
    insights: ReturnType<typeof this.getInsights>;
  } {
    return {
      reports: [...this.reports],
      insights: this.getInsights()
    };
  }
}

// Global instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const startMetric = (name: string, metadata?: Record<string, any>) => 
  performanceMonitor.startMetric(name, metadata);

export const endMetric = (name: string, metadata?: Record<string, any>) => 
  performanceMonitor.endMetric(name, metadata);

export const recordOptimization = (optimization: string) => 
  performanceMonitor.recordOptimization(optimization);

// Browser console integration
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
  console.log('📊 PerformanceMonitor available in browser console');
}