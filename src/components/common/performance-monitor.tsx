'use client';

/**
 * Performance Monitoring Component
 * Phase 3 - Advanced performance tracking with Core Web Vitals
 */

import { useEffect } from 'react';
import { initPerformanceMonitoring } from '@/lib/performance-metrics';
import { registerServiceWorker } from '@/lib/service-worker';

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize performance monitoring
    initPerformanceMonitoring();

    // Register service worker (production only)
    registerServiceWorker();

    // Cleanup on unmount
    return () => {
      // Cleanup if needed
    };
  }, []);

  return null; // This component doesn't render anything
}
