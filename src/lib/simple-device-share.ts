/**
 * Simplified Device Info Sharing
 * Lightweight device information for cross-device video optimization
 */

import React from 'react';

export interface SimpleDeviceShare {
  // Essential device characteristics
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  aspectRatio: string; // '16/9', '9/16', '4/3', etc.
  
  // Viewport size category for touch target optimization
  viewportSize: 'small' | 'medium' | 'large';
  
  // Video optimization hints
  preferredVideoSize: 'low' | 'medium' | 'high';
  
  // Timestamp for freshness
  timestamp: number;
}

export interface VideoLayoutConfig {
  containerClass: string;
  videoClass: string;
  aspectRatioStyle: React.CSSProperties;
  touchTargetSize: 'compact' | 'medium' | 'large';
  layoutStrategy: 'fill' | 'letterbox' | 'pillarbox' | 'crop';
}

export class SimpleDeviceManager {
  
  /**
   * Create simplified device info from current device
   */
  static createDeviceShare(): SimpleDeviceShare {
    if (typeof window === 'undefined') {
      return this.getDefaultDeviceShare();
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Device type detection
    const deviceType = this.detectDeviceType(width, height);
    
    // Orientation detection
    const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait';
    
    // Aspect ratio calculation
    const aspectRatio = this.calculateAspectRatio(width, height, deviceType, orientation);
    
    // Viewport size category
    const viewportSize = this.categorizeViewportSize(width, height);
    
    // Video quality preference based on device capabilities
    const preferredVideoSize = this.getPreferredVideoSize(deviceType, width, height);

    return {
      deviceType,
      orientation,
      aspectRatio,
      viewportSize,
      preferredVideoSize,
      timestamp: Date.now()
    };
  }

  /**
   * Detect device type using viewport and user agent
   */
  private static detectDeviceType(width: number, height: number): 'mobile' | 'tablet' | 'desktop' {
    // Check user agent for more accurate detection
    const userAgent = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTabletUA = /iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent);
    
    // Combine viewport and user agent
    if (isMobileUA || (width <= 768 && 'ontouchstart' in window)) {
      return 'mobile';
    } else if (isTabletUA || (width > 768 && width <= 1024 && 'ontouchstart' in window)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Calculate standard aspect ratio
   */
  private static calculateAspectRatio(
    width: number, 
    height: number, 
    deviceType: string, 
    orientation: string
  ): string {
    const ratio = width / height;
    
    // Standard aspect ratios
    if (Math.abs(ratio - 16/9) < 0.1) return '16/9';
    if (Math.abs(ratio - 9/16) < 0.1) return '9/16';
    if (Math.abs(ratio - 4/3) < 0.1) return '4/3';
    if (Math.abs(ratio - 3/4) < 0.1) return '3/4';
    if (Math.abs(ratio - 21/9) < 0.1) return '21/9'; // Ultra-wide
    if (Math.abs(ratio - 18.5/9) < 0.1) return '18.5/9'; // Modern phones
    
    // Device-specific defaults
    if (deviceType === 'mobile') {
      return orientation === 'portrait' ? '9/16' : '16/9';
    } else if (deviceType === 'tablet') {
      return orientation === 'portrait' ? '3/4' : '4/3';
    } else {
      return '16/9'; // Desktop default
    }
  }

  /**
   * Categorize viewport size for UI optimization
   */
  private static categorizeViewportSize(width: number, height: number): 'small' | 'medium' | 'large' {
    const area = width * height;
    
    if (area < 400000) return 'small';   // < 640x625 equivalent
    if (area < 800000) return 'medium';  // < 894x894 equivalent
    return 'large';
  }

  /**
   * Get preferred video quality based on device capabilities
   */
  private static getPreferredVideoSize(
    deviceType: string, 
    width: number, 
    height: number
  ): 'low' | 'medium' | 'high' {
    // Consider device type and screen size
    if (deviceType === 'mobile' && Math.max(width, height) < 800) {
      return 'low'; // 480p for small mobile screens
    } else if (deviceType === 'mobile' || (deviceType === 'tablet' && Math.max(width, height) < 1200)) {
      return 'medium'; // 720p for larger mobile/small tablets
    } else {
      return 'high'; // 1080p for tablets/desktop
    }
  }

  /**
   * Calculate optimal video layout for remote device
   */
  static calculateVideoLayout(
    localDevice: SimpleDeviceShare,
    remoteDevice: SimpleDeviceShare
  ): VideoLayoutConfig {
    
    // Determine layout strategy based on device combination
    const layoutStrategy = this.getLayoutStrategy(localDevice, remoteDevice);
    
    // Get container classes based on remote device aspect ratio
    const containerClass = this.getContainerClass(remoteDevice, localDevice);
    
    // Video fitting class
    const videoClass = this.getVideoClass(layoutStrategy);
    
    // Aspect ratio style
    const aspectRatioStyle = this.getAspectRatioStyle(remoteDevice.aspectRatio);
    
    // Touch target size based on local device
    const touchTargetSize = this.getTouchTargetSize(localDevice);

    return {
      containerClass,
      videoClass,
      aspectRatioStyle,
      touchTargetSize,
      layoutStrategy
    };
  }

  /**
   * Determine layout strategy for device combination
   */
  private static getLayoutStrategy(
    local: SimpleDeviceShare,
    remote: SimpleDeviceShare
  ): 'fill' | 'letterbox' | 'pillarbox' | 'crop' {
    
    // Mobile viewing desktop: letterbox to show full desktop content
    if (local.deviceType === 'mobile' && remote.deviceType === 'desktop') {
      return 'letterbox';
    }
    
    // Desktop viewing mobile: pillarbox to show full mobile content
    if (local.deviceType === 'desktop' && remote.deviceType === 'mobile') {
      return 'pillarbox';
    }
    
    // Same orientation: fill
    if (local.orientation === remote.orientation) {
      return 'fill';
    }
    
    // Different orientations: letterbox for better visibility
    return 'letterbox';
  }

  /**
   * Get container CSS class for remote video
   */
  private static getContainerClass(remote: SimpleDeviceShare, local: SimpleDeviceShare): string {
    const baseClass = 'relative overflow-hidden rounded-lg';
    
    // Size based on local viewport
    let sizeClass = '';
    if (local.viewportSize === 'small') {
      sizeClass = 'w-full max-h-[40vh]';
    } else if (local.viewportSize === 'medium') {
      sizeClass = 'w-full max-h-[50vh]';
    } else {
      sizeClass = 'w-full max-h-[60vh]';
    }
    
    return `${baseClass} ${sizeClass}`;
  }

  /**
   * Get video CSS class based on layout strategy
   */
  private static getVideoClass(strategy: string): string {
    const baseClass = 'w-full h-full';
    
    switch (strategy) {
      case 'fill':
        return `${baseClass} object-cover`;
      case 'letterbox':
      case 'pillarbox':
        return `${baseClass} object-contain`;
      case 'crop':
        return `${baseClass} object-cover`;
      default:
        return `${baseClass} object-contain`;
    }
  }

  /**
   * Get aspect ratio CSS style
   */
  private static getAspectRatioStyle(aspectRatio: string): React.CSSProperties {
    return {
      aspectRatio: aspectRatio
    };
  }

  /**
   * Get touch target size for local device
   */
  private static getTouchTargetSize(local: SimpleDeviceShare): 'compact' | 'medium' | 'large' {
    if (local.viewportSize === 'small') return 'compact';
    if (local.viewportSize === 'medium') return 'medium';
    return 'large';
  }

  /**
   * Check if device info is fresh (within 30 seconds)
   */
  static isDeviceInfoFresh(deviceShare: SimpleDeviceShare): boolean {
    const age = Date.now() - deviceShare.timestamp;
    return age < 30000; // 30 seconds
  }

  /**
   * Default device share for SSR
   */
  private static getDefaultDeviceShare(): SimpleDeviceShare {
    return {
      deviceType: 'desktop',
      orientation: 'landscape',
      aspectRatio: '16/9',
      viewportSize: 'large',
      preferredVideoSize: 'high',
      timestamp: Date.now()
    };
  }

  /**
   * Convert to legacy DeviceInfo format for backward compatibility
   */
  static toLegacyFormat(deviceShare: SimpleDeviceShare): any {
    return {
      isMobile: deviceShare.deviceType === 'mobile',
      isTablet: deviceShare.deviceType === 'tablet',
      isDesktop: deviceShare.deviceType === 'desktop',
      orientation: deviceShare.orientation,
      screenWidth: deviceShare.orientation === 'landscape' ? 1920 : 1080, // Estimated
      screenHeight: deviceShare.orientation === 'landscape' ? 1080 : 1920, // Estimated
      aspectRatio: deviceShare.aspectRatio
    };
  }

  /**
   * Create from legacy DeviceInfo format
   */
  static fromLegacyFormat(legacyDevice: any): SimpleDeviceShare {
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (legacyDevice.isMobile) deviceType = 'mobile';
    else if (legacyDevice.isTablet) deviceType = 'tablet';

    return {
      deviceType,
      orientation: legacyDevice.orientation || 'landscape',
      aspectRatio: legacyDevice.aspectRatio || '16/9',
      viewportSize: deviceType === 'mobile' ? 'small' : deviceType === 'tablet' ? 'medium' : 'large',
      preferredVideoSize: deviceType === 'mobile' ? 'medium' : 'high',
      timestamp: Date.now()
    };
  }
}

/**
 * React hook for device sharing
 */
export function useSimpleDeviceShare() {
  const [deviceShare, setDeviceShare] = React.useState<SimpleDeviceShare>(() =>
    SimpleDeviceManager.createDeviceShare()
  );

  React.useEffect(() => {
    const updateDeviceShare = () => {
      setDeviceShare(SimpleDeviceManager.createDeviceShare());
    };

    // Update on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(updateDeviceShare, 300); // Allow time for orientation to complete
    });

    // Update on significant resize
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateDeviceShare, 150);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', updateDeviceShare);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return deviceShare;
}