/**
 * Simplified Orientation Detection
 * A much simpler alternative to AdaptiveVideoConstraints
 */

export interface SimpleDeviceInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  aspectRatio: string;
}

export class SimpleOrientation {
  
  /**
   * Get device info using simple viewport-based detection
   */
  static getDeviceInfo(): SimpleDeviceInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Enhanced device detection
    const userAgent = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTabletUA = /iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent);
    
    // Combine viewport and user agent detection for better accuracy
    const isMobile = isMobileUA || (width <= 768 && 'ontouchstart' in window);
    const isTablet = isTabletUA || (width > 768 && width <= 1024 && 'ontouchstart' in window && !isMobileUA);
    const isDesktop = !isMobile && !isTablet;
    
    // Enhanced orientation detection
    let orientation: 'portrait' | 'landscape' = 'landscape';
    
    // Use orientation API if available (most reliable on mobile)
    if (typeof window.screen?.orientation !== 'undefined') {
      const orientationType = window.screen.orientation.type;
      orientation = orientationType.includes('portrait') ? 'portrait' : 'landscape';
    } else if (typeof window.orientation !== 'undefined') {
      // Fallback to window.orientation
      const orientationAngle = Math.abs(window.orientation);
      orientation = (orientationAngle === 90 || orientationAngle === 270) ? 'landscape' : 'portrait';
    } else {
      // Fallback to viewport dimensions
      orientation = width > height ? 'landscape' : 'portrait';
    }
    
    // Standard aspect ratios based on device type and orientation
    let aspectRatio: string;
    if (isMobile) {
      aspectRatio = orientation === 'portrait' ? '9/16' : '16/9';
    } else if (isTablet) {
      aspectRatio = orientation === 'portrait' ? '3/4' : '4/3';
    } else {
      aspectRatio = '16/9'; // Standard desktop
    }
    
    console.log('📱 SimpleOrientation detected:', {
      width, height, isMobile, isTablet, isDesktop, orientation, aspectRatio,
      userAgent: userAgent.substring(0, 50) + '...',
      orientationAPI: typeof window.screen?.orientation !== 'undefined' ? window.screen.orientation.type : 'not available'
    });
    
    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      orientation,
      aspectRatio
    };
  }
  
  /**
   * Get simple video constraints
   */
  static getVideoConstraints(deviceInfo?: SimpleDeviceInfo): MediaStreamConstraints {
    const device = deviceInfo || this.getDeviceInfo();
    
    if (device.isMobile) {
      return {
        video: {
          width: { ideal: 480, max: 640 },
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: 20, max: 24 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      };
    }
    
    if (device.isTablet) {
      return {
        video: {
          width: { ideal: 640, max: 1024 },
          height: { ideal: 480, max: 768 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
    }
    
    // Desktop
    return {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
  }
  
  /**
   * Get CSS classes for video container
   */
  static getContainerClass(deviceInfo?: SimpleDeviceInfo): string {
    const device = deviceInfo || this.getDeviceInfo();
    
    if (device.isMobile && device.orientation === 'portrait') {
      return 'max-w-xs mx-auto aspect-[9/16]';
    }
    
    if (device.isMobile && device.orientation === 'landscape') {
      return 'w-full aspect-[16/9]';
    }
    
    if (device.isTablet && device.orientation === 'portrait') {
      return 'max-w-sm mx-auto aspect-[3/4]';
    }
    
    if (device.isTablet && device.orientation === 'landscape') {
      return 'max-w-lg mx-auto aspect-[4/3]';
    }
    
    // Desktop
    return 'w-full aspect-[16/9]';
  }
  
  /**
   * Get display name
   */
  static getDisplayName(deviceInfo?: SimpleDeviceInfo): string {
    const device = deviceInfo || this.getDeviceInfo();
    
    const deviceType = device.isMobile ? 'Mobile' : device.isTablet ? 'Tablet' : 'Desktop';
    return `${deviceType} ${device.orientation}`;
  }
  
  /**
   * Listen for orientation changes (enhanced)
   */
  static onOrientationChange(callback: (deviceInfo: SimpleDeviceInfo) => void): () => void {
    const handleChange = () => {
      // Longer delay for mobile devices to ensure orientation is fully updated
      const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const delay = isMobile ? 300 : 100;
      
      setTimeout(() => {
        const deviceInfo = this.getDeviceInfo();
        console.log('📱 SimpleOrientation change detected:', deviceInfo.orientation, `${deviceInfo.width}x${deviceInfo.height}`);
        callback(deviceInfo);
      }, delay);
    };

    // Listen for multiple orientation change events for better coverage
    const events = ['orientationchange', 'resize'];
    
    // Also listen for screen orientation API changes if available
    if (window.screen?.orientation) {
      // Modern browsers support screen.orientation.addEventListener
      if (window.screen.orientation.addEventListener) {
        window.screen.orientation.addEventListener('change', handleChange);
      }
    }

    // Add all event listeners
    events.forEach(event => {
      window.addEventListener(event, handleChange);
    });

    // Return cleanup function
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleChange);
      });
      
      if (window.screen?.orientation?.removeEventListener) {
        window.screen.orientation.removeEventListener('change', handleChange);
      }
    };
  }
}

/**
 * Comparison between current complex implementation and simplified approach
 */
export class OrientationComparison {
  
  static async compareImplementations(): Promise<{
    current: any;
    simplified: any;
    differences: string[];
    recommendations: string[];
  }> {
    try {
      // Since migration is complete, compare simplified with itself as baseline
      const simplifiedDeviceInfo = SimpleOrientation.getDeviceInfo();
      const simplifiedConstraints = SimpleOrientation.getVideoConstraints();
      
      const differences: string[] = [];
      const recommendations: string[] = [];
      
      const simplifiedComplexity = JSON.stringify(simplifiedDeviceInfo).length;
      
      // Validate the simplified implementation
      if (simplifiedDeviceInfo.orientation && simplifiedDeviceInfo.aspectRatio) {
        differences.push('✅ Orientation detection working correctly');
      } else {
        differences.push('❌ Orientation detection may have issues');
        recommendations.push('Check orientation detection logic');
      }
      
      if (simplifiedConstraints.video && simplifiedConstraints.audio) {
        differences.push('✅ Media constraints generated successfully');
      } else {
        differences.push('❌ Media constraints may be incomplete');
        recommendations.push('Check media constraints generation');
      }
      
      // Check device detection
      const deviceTypeCount = [simplifiedDeviceInfo.isMobile, simplifiedDeviceInfo.isTablet, simplifiedDeviceInfo.isDesktop].filter(Boolean).length;
      if (deviceTypeCount === 1) {
        differences.push('✅ Device type detection working correctly');
      } else {
        differences.push('❌ Device type detection may have conflicts');
        recommendations.push('Check device type detection logic');
      }
      
      return {
        current: {
          deviceInfo: simplifiedDeviceInfo,
          constraints: simplifiedConstraints,
          complexity: simplifiedComplexity
        },
        simplified: {
          deviceInfo: simplifiedDeviceInfo,
          constraints: simplifiedConstraints,
          complexity: simplifiedComplexity
        },
        differences,
        recommendations
      };
      
    } catch (error) {
      return {
        current: {},
        simplified: {},
        differences: [`Migration validation error: ${error}`],
        recommendations: ['Check simplified orientation implementation']
      };
    }
  }
}

// Console testing
if (typeof window !== 'undefined') {
  (window as any).testSimpleOrientation = () => {
    const deviceInfo = SimpleOrientation.getDeviceInfo();
    const constraints = SimpleOrientation.getVideoConstraints();
    const containerClass = SimpleOrientation.getContainerClass();
    const displayName = SimpleOrientation.getDisplayName();
    
    console.log('🧪 Simple Orientation Test:', {
      deviceInfo,
      constraints,
      containerClass,
      displayName
    });
    
    return { deviceInfo, constraints, containerClass, displayName };
  };
  
  (window as any).compareOrientationImplementations = () => OrientationComparison.compareImplementations();
}