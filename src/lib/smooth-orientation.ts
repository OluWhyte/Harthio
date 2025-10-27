/**
 * Smooth Orientation Handling
 * Avoids camera reinitialization and provides smooth transitions
 */

import React from 'react';

import { SimpleDeviceManager, type SimpleDeviceShare } from './simple-device-share';

export interface OrientationState {
  current: SimpleDeviceShare;
  previous: SimpleDeviceShare | null;
  isTransitioning: boolean;
  transitionStartTime: number;
}

export interface OrientationConfig {
  debounceMs: number;
  transitionDurationMs: number;
  enableSmoothTransitions: boolean;
  preserveVideoStream: boolean;
}

export class SmoothOrientationHandler {
  private static instance: SmoothOrientationHandler | null = null;
  private listeners: Set<(state: OrientationState) => void> = new Set();
  private state: OrientationState;
  private config: OrientationConfig;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private transitionTimeout: NodeJS.Timeout | null = null;

  private constructor(config: Partial<OrientationConfig> = {}) {
    this.config = {
      debounceMs: 300,
      transitionDurationMs: 500,
      enableSmoothTransitions: true,
      preserveVideoStream: true,
      ...config
    };

    this.state = {
      current: SimpleDeviceManager.createDeviceShare(),
      previous: null,
      isTransitioning: false,
      transitionStartTime: 0
    };

    this.initializeListeners();
  }

  static getInstance(config?: Partial<OrientationConfig>): SmoothOrientationHandler {
    if (!this.instance) {
      this.instance = new SmoothOrientationHandler(config);
    }
    return this.instance;
  }

  /**
   * Subscribe to orientation changes
   */
  subscribe(callback: (state: OrientationState) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state
    callback(this.state);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current orientation state
   */
  getCurrentState(): OrientationState {
    return { ...this.state };
  }

  /**
   * Force update orientation (useful for testing)
   */
  forceUpdate(): void {
    this.handleOrientationChange();
  }

  /**
   * Initialize orientation change listeners
   */
  private initializeListeners(): void {
    if (typeof window === 'undefined') return;

    // Debounced orientation change handler
    const debouncedHandler = () => {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      this.debounceTimeout = setTimeout(() => {
        this.handleOrientationChange();
      }, this.config.debounceMs);
    };

    // Listen to multiple orientation change events
    window.addEventListener('orientationchange', debouncedHandler);
    window.addEventListener('resize', debouncedHandler);

    // Visual Viewport API for more accurate mobile detection
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedHandler);
    }
  }

  /**
   * Handle orientation change with smooth transitions
   */
  private handleOrientationChange(): void {
    const newDeviceShare = SimpleDeviceManager.createDeviceShare();
    
    // Check if orientation actually changed
    if (this.hasOrientationChanged(this.state.current, newDeviceShare)) {
      this.startTransition(newDeviceShare);
    }
  }

  /**
   * Check if orientation has meaningfully changed
   */
  private hasOrientationChanged(current: SimpleDeviceShare, next: SimpleDeviceShare): boolean {
    return (
      current.orientation !== next.orientation ||
      current.deviceType !== next.deviceType ||
      current.aspectRatio !== next.aspectRatio ||
      current.viewportSize !== next.viewportSize
    );
  }

  /**
   * Start smooth transition to new orientation
   */
  private startTransition(newDeviceShare: SimpleDeviceShare): void {
    // Clear any existing transition
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }

    // Update state to transitioning
    this.state = {
      current: newDeviceShare,
      previous: this.state.current,
      isTransitioning: true,
      transitionStartTime: Date.now()
    };

    // Notify listeners of transition start
    this.notifyListeners();

    // End transition after duration
    if (this.config.enableSmoothTransitions) {
      this.transitionTimeout = setTimeout(() => {
        this.endTransition();
      }, this.config.transitionDurationMs);
    } else {
      // Immediate transition
      this.endTransition();
    }
  }

  /**
   * End transition and finalize new orientation
   */
  private endTransition(): void {
    this.state = {
      ...this.state,
      isTransitioning: false,
      previous: null
    };

    this.notifyListeners();
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in orientation change listener:', error);
      }
    });
  }

  /**
   * Get CSS transform for smooth orientation transition
   */
  getTransitionTransform(): string {
    if (!this.state.isTransitioning || !this.state.previous) {
      return 'none';
    }

    const progress = Math.min(
      (Date.now() - this.state.transitionStartTime) / this.config.transitionDurationMs,
      1
    );

    // Smooth easing function
    const easeProgress = this.easeInOutCubic(progress);

    // Calculate rotation based on orientation change
    const fromLandscape = this.state.previous.orientation === 'landscape';
    const toLandscape = this.state.current.orientation === 'landscape';

    if (fromLandscape && !toLandscape) {
      // Landscape to portrait: rotate -90deg
      return `rotate(${-90 * (1 - easeProgress)}deg)`;
    } else if (!fromLandscape && toLandscape) {
      // Portrait to landscape: rotate 90deg
      return `rotate(${90 * (1 - easeProgress)}deg)`;
    }

    return 'none';
  }

  /**
   * Get CSS classes for orientation-aware containers
   */
  getContainerClasses(baseClasses: string = ''): string {
    const { current, isTransitioning } = this.state;
    
    const orientationClass = current.orientation === 'portrait' 
      ? 'orientation-portrait' 
      : 'orientation-landscape';
    
    const deviceClass = `device-${current.deviceType}`;
    const sizeClass = `viewport-${current.viewportSize}`;
    const transitionClass = isTransitioning ? 'orientation-transitioning' : '';

    return [
      baseClasses,
      orientationClass,
      deviceClass,
      sizeClass,
      transitionClass,
      'transition-transform duration-500 ease-in-out'
    ].filter(Boolean).join(' ');
  }

  /**
   * Get video constraints that preserve stream during orientation change
   */
  getVideoConstraints(): MediaStreamConstraints {
    const { current } = this.state;
    
    // Use flexible constraints that work in both orientations
    if (current.deviceType === 'mobile') {
      return {
        video: {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
    } else if (current.deviceType === 'tablet') {
      return {
        video: {
          width: { min: 480, ideal: 960, max: 1920 },
          height: { min: 360, ideal: 720, max: 1080 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
    } else {
      return {
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
    }
  }

  /**
   * Easing function for smooth transitions
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }
    
    this.listeners.clear();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('orientationchange', this.handleOrientationChange);
      window.removeEventListener('resize', this.handleOrientationChange);
      
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', this.handleOrientationChange);
      }
    }
  }
}

/**
 * React hook for smooth orientation handling
 */
export function useSmoothOrientation(config?: Partial<OrientationConfig>) {
  const [state, setState] = React.useState<OrientationState>(() => 
    SmoothOrientationHandler.getInstance(config).getCurrentState()
  );

  React.useEffect(() => {
    const handler = SmoothOrientationHandler.getInstance(config);
    const unsubscribe = handler.subscribe(setState);
    
    return unsubscribe;
  }, [config]);

  const handler = React.useMemo(() => 
    SmoothOrientationHandler.getInstance(config), [config]
  );

  return {
    ...state,
    getTransitionTransform: () => handler.getTransitionTransform(),
    getContainerClasses: (baseClasses?: string) => handler.getContainerClasses(baseClasses),
    getVideoConstraints: () => handler.getVideoConstraints(),
    forceUpdate: () => handler.forceUpdate()
  };
}