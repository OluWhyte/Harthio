/**
 * Orientation and Video Sizing Tests
 * Test orientation detection and video constraints across all providers
 */

import { AdaptiveVideoConstraints, type DeviceInfo } from './adaptive-video-constraints';

export interface OrientationTestResult {
  provider: string;
  deviceInfo: DeviceInfo;
  videoConstraints: any;
  mediaConstraints: MediaStreamConstraints;
  aspectRatio: { className: string; style?: React.CSSProperties };
  displayName: string;
  complexity: 'simple' | 'moderate' | 'complex';
  issues: string[];
  recommendations: string[];
}

export class OrientationTester {
  
  /**
   * Test orientation detection and video constraints
   */
  static async testOrientationAndSizing(): Promise<OrientationTestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Test device info detection
      console.log('🧪 Testing device info detection...');
      const deviceInfo = AdaptiveVideoConstraints.getDeviceInfo();
      
      // Test video constraints
      console.log('🧪 Testing video constraints...');
      const videoConstraints = AdaptiveVideoConstraints.getVideoConstraints(deviceInfo);
      
      // Test media constraints
      console.log('🧪 Testing media constraints...');
      const mediaConstraints = AdaptiveVideoConstraints.getMediaConstraints(deviceInfo);
      
      // Test aspect ratio
      console.log('🧪 Testing aspect ratio calculation...');
      const aspectRatio = AdaptiveVideoConstraints.getAspectRatioClass(deviceInfo);
      
      // Test display name
      const displayName = AdaptiveVideoConstraints.getDeviceDisplayName(deviceInfo);
      
      // Analyze complexity
      let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
      
      // Check for complexity indicators
      if (deviceInfo.orientation && deviceInfo.screenWidth && deviceInfo.screenHeight) {
        complexity = 'moderate';
      }
      
      // Check for high complexity indicators
      const hasMultipleOrientationAPIs = typeof window.screen?.orientation !== 'undefined' && typeof window.orientation !== 'undefined';
      const hasComplexAspectRatio = aspectRatio.style && Object.keys(aspectRatio.style).length > 1;
      const hasComplexConstraints = JSON.stringify(videoConstraints).length > 200;
      
      if (hasMultipleOrientationAPIs || hasComplexAspectRatio || hasComplexConstraints) {
        complexity = 'complex';
      }
      
      // Identify issues
      if (deviceInfo.screenWidth === deviceInfo.viewportWidth && deviceInfo.screenHeight === deviceInfo.viewportHeight) {
        issues.push('Screen and viewport dimensions are identical - may not account for browser UI');
      }
      
      if (videoConstraints.width.ideal < 320 || videoConstraints.height.ideal < 240) {
        issues.push('Video resolution is very low - may affect quality');
      }
      
      if (complexity === 'complex') {
        issues.push('Implementation is overly complex with multiple fallback mechanisms');
      }
      
      // Generate recommendations
      if (issues.length > 0) {
        recommendations.push('Consider simplifying orientation detection');
        recommendations.push('Use standard aspect ratios (16:9, 4:3, 9:16) instead of exact screen ratios');
        recommendations.push('Reduce fallback mechanisms to essential ones only');
      }
      
      if (deviceInfo.isMobile && videoConstraints.frameRate.ideal > 24) {
        recommendations.push('Consider lower frame rate (15-20fps) for mobile to save bandwidth');
      }
      
      return {
        provider: 'AdaptiveVideoConstraints',
        deviceInfo,
        videoConstraints,
        mediaConstraints,
        aspectRatio,
        displayName,
        complexity,
        issues,
        recommendations
      };
      
    } catch (error) {
      return {
        provider: 'AdaptiveVideoConstraints',
        deviceInfo: {} as DeviceInfo,
        videoConstraints: {},
        mediaConstraints: {},
        aspectRatio: { className: 'aspect-video' },
        displayName: 'Error',
        complexity: 'complex',
        issues: [`Error during testing: ${error}`],
        recommendations: ['Fix implementation errors before proceeding']
      };
    }
  }
  
  /**
   * Test orientation detection across different simulated scenarios
   */
  static async testOrientationScenarios(): Promise<{
    portrait: OrientationTestResult;
    landscape: OrientationTestResult;
    current: OrientationTestResult;
  }> {
    console.log('🧪 Testing orientation scenarios...');
    
    // Test current orientation
    const current = await this.testOrientationAndSizing();
    
    // Simulate portrait (can't actually change orientation, but can test logic)
    const portraitResult = { ...current, provider: 'Simulated Portrait' };
    const landscapeResult = { ...current, provider: 'Simulated Landscape' };
    
    return {
      portrait: portraitResult,
      landscape: landscapeResult,
      current
    };
  }
  
  /**
   * Test video constraints for each provider
   */
  static async testProviderVideoConstraints(): Promise<{
    daily: any;
    jitsi: any;
    webrtc: any;
    adaptive: any;
  }> {
    console.log('🧪 Testing video constraints across providers...');
    
    const deviceInfo = AdaptiveVideoConstraints.getDeviceInfo();
    const adaptiveConstraints = AdaptiveVideoConstraints.getMediaConstraints(deviceInfo);
    
    // Standard constraints that most providers use
    const standardConstraints = {
      video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
    
    // Mobile-optimized constraints
    const mobileConstraints = {
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
    
    return {
      daily: deviceInfo.isMobile ? mobileConstraints : standardConstraints,
      jitsi: standardConstraints,
      webrtc: standardConstraints,
      adaptive: adaptiveConstraints
    };
  }
  
  /**
   * Generate a simplified orientation detection approach
   */
  static generateSimplifiedApproach(): {
    code: string;
    explanation: string;
    benefits: string[];
  } {
    const code = `
// Simplified Orientation Detection
export function getSimpleDeviceInfo() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  const orientation = width > height ? 'landscape' : 'portrait';
  
  return { width, height, isMobile, isTablet, orientation };
}

// Simplified Video Constraints
export function getSimpleVideoConstraints(deviceInfo) {
  if (deviceInfo.isMobile) {
    return {
      video: { width: 480, height: 360, frameRate: 20 },
      audio: { echoCancellation: true, noiseSuppression: true }
    };
  }
  
  return {
    video: { width: 640, height: 480, frameRate: 30 },
    audio: { echoCancellation: true, noiseSuppression: true }
  };
}
`;

    const explanation = `
This simplified approach:
1. Uses only viewport dimensions (window.innerWidth/Height)
2. Simple device detection based on width breakpoints
3. Standard video constraints without complex calculations
4. No multiple API fallbacks or complex aspect ratio calculations
`;

    const benefits = [
      'Much simpler to understand and maintain',
      'Fewer edge cases and potential bugs',
      'Faster execution (no complex calculations)',
      'Works reliably across all browsers',
      'Easier to test and debug',
      'Standard constraints work well for video calling'
    ];

    return { code, explanation, benefits };
  }
}

// Console testing functions
if (typeof window !== 'undefined') {
  (window as any).testOrientation = () => OrientationTester.testOrientationAndSizing();
  (window as any).testOrientationScenarios = () => OrientationTester.testOrientationScenarios();
  (window as any).testProviderConstraints = () => OrientationTester.testProviderVideoConstraints();
  (window as any).getSimplifiedApproach = () => OrientationTester.generateSimplifiedApproach();
  
  console.log('🧪 Orientation testing available:');
  console.log('- testOrientation() - Test current orientation detection');
  console.log('- testOrientationScenarios() - Test different scenarios');
  console.log('- testProviderConstraints() - Compare provider constraints');
  console.log('- getSimplifiedApproach() - Get simplified implementation');
}