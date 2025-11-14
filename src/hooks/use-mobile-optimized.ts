/**
 * Hook for mobile-specific optimizations
 * Detects mobile devices and provides optimization utilities
 */

import { useState, useEffect } from 'react';

interface MobileOptimizationState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  connectionType: 'slow' | 'fast' | 'unknown';
  prefersReducedMotion: boolean;
}

export function useMobileOptimized(): MobileOptimizationState {
  const [state, setState] = useState<MobileOptimizationState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'lg',
    connectionType: 'unknown',
    prefersReducedMotion: false,
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Screen size detection
      let screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'lg';
      if (width < 640) screenSize = 'xs';
      else if (width < 768) screenSize = 'sm';
      else if (width < 1024) screenSize = 'md';
      else if (width < 1280) screenSize = 'lg';
      else screenSize = 'xl';

      // Device type detection
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Connection type detection
      let connectionType: 'slow' | 'fast' | 'unknown' = 'unknown';
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn) {
          const effectiveType = conn.effectiveType;
          connectionType = effectiveType === 'slow-2g' || effectiveType === '2g' ? 'slow' : 'fast';
        }
      }

      // Reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      setState({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize,
        connectionType,
        prefersReducedMotion,
      });
    };

    checkDevice();

    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    
    // Listen for connection changes
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', checkDevice);
    }

    return () => {
      window.removeEventListener('resize', checkDevice);
      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', checkDevice);
      }
    };
  }, []);

  return state;
}

/**
 * Get optimized settings based on device
 */
export function getOptimizedSettings(state: MobileOptimizationState) {
  return {
    // Reduce real-time polling on mobile
    realtimeInterval: state.isMobile ? 120000 : 60000, // 2min mobile, 1min desktop
    
    // Reduce cache time on slow connections
    cacheTime: state.connectionType === 'slow' ? 300000 : 120000, // 5min slow, 2min fast
    
    // Pagination size
    pageSize: state.isMobile ? 10 : 20,
    
    // Image quality
    imageQuality: state.connectionType === 'slow' ? 60 : 80,
    
    // Enable lazy loading
    enableLazyLoading: state.isMobile || state.connectionType === 'slow',
    
    // Reduce animations
    enableAnimations: !state.prefersReducedMotion && state.connectionType !== 'slow',
    
    // Video quality
    videoQuality: state.isMobile ? 'medium' : 'high',
  };
}
