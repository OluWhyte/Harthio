/**
 * Adaptive Video Constraints
 * Automatically adjusts video aspect ratio based on device type and orientation
 */

import React from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  viewportWidth?: number;
  viewportHeight?: number;
  availableWidth?: number;
  availableHeight?: number;
  videoWidth?: number;
  videoHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export interface VideoConstraints {
  width: { ideal: number; max: number };
  height: { ideal: number; max: number };
  aspectRatio: number;
  frameRate: { ideal: number; max: number };
}

export class AdaptiveVideoConstraints {
  
  /**
   * Detect device type and orientation
   */
  static getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    // Use viewport dimensions instead of screen dimensions for better accuracy
    // This accounts for browser UI, address bars, etc.
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Also get the actual available height (excluding browser UI)
    const availableHeight = window.screen?.availHeight || viewportHeight;
    const availableWidth = window.screen?.availWidth || viewportWidth;
    
    // For mobile devices, use screen dimensions for more accurate orientation detection
    // This is because viewport dimensions can be affected by browser UI
    const isMobileDevice = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTabletDevice = /iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent);
    
    let screenWidth, screenHeight, orientation;
    
    if (isMobileDevice || isTabletDevice) {
      // For mobile/tablet, use screen dimensions for orientation detection
      // But also consider the orientation API if available
      const screenDimensions = {
        width: window.screen?.width || viewportWidth,
        height: window.screen?.height || viewportHeight
      };
      
      // Use orientation API if available (most reliable on mobile)
      if (typeof window.screen?.orientation !== 'undefined') {
        const orientationAngle = window.screen.orientation.angle;
        const orientationType = window.screen.orientation.type;
        
        console.log('📱 Using Screen Orientation API:', { angle: orientationAngle, type: orientationType });
        
        // Determine orientation based on orientation API
        if (orientationType.includes('portrait')) {
          orientation = 'portrait';
          screenWidth = Math.min(screenDimensions.width, screenDimensions.height);
          screenHeight = Math.max(screenDimensions.width, screenDimensions.height);
        } else {
          orientation = 'landscape';
          screenWidth = Math.max(screenDimensions.width, screenDimensions.height);
          screenHeight = Math.min(screenDimensions.width, screenDimensions.height);
        }
      } else if (typeof window.orientation !== 'undefined') {
        // Fallback to window.orientation (older API)
        const orientationAngle = Math.abs(window.orientation);
        console.log('📱 Using window.orientation:', orientationAngle);
        
        if (orientationAngle === 90 || orientationAngle === 270) {
          orientation = 'landscape';
          screenWidth = Math.max(screenDimensions.width, screenDimensions.height);
          screenHeight = Math.min(screenDimensions.width, screenDimensions.height);
        } else {
          orientation = 'portrait';
          screenWidth = Math.min(screenDimensions.width, screenDimensions.height);
          screenHeight = Math.max(screenDimensions.width, screenDimensions.height);
        }
      } else {
        // Fallback to screen dimensions comparison
        console.log('📱 Using screen dimensions fallback:', screenDimensions);
        if (screenDimensions.width > screenDimensions.height) {
          orientation = 'landscape';
          screenWidth = screenDimensions.width;
          screenHeight = screenDimensions.height;
        } else {
          orientation = 'portrait';
          screenWidth = screenDimensions.width;
          screenHeight = screenDimensions.height;
        }
      }
      
      // Additional check: if viewport dimensions strongly disagree with detected orientation,
      // and we're using an API-based detection, double-check with viewport
      const viewportOrientation = viewportWidth > viewportHeight ? 'landscape' : 'portrait';
      if (viewportOrientation !== orientation) {
        console.log('📱 Viewport orientation disagrees with API:', { 
          api: orientation, 
          viewport: viewportOrientation,
          viewportSize: `${viewportWidth}x${viewportHeight}`,
          screenSize: `${screenWidth}x${screenHeight}`
        });
        
        // If the disagreement is significant, trust the viewport for layout purposes
        const viewportAspectRatio = viewportWidth / viewportHeight;
        const screenAspectRatio = screenWidth / screenHeight;
        
        if (Math.abs(viewportAspectRatio - screenAspectRatio) > 0.3) {
          console.log('📱 Significant aspect ratio difference, using viewport orientation');
          orientation = viewportOrientation;
          screenWidth = viewportWidth;
          screenHeight = viewportHeight;
        }
      }
    } else {
      // For desktop, use viewport dimensions
      screenWidth = viewportWidth;
      screenHeight = viewportHeight;
      orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
    }
    
    // Detect device type based on viewport size and user agent
    const isMobile = isMobileDevice || (viewportWidth <= 768 && 'ontouchstart' in window);
    const isTablet = isTabletDevice || (viewportWidth >= 768 && viewportWidth <= 1024 && 'ontouchstart' in window);
    const isDesktop = !isMobile && !isTablet;
    
    console.log('📱 Device Info Detection:', {
      userAgent: userAgent.substring(0, 50) + '...',
      viewport: `${viewportWidth}x${viewportHeight}`,
      screen: `${screenWidth}x${screenHeight}`,
      orientation,
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      orientationAPI: typeof window.screen?.orientation !== 'undefined' ? window.screen.orientation.type : 'not available',
      windowOrientation: typeof window.orientation !== 'undefined' ? window.orientation : 'not available'
    });
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      orientation,
      screenWidth,
      screenHeight,
      // Additional viewport info for better layout decisions
      viewportWidth,
      viewportHeight,
      availableWidth,
      availableHeight
    };
  }

  /**
   * Get safe area dimensions that account for browser UI
   * Especially important on mobile devices
   */
  static getSafeAreaDimensions(): { width: number; height: number; safeHeight: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // On mobile, account for browser UI that might hide/show
    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let safeHeight = viewportHeight;
    
    if (isMobile) {
      // On mobile, browser UI can take 50-100px typically
      // Use a conservative estimate to ensure content is always visible
      const estimatedBrowserUI = Math.min(100, viewportHeight * 0.1); // Max 10% or 100px
      safeHeight = viewportHeight - estimatedBrowserUI;
    }
    
    return {
      width: viewportWidth,
      height: viewportHeight,
      safeHeight: Math.max(safeHeight, viewportHeight * 0.8) // Ensure at least 80% is usable
    };
  }

  /**
   * Get optimal video constraints based on device and orientation
   */
  static getVideoConstraints(deviceInfo?: DeviceInfo): VideoConstraints {
    const device = deviceInfo || this.getDeviceInfo();
    
    // Mobile Portrait (9:16 aspect ratio) - Much lower resolution for natural field of view
    if (device.isMobile && device.orientation === 'portrait') {
      return {
        width: { ideal: 240, max: 360 },
        height: { ideal: 426, max: 640 },
        aspectRatio: 9/16, // Portrait
        frameRate: { ideal: 20, max: 24 }
      };
    }
    
    // Mobile Landscape (16:9 aspect ratio) - Much lower resolution for natural field of view
    if (device.isMobile && device.orientation === 'landscape') {
      return {
        width: { ideal: 426, max: 640 },
        height: { ideal: 240, max: 360 },
        aspectRatio: 16/9, // Landscape
        frameRate: { ideal: 20, max: 24 }
      };
    }
    
    // Tablet Portrait (3:4 aspect ratio)
    if (device.isTablet && device.orientation === 'portrait') {
      return {
        width: { ideal: 768, max: 1024 },
        height: { ideal: 1024, max: 1366 },
        aspectRatio: 3/4, // Tablet portrait
        frameRate: { ideal: 30, max: 30 }
      };
    }
    
    // Tablet Landscape (4:3 aspect ratio)
    if (device.isTablet && device.orientation === 'landscape') {
      return {
        width: { ideal: 1024, max: 1366 },
        height: { ideal: 768, max: 1024 },
        aspectRatio: 4/3, // Tablet landscape
        frameRate: { ideal: 30, max: 30 }
      };
    }
    
    // Desktop (16:9 aspect ratio - standard)
    return {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      aspectRatio: 16/9, // Standard desktop
      frameRate: { ideal: 30, max: 60 }
    };
  }

  /**
   * Get media constraints for getUserMedia
   */
  static getMediaConstraints(deviceInfo?: DeviceInfo): MediaStreamConstraints {
    const device = deviceInfo || this.getDeviceInfo();
    const videoConstraints = this.getVideoConstraints(device);
    
    // Mobile-specific video settings for natural lens zoom
    const mobileVideoSettings = device.isMobile ? {
      // Use device's natural camera settings - no forced resolution
      facingMode: 'user', // Front camera
      // Let the device choose its optimal resolution
      width: { min: 320 }, // Minimum only, no ideal/max to avoid zoom
      height: { min: 240 }, // Minimum only
      frameRate: { ideal: 30, max: 30 }, // Keep frame rate reasonable
    } : {
      width: videoConstraints.width,
      height: videoConstraints.height,
      aspectRatio: videoConstraints.aspectRatio,
      frameRate: videoConstraints.frameRate,
    };
    
    return {
      video: mobileVideoSettings,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: device.isMobile ? 16000 : 48000, // Lower sample rate on mobile
      }
    };
  }

  /**
   * Get CSS aspect ratio class and inline style for video containers
   */
  static getAspectRatioClass(deviceInfo?: DeviceInfo): { className: string; style?: React.CSSProperties } {
    const device = deviceInfo || this.getDeviceInfo();
    
    // Use actual screen dimensions to calculate exact aspect ratio
    const aspectRatio = `${device.screenWidth}/${device.screenHeight}`;
    
    return { 
      className: 'w-full',
      style: { aspectRatio } // Use actual screen aspect ratio
    };
  }

  /**
   * Get display name for device type
   */
  static getDeviceDisplayName(deviceInfo?: DeviceInfo): string {
    const device = deviceInfo || this.getDeviceInfo();
    
    if (device.isMobile) {
      return device.orientation === 'portrait' ? 'Mobile Portrait' : 'Mobile Landscape';
    }
    
    if (device.isTablet) {
      return device.orientation === 'portrait' ? 'Tablet Portrait' : 'Tablet Landscape';
    }
    
    return 'Desktop';
  }

  /**
   * Listen for orientation changes and update constraints
   */
  static onOrientationChange(callback: (deviceInfo: DeviceInfo) => void): () => void {
    const handleOrientationChange = () => {
      // Longer delay for mobile devices to ensure orientation is fully updated
      const delay = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 300 : 100;
      
      setTimeout(() => {
        const deviceInfo = this.getDeviceInfo();
        console.log('📱 Orientation changed:', deviceInfo.orientation, `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`);
        callback(deviceInfo);
      }, delay);
    };

    // Listen for multiple orientation change events for better coverage
    const events = ['orientationchange', 'resize'];
    
    // Also listen for screen orientation API changes if available
    if (window.screen?.orientation) {
      events.push('orientationchange');
      // Modern browsers support screen.orientation.addEventListener
      if (window.screen.orientation.addEventListener) {
        window.screen.orientation.addEventListener('change', handleOrientationChange);
      }
    }

    // Add all event listeners
    events.forEach(event => {
      window.addEventListener(event, handleOrientationChange);
    });

    // Return cleanup function
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleOrientationChange);
      });
      
      if (window.screen?.orientation?.removeEventListener) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }

  /**
   * Get optimal video layout for remote streams based on their device type
   */
  static getRemoteVideoLayout(remoteDeviceInfo: DeviceInfo, localDeviceInfo?: DeviceInfo): {
    containerClass: string;
    videoClass: string;
    description: string;
    style?: React.CSSProperties;
  } {
    const local = localDeviceInfo || this.getDeviceInfo();
    
    // Calculate exact aspect ratio from actual screen dimensions
    const screenAspectRatio = remoteDeviceInfo.screenWidth / remoteDeviceInfo.screenHeight;
    const aspectRatio = `${remoteDeviceInfo.screenWidth}/${remoteDeviceInfo.screenHeight}`;
    
    // Determine container sizing based on actual aspect ratio and device type
    let containerClass: string;
    
    if (screenAspectRatio < 1) {
      // Portrait orientation (height > width)
      if (remoteDeviceInfo.isMobile) {
        containerClass = 'max-w-xs mx-auto'; // Small for mobile portrait
      } else if (remoteDeviceInfo.isTablet) {
        containerClass = 'max-w-sm mx-auto'; // Medium for tablet portrait
      } else {
        containerClass = 'max-w-md mx-auto'; // Larger for desktop portrait (rare but possible)
      }
    } else if (screenAspectRatio > 1.5) {
      // Wide landscape orientation
      containerClass = 'w-full'; // Full width for wide screens
    } else {
      // Square-ish or mild landscape
      containerClass = 'max-w-lg mx-auto'; // Moderate width for square-ish screens
    }
    
    const deviceType = remoteDeviceInfo.isMobile ? 'Mobile' : remoteDeviceInfo.isTablet ? 'Tablet' : 'Desktop';
    const description = `${deviceType} user (${remoteDeviceInfo.screenWidth}×${remoteDeviceInfo.screenHeight})`;
    
    return {
      containerClass,
      videoClass: 'w-full h-full object-cover',
      description,
      style: { aspectRatio }
    };
  }
}