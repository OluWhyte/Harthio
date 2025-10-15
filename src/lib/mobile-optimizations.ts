// ============================================================================
// MOBILE OPTIMIZATIONS
// ============================================================================
// Mobile-specific optimizations to prevent hanging and improve performance
// Especially focused on iOS Safari and Chrome mobile issues
// ============================================================================

import { useEffect } from 'react';

interface DeviceCapabilities {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isChrome: boolean;
  isSafari: boolean;
  supportsWebRTC: boolean;
  memoryLimit: 'low' | 'medium' | 'high';
  connectionType: 'slow' | 'fast' | 'unknown';
}

class MobileOptimizer {
  private capabilities: DeviceCapabilities;
  private optimizationSettings: {
    maxConcurrentConnections: number;
    debounceDelay: number;
    timeoutDuration: number;
    retryAttempts: number;
    memoryThreshold: number;
  };

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.optimizationSettings = this.calculateOptimizations();
    
    // Only setup mobile optimizations in browser environment
    if (typeof window !== 'undefined') {
      this.setupMobileOptimizations();
    }
  }

  private detectCapabilities(): DeviceCapabilities {
    // Return default capabilities for SSR
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        isChrome: false,
        isSafari: false,
        supportsWebRTC: false,
        memoryLimit: 'medium',
        connectionType: 'unknown'
      };
    }

    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome/i.test(ua) && !/Edge/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);

    // Detect memory constraints
    let memoryLimit: 'low' | 'medium' | 'high' = 'medium';
    if ('memory' in navigator && (navigator as any).memory) {
      const memory = (navigator as any).memory;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
      if (limitMB < 512) memoryLimit = 'low';
      else if (limitMB > 2048) memoryLimit = 'high';
    } else if (isIOS) {
      // iOS devices typically have more constrained memory for web apps
      memoryLimit = 'low';
    }

    // Detect connection type
    let connectionType: 'slow' | 'fast' | 'unknown' = 'unknown';
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        connectionType = 'slow';
      } else if (effectiveType === '4g' || effectiveType === '5g') {
        connectionType = 'fast';
      }
    }

    return {
      isMobile,
      isIOS,
      isAndroid,
      isChrome,
      isSafari,
      supportsWebRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      memoryLimit,
      connectionType
    };
  }

  private calculateOptimizations() {
    const { isMobile, isIOS, memoryLimit, connectionType } = this.capabilities;

    // Base settings
    let settings = {
      maxConcurrentConnections: 3,
      debounceDelay: 300,
      timeoutDuration: 10000,
      retryAttempts: 3,
      memoryThreshold: 100 // MB
    };

    // Mobile optimizations
    if (isMobile) {
      settings.maxConcurrentConnections = 2;
      settings.debounceDelay = 500;
      settings.timeoutDuration = 15000;
      settings.retryAttempts = 2;
      settings.memoryThreshold = 150; // Increased from 100MB
    }

    // iOS-specific optimizations
    if (isIOS) {
      settings.maxConcurrentConnections = 1;
      settings.debounceDelay = 800;
      settings.timeoutDuration = 20000;
      settings.retryAttempts = 1;
      settings.memoryThreshold = 120; // Increased from 50MB
    }

    // Memory-constrained devices
    if (memoryLimit === 'low') {
      settings.maxConcurrentConnections = 1;
      settings.debounceDelay = 1000;
      settings.memoryThreshold = 80; // Increased from 30MB
    }

    // Slow connections
    if (connectionType === 'slow') {
      settings.timeoutDuration = 30000;
      settings.retryAttempts = 1;
    }

    return settings;
  }

  private setupMobileOptimizations(): void {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Prevent zoom on iOS
    if (this.capabilities.isIOS) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    }

    // Setup memory monitoring for mobile
    if (this.capabilities.isMobile) {
      this.setupMobileMemoryMonitoring();
    }

    // Setup mobile-specific event listeners
    this.setupMobileEventListeners();
  }

  private setupMobileMemoryMonitoring(): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined' || !('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        // Use realistic thresholds - modern web apps use more memory
        const threshold = this.capabilities.isMobile ? 150 : 300;
        if (usedMB > threshold) {
          console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB (threshold: ${threshold}MB)`);
          this.triggerMemoryCleanup();
        }
      }
    };

    // Check memory less frequently to reduce console spam
    setInterval(checkMemory, 60000); // Every minute instead of 15 seconds
  }

  private setupMobileEventListeners(): void {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Handle visibility changes (app backgrounding)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('App backgrounded, reducing activity');
        this.onAppBackgrounded();
      } else {
        console.log('App foregrounded, resuming activity');
        this.onAppForegrounded();
      }
    });

    // Handle orientation changes
    if (this.capabilities.isMobile) {
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.onOrientationChange();
        }, 500); // Delay to allow orientation to settle
      });
    }

    // Handle memory warnings (iOS)
    if (this.capabilities.isIOS) {
      window.addEventListener('pagehide', () => {
        this.triggerMemoryCleanup();
      });
    }
  }

  private onAppBackgrounded(): void {
    // Reduce activity when app is backgrounded
    // This helps prevent iOS from killing the app
    if (window.harthioBackgroundMode) return;
    
    window.harthioBackgroundMode = true;
    
    // Pause non-essential operations
    document.dispatchEvent(new CustomEvent('harthio:background', {
      detail: { action: 'pause' }
    }));
  }

  private onAppForegrounded(): void {
    if (!window.harthioBackgroundMode) return;
    
    window.harthioBackgroundMode = false;
    
    // Resume operations
    document.dispatchEvent(new CustomEvent('harthio:foreground', {
      detail: { action: 'resume' }
    }));
  }

  private onOrientationChange(): void {
    // Trigger layout recalculation
    document.dispatchEvent(new CustomEvent('harthio:orientation-change'));
    
    // Force viewport height recalculation
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  private triggerMemoryCleanup(): void {
    // Trigger garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch (e) {
        // Ignore errors
      }
    }

    // Dispatch cleanup event
    document.dispatchEvent(new CustomEvent('harthio:memory-cleanup'));
  }

  // Public API
  getOptimizedSettings() {
    return { ...this.optimizationSettings };
  }

  getDeviceCapabilities() {
    return { ...this.capabilities };
  }

  // Get optimized timeout for operations
  getOptimizedTimeout(baseTimeout: number): number {
    const { isIOS, connectionType } = this.capabilities;
    let multiplier = 1;

    if (isIOS) multiplier *= 1.5;
    if (connectionType === 'slow') multiplier *= 2;

    return Math.min(baseTimeout * multiplier, 60000); // Max 60 seconds
  }

  // Get optimized debounce delay
  getOptimizedDebounce(baseDelay: number): number {
    return Math.max(baseDelay, this.optimizationSettings.debounceDelay);
  }

  // Check if operation should be throttled
  shouldThrottleOperation(operationType: 'network' | 'webrtc' | 'realtime'): boolean {
    const { memoryLimit, connectionType } = this.capabilities;
    
    if (memoryLimit === 'low') return true;
    if (connectionType === 'slow' && operationType === 'network') return true;
    
    return false;
  }

  // Get optimized WebRTC configuration
  getOptimizedWebRTCConfig(): Partial<RTCConfiguration> {
    const { isIOS, memoryLimit } = this.capabilities;
    
    return {
      iceCandidatePoolSize: isIOS ? 1 : (memoryLimit === 'low' ? 2 : 5),
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      ...(isIOS && {
        iceGatheringTimeout: 5000
      })
    };
  }

  // Get optimized media constraints
  getOptimizedMediaConstraints(): MediaStreamConstraints {
    const { isIOS, memoryLimit, connectionType } = this.capabilities;
    
    if (isIOS || memoryLimit === 'low') {
      return {
        video: {
          width: { ideal: 480, max: 640 },
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: 15, max: 24 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      };
    }

    if (connectionType === 'slow') {
      return {
        video: {
          width: { ideal: 320, max: 480 },
          height: { ideal: 240, max: 360 },
          frameRate: { ideal: 10, max: 15 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
    }

    // Default constraints for capable devices
    return {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30 },
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
      }
    };
  }
}

// Export singleton instance
export const mobileOptimizer = new MobileOptimizer();

// Utility functions
export const isMobileDevice = () => mobileOptimizer.getDeviceCapabilities().isMobile;
export const isIOSDevice = () => mobileOptimizer.getDeviceCapabilities().isIOS;
export const getOptimizedTimeout = (baseTimeout: number) => mobileOptimizer.getOptimizedTimeout(baseTimeout);
export const getOptimizedDebounce = (baseDelay: number) => mobileOptimizer.getOptimizedDebounce(baseDelay);

// React hook for mobile optimizations
export const useMobileOptimizations = () => {
  const capabilities = mobileOptimizer.getDeviceCapabilities();
  const settings = mobileOptimizer.getOptimizedSettings();

  useEffect(() => {
    // Setup viewport height for mobile
    if (capabilities.isMobile) {
      const updateVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };

      updateVH();
      window.addEventListener('resize', updateVH);
      window.addEventListener('orientationchange', () => {
        setTimeout(updateVH, 500);
      });

      return () => {
        window.removeEventListener('resize', updateVH);
        window.removeEventListener('orientationchange', updateVH);
      };
    }
  }, [capabilities.isMobile]);

  return {
    capabilities,
    settings,
    getOptimizedTimeout: mobileOptimizer.getOptimizedTimeout.bind(mobileOptimizer),
    getOptimizedDebounce: mobileOptimizer.getOptimizedDebounce.bind(mobileOptimizer),
    shouldThrottleOperation: mobileOptimizer.shouldThrottleOperation.bind(mobileOptimizer)
  };
};

// Declare global types
declare global {
  interface Window {
    harthioBackgroundMode?: boolean;
  }
}