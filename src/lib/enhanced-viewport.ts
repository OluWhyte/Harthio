/**
 * Enhanced Viewport Handling
 * Accounts for dynamic browser UI, safe areas, and cross-device compatibility
 */

import React from 'react';

export interface ViewportInfo {
  width: number;
  height: number;
  availableHeight: number; // Height minus browser UI
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  browserUIHeight: number;
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface TouchTargetConfig {
  size: 'compact' | 'medium' | 'large';
  minSize: number;
  spacing: number;
  edgeMargin: number;
}

export class EnhancedViewport {
  private static listeners: Set<(viewport: ViewportInfo) => void> = new Set();
  private static currentViewport: ViewportInfo | null = null;
  private static resizeObserver: ResizeObserver | null = null;
  private static visualViewportSupported = typeof window !== 'undefined' && 'visualViewport' in window;

  /**
   * Get current viewport information with browser UI considerations
   */
  static getViewportInfo(): ViewportInfo {
    if (typeof window === 'undefined') {
      return this.getDefaultViewport();
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Use Visual Viewport API if available (most accurate for mobile)
    const visualViewport = this.visualViewportSupported ? window.visualViewport : null;
    const visualHeight = visualViewport?.height || height;
    const visualWidth = visualViewport?.width || width;

    // Calculate browser UI height
    const browserUIHeight = Math.max(0, height - visualHeight);
    
    // Detect keyboard (significant height reduction on mobile)
    const keyboardHeight = Math.max(0, height - visualHeight - browserUIHeight);
    const isKeyboardVisible = keyboardHeight > 100; // Threshold for keyboard detection

    // Get safe area insets (for notched devices)
    const safeAreaTop = this.getSafeAreaInset('top');
    const safeAreaBottom = this.getSafeAreaInset('bottom');
    const safeAreaLeft = this.getSafeAreaInset('left');
    const safeAreaRight = this.getSafeAreaInset('right');

    // Calculate truly available height
    const availableHeight = visualHeight - safeAreaTop - safeAreaBottom;

    // Determine orientation
    const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait';

    const viewport: ViewportInfo = {
      width: visualWidth,
      height: visualHeight,
      availableHeight,
      safeAreaTop,
      safeAreaBottom,
      safeAreaLeft,
      safeAreaRight,
      browserUIHeight,
      keyboardHeight,
      isKeyboardVisible,
      orientation
    };

    this.currentViewport = viewport;
    return viewport;
  }

  /**
   * Get safe area inset value
   */
  private static getSafeAreaInset(side: 'top' | 'bottom' | 'left' | 'right'): number {
    if (typeof window === 'undefined') return 0;
    
    try {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(`env(safe-area-inset-${side})`);
      return parseInt(value) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get touch target configuration based on available space
   */
  static getTouchTargetConfig(viewport?: ViewportInfo): TouchTargetConfig {
    const vp = viewport || this.getViewportInfo();
    
    // Adaptive sizing based on available height
    if (vp.availableHeight >= 700) {
      return {
        size: 'large',
        minSize: 56, // 56px minimum (iOS/Android recommendation)
        spacing: 16,
        edgeMargin: 20
      };
    } else if (vp.availableHeight >= 500) {
      return {
        size: 'medium',
        minSize: 48,
        spacing: 12,
        edgeMargin: 16
      };
    } else {
      return {
        size: 'compact',
        minSize: 44, // Absolute minimum for accessibility
        spacing: 8,
        edgeMargin: 12
      };
    }
  }

  /**
   * Get safe zones for UI elements (avoid browser gestures)
   */
  static getSafeZones(viewport?: ViewportInfo): {
    top: number;
    bottom: number;
    left: number;
    right: number;
  } {
    const vp = viewport || this.getViewportInfo();
    
    return {
      top: Math.max(vp.safeAreaTop, 40), // Avoid browser address bar area
      bottom: Math.max(vp.safeAreaBottom, 50), // Avoid browser navigation gestures
      left: Math.max(vp.safeAreaLeft, 10),
      right: Math.max(vp.safeAreaRight, 10)
    };
  }

  /**
   * Subscribe to viewport changes
   */
  static subscribe(callback: (viewport: ViewportInfo) => void): () => void {
    this.listeners.add(callback);
    
    // Initialize listeners if first subscription
    if (this.listeners.size === 1) {
      this.initializeListeners();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.cleanup();
      }
    };
  }

  /**
   * Initialize viewport change listeners
   */
  private static initializeListeners(): void {
    if (typeof window === 'undefined') return;

    const notifyListeners = () => {
      const viewport = this.getViewportInfo();
      this.listeners.forEach(callback => callback(viewport));
    };

    // Standard resize listener
    window.addEventListener('resize', notifyListeners);
    window.addEventListener('orientationchange', () => {
      // Delay to allow browser to complete orientation change
      setTimeout(notifyListeners, 300);
    });

    // Visual Viewport API listener (more accurate for mobile)
    if (this.visualViewportSupported && window.visualViewport) {
      window.visualViewport.addEventListener('resize', notifyListeners);
      window.visualViewport.addEventListener('scroll', notifyListeners);
    }

    // CSS environment changes (safe area updates)
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(notifyListeners);
      this.resizeObserver.observe(document.documentElement);
    }

    // Initial notification
    setTimeout(notifyListeners, 100);
  }

  /**
   * Cleanup listeners
   */
  private static cleanup(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('resize', this.notifyListeners);
    window.removeEventListener('orientationchange', this.notifyListeners);

    if (this.visualViewportSupported && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.notifyListeners);
      window.visualViewport.removeEventListener('scroll', this.notifyListeners);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private static notifyListeners = () => {
    const viewport = this.getViewportInfo();
    this.listeners.forEach(callback => callback(viewport));
  };

  /**
   * Default viewport for SSR
   */
  private static getDefaultViewport(): ViewportInfo {
    return {
      width: 375,
      height: 667,
      availableHeight: 600,
      safeAreaTop: 0,
      safeAreaBottom: 0,
      safeAreaLeft: 0,
      safeAreaRight: 0,
      browserUIHeight: 67,
      keyboardHeight: 0,
      isKeyboardVisible: false,
      orientation: 'portrait'
    };
  }

  /**
   * Get CSS custom properties for viewport
   */
  static getCSSProperties(viewport?: ViewportInfo): Record<string, string> {
    const vp = viewport || this.getViewportInfo();
    
    return {
      '--viewport-width': `${vp.width}px`,
      '--viewport-height': `${vp.height}px`,
      '--available-height': `${vp.availableHeight}px`,
      '--safe-area-top': `${vp.safeAreaTop}px`,
      '--safe-area-bottom': `${vp.safeAreaBottom}px`,
      '--safe-area-left': `${vp.safeAreaLeft}px`,
      '--safe-area-right': `${vp.safeAreaRight}px`,
      '--browser-ui-height': `${vp.browserUIHeight}px`,
      '--vh': `${vp.height * 0.01}px`, // Custom vh unit
      '--available-vh': `${vp.availableHeight * 0.01}px` // Available height unit
    };
  }
}

/**
 * React hook for viewport information
 */
export function useEnhancedViewport() {
  const [viewport, setViewport] = React.useState<ViewportInfo>(() => 
    EnhancedViewport.getViewportInfo()
  );

  React.useEffect(() => {
    const unsubscribe = EnhancedViewport.subscribe(setViewport);
    return unsubscribe;
  }, []);

  const touchTargetConfig = React.useMemo(() => 
    EnhancedViewport.getTouchTargetConfig(viewport), [viewport]
  );

  const safeZones = React.useMemo(() => 
    EnhancedViewport.getSafeZones(viewport), [viewport]
  );

  const cssProperties = React.useMemo(() => 
    EnhancedViewport.getCSSProperties(viewport), [viewport]
  );

  return {
    viewport,
    touchTargetConfig,
    safeZones,
    cssProperties
  };
}