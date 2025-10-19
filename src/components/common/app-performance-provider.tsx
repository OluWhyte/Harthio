'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { realtimePerformanceMonitor } from '@/lib/performance-monitor';

// Temporary stub for performance monitoring
const performanceMonitor = {
  startTiming: (name: string, data?: any) => {},
  endTiming: (name: string) => {},
  getPerformanceSummary: () => ({
    averageSubscriptions: 0,
    averageHealthyConnections: 0,
    averageResponseTime: 0,
    totalRecommendations: 0,
    mostCommonRecommendations: []
  })
};
import { mobileOptimizer } from '@/lib/mobile-optimizations';
import { ErrorBoundary } from './error-boundary';

interface AppPerformanceContextType {
  isOptimized: boolean;
  deviceCapabilities: ReturnType<typeof mobileOptimizer.getDeviceCapabilities>;
  performanceMetrics: ReturnType<typeof performanceMonitor.getPerformanceSummary>;
  refreshMetrics: () => void;
}

const AppPerformanceContext = createContext<AppPerformanceContextType | undefined>(undefined);

export function useAppPerformance() {
  const context = useContext(AppPerformanceContext);
  if (!context) {
    throw new Error('useAppPerformance must be used within AppPerformanceProvider');
  }
  return context;
}

interface AppPerformanceProviderProps {
  children: ReactNode;
}

export function AppPerformanceProvider({ children }: AppPerformanceProviderProps) {
  const [isOptimized, setIsOptimized] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(
    performanceMonitor.getPerformanceSummary()
  );

  const deviceCapabilities = mobileOptimizer.getDeviceCapabilities();

  useEffect(() => {
    // Initialize performance optimizations
    const initializeOptimizations = () => {
      try {
        // Set up global error handlers
        window.addEventListener('error', (event) => {
          performanceMonitor.startTiming('global_error_handling', {
            error: event.error?.message || 'Unknown error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          });
          
          console.error('Global error caught:', event.error);
          performanceMonitor.endTiming('global_error_handling');
        });

        window.addEventListener('unhandledrejection', (event) => {
          // Only log unique errors to prevent flooding
          const errorKey = event.reason?.message || 'Unknown rejection';
          const now = Date.now();
          
          if (!window.lastLoggedErrors) {
            window.lastLoggedErrors = new Map();
          }
          
          const lastLogged = window.lastLoggedErrors.get(errorKey);
          if (!lastLogged || now - lastLogged > 5000) { // Only log same error once per 5 seconds
            performanceMonitor.startTiming('unhandled_rejection', {
              reason: errorKey
            });
            
            console.error('Unhandled promise rejection:', event.reason);
            performanceMonitor.endTiming('unhandled_rejection');
            window.lastLoggedErrors.set(errorKey, now);
          }
        });

        // Set up performance monitoring for navigation
        if ('performance' in window && 'getEntriesByType' in performance) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'navigation') {
                const navEntry = entry as PerformanceNavigationTiming;
                performanceMonitor.startTiming('page_navigation', {
                  type: navEntry.type,
                  redirectCount: navEntry.redirectCount
                });
                performanceMonitor.endTiming('page_navigation');
              }
            }
          });
          
          observer.observe({ entryTypes: ['navigation'] });
        }

        // Set up memory monitoring with realistic thresholds
        if ('memory' in performance) {
          const checkMemory = () => {
            const memory = (performance as any).memory;
            if (memory) {
              const usedMB = memory.usedJSHeapSize / 1024 / 1024;
              const threshold = deviceCapabilities.isMobile ? 150 : 300; // 150MB mobile, 300MB desktop
              
              if (usedMB > threshold) {
                console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB (threshold: ${threshold}MB)`);
                
                // Trigger garbage collection if available
                if ('gc' in window && typeof (window as any).gc === 'function') {
                  try {
                    (window as any).gc();
                  } catch (e) {
                    // Ignore errors
                  }
                }
              }
            }
          };

          const memoryInterval = setInterval(checkMemory, 120000); // Check every 2 minutes (even less frequent)
          return () => clearInterval(memoryInterval);
        }

        setIsOptimized(true);
      } catch (error) {
        console.error('Failed to initialize performance optimizations:', error);
        setIsOptimized(false);
      }
    };

    initializeOptimizations();
  }, [deviceCapabilities.isMobile]);

  // Refresh performance metrics periodically
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setPerformanceMetrics(performanceMonitor.getPerformanceSummary());
    }, 60000); // Update every minute

    return () => clearInterval(refreshInterval);
  }, []);

  const refreshMetrics = () => {
    setPerformanceMetrics(performanceMonitor.getPerformanceSummary());
  };

  const contextValue: AppPerformanceContextType = {
    isOptimized,
    deviceCapabilities,
    performanceMetrics,
    refreshMetrics,
  };

  return (
    <AppPerformanceContext.Provider value={contextValue}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          performanceMonitor.startTiming('app_error_boundary', {
            error: error.message,
            componentStack: errorInfo.componentStack?.substring(0, 500)
          });
          performanceMonitor.endTiming('app_error_boundary');
        }}
      >
        {children}
      </ErrorBoundary>
    </AppPerformanceContext.Provider>
  );
}

// Performance monitoring hook for components
export function useComponentPerformance(componentName: string) {
  const { deviceCapabilities } = useAppPerformance();

  useEffect(() => {
    const startTime = performance.now();
    performanceMonitor.startTiming(`component_mount_${componentName}`, {
      component: componentName,
      isMobile: deviceCapabilities.isMobile
    });

    return () => {
      const endTime = performance.now();
      performanceMonitor.endTiming(`component_mount_${componentName}`);
      
      const mountTime = endTime - startTime;
      if (mountTime > 1000) { // Log slow component mounts
        console.warn(`Slow component mount: ${componentName} took ${mountTime.toFixed(2)}ms`);
      }
    };
  }, [componentName, deviceCapabilities.isMobile]);

  const trackOperation = (operationName: string, operation: () => void | Promise<void>) => {
    const fullOperationName = `${componentName}_${operationName}`;
    performanceMonitor.startTiming(fullOperationName, { component: componentName });
    
    try {
      const result = operation();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.endTiming(fullOperationName);
        });
      } else {
        performanceMonitor.endTiming(fullOperationName);
        return result;
      }
    } catch (error) {
      performanceMonitor.endTiming(fullOperationName);
      throw error;
    }
  };

  return { trackOperation };
}

// HOC for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    useComponentPerformance(name);
    
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Extend Window interface for error tracking
declare global {
  interface Window {
    lastLoggedErrors?: Map<string, number>;
  }
}