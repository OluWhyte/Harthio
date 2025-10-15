// ============================================================================
// PERFORMANCE MONITOR
// ============================================================================
// Monitors app performance and helps identify hanging issues
// Provides metrics and alerts for performance problems
// ============================================================================

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceAlert {
  type: 'slow_operation' | 'memory_leak' | 'hanging_operation' | 'network_timeout';
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private alerts: PerformanceAlert[] = [];
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Only enable in development or when explicitly enabled
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     (typeof window !== 'undefined' && localStorage.getItem('harthio_performance_monitor') === 'true');
    
    if (this.isEnabled && typeof window !== 'undefined') {
      this.startMemoryMonitoring();
      this.setupUnloadHandler();
    }
  }

  // Start timing an operation
  startTiming(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  // End timing an operation
  endTiming(name: string): number | null {
    if (!this.isEnabled) return null;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    // Check for slow operations
    if (duration > 5000) { // 5 seconds
      this.addAlert('slow_operation', `Operation '${name}' took ${duration.toFixed(2)}ms`, {
        operation: name,
        duration,
        ...metric.metadata
      });
    }

    // Check for hanging operations
    if (duration > 15000) { // 15 seconds
      this.addAlert('hanging_operation', `Operation '${name}' may be hanging (${duration.toFixed(2)}ms)`, {
        operation: name,
        duration,
        ...metric.metadata
      });
    }

    console.log(`Performance: ${name} completed in ${duration.toFixed(2)}ms`);
    return duration;
  }

  // Monitor WebRTC connection setup
  monitorWebRTCSetup(sessionId: string): {
    startMediaAccess: () => void;
    endMediaAccess: () => void;
    startPeerConnection: () => void;
    endPeerConnection: () => void;
    startSignaling: () => void;
    endSignaling: () => void;
  } {
    return {
      startMediaAccess: () => this.startTiming(`webrtc_media_${sessionId}`, { sessionId, type: 'media' }),
      endMediaAccess: () => this.endTiming(`webrtc_media_${sessionId}`),
      startPeerConnection: () => this.startTiming(`webrtc_peer_${sessionId}`, { sessionId, type: 'peer' }),
      endPeerConnection: () => this.endTiming(`webrtc_peer_${sessionId}`),
      startSignaling: () => this.startTiming(`webrtc_signaling_${sessionId}`, { sessionId, type: 'signaling' }),
      endSignaling: () => this.endTiming(`webrtc_signaling_${sessionId}`)
    };
  }

  // Monitor page load performance
  monitorPageLoad(pageName: string): void {
    if (!this.isEnabled) return;
    
    // Monitor various page load metrics
    if ('performance' in window && 'getEntriesByType' in performance) {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            totalTime: navigation.loadEventEnd - navigation.fetchStart,
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            serverResponse: navigation.responseEnd - navigation.requestStart
          };

          console.log(`Page Load Performance (${pageName}):`, metrics);

          // Alert on slow page loads
          if (metrics.totalTime > 10000) {
            this.addAlert('slow_operation', `Slow page load for ${pageName} (${metrics.totalTime.toFixed(2)}ms)`, {
              page: pageName,
              ...metrics
            });
          }
        }
      }, 1000);
    }
  }

  // Monitor memory usage
  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    this.memoryCheckInterval = setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

        // Alert on high memory usage - more realistic thresholds
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const threshold = isMobile ? 150 : 300; // 150MB for mobile, 300MB for desktop
        
        if (usedMB > threshold) {
          this.addAlert('memory_leak', `High memory usage: ${usedMB.toFixed(2)}MB`, {
            usedMB,
            totalMB,
            limitMB,
            usagePercent: (usedMB / limitMB) * 100,
            isMobile,
            threshold
          });
        }

        // Only log memory usage if it's actually high to reduce console spam
        if (usedMB > (isMobile ? 150 : 300)) {
          console.log(`Memory Usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB (${((usedMB / limitMB) * 100).toFixed(1)}%)`);
        }
      }
    }, 60000); // Check every minute instead of 30 seconds
  }

  // Monitor network requests
  monitorNetworkRequest(url: string, method: string = 'GET'): {
    start: () => void;
    end: (success: boolean) => void;
  } {
    const requestId = `network_${Date.now()}_${Math.random()}`;
    
    return {
      start: () => this.startTiming(requestId, { url, method, type: 'network' }),
      end: (success: boolean) => {
        const duration = this.endTiming(requestId);
        
        if (duration && duration > 10000) { // 10 second timeout
          this.addAlert('network_timeout', `Slow network request to ${url} (${duration.toFixed(2)}ms)`, {
            url,
            method,
            duration,
            success
          });
        }
      }
    };
  }

  // Add performance alert
  private addAlert(type: PerformanceAlert['type'], message: string, metadata?: Record<string, any>): void {
    const alert: PerformanceAlert = {
      type,
      message,
      timestamp: Date.now(),
      metadata
    };

    this.alerts.push(alert);
    console.warn(`Performance Alert [${type}]: ${message}`, metadata);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Send to analytics in production (if configured)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_alert', {
        event_category: 'Performance',
        event_label: type,
        value: metadata?.duration || 0,
        custom_parameters: {
          alert_type: type,
          message: message.substring(0, 100) // Limit message length
        }
      });
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    totalOperations: number;
    slowOperations: number;
    hangingOperations: number;
    memoryAlerts: number;
    networkTimeouts: number;
    recentAlerts: PerformanceAlert[];
  } {
    const slowOperations = this.alerts.filter(a => a.type === 'slow_operation').length;
    const hangingOperations = this.alerts.filter(a => a.type === 'hanging_operation').length;
    const memoryAlerts = this.alerts.filter(a => a.type === 'memory_leak').length;
    const networkTimeouts = this.alerts.filter(a => a.type === 'network_timeout').length;

    return {
      totalOperations: this.metrics.size,
      slowOperations,
      hangingOperations,
      memoryAlerts,
      networkTimeouts,
      recentAlerts: this.alerts.slice(-10)
    };
  }

  // Setup cleanup on page unload
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('beforeunload', () => {
      if (this.memoryCheckInterval) {
        clearInterval(this.memoryCheckInterval);
      }

      // Log final performance summary
      const summary = this.getPerformanceSummary();
      console.log('Final Performance Summary:', summary);
    });
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('harthio_performance_monitor', enabled.toString());
    }
    
    if (enabled && !this.memoryCheckInterval) {
      this.startMemoryMonitoring();
    } else if (!enabled && this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  // Clear all metrics and alerts
  clear(): void {
    this.metrics.clear();
    this.alerts = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common monitoring scenarios
export const monitorAsyncOperation = async <T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  performanceMonitor.startTiming(name, metadata);
  try {
    const result = await operation();
    performanceMonitor.endTiming(name);
    return result;
  } catch (error) {
    performanceMonitor.endTiming(name);
    throw error;
  }
};

export const monitorSyncOperation = <T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, any>
): T => {
  performanceMonitor.startTiming(name, metadata);
  try {
    const result = operation();
    performanceMonitor.endTiming(name);
    return result;
  } catch (error) {
    performanceMonitor.endTiming(name);
    throw error;
  }
};

// React hook for monitoring component performance
export const usePerformanceMonitor = (componentName: string) => {
  const startTiming = (operation: string, metadata?: Record<string, any>) => {
    performanceMonitor.startTiming(`${componentName}_${operation}`, {
      component: componentName,
      ...metadata
    });
  };

  const endTiming = (operation: string) => {
    return performanceMonitor.endTiming(`${componentName}_${operation}`);
  };

  return { startTiming, endTiming };
};