/**
 * Quick Migration Fix
 * Immediate fixes for migration issues
 */

import { OrientationAdapter } from './migrate-to-simple-orientation';

export class QuickMigrationFix {
  
  /**
   * Test if orientation detection is working
   */
  static testOrientation(): {
    success: boolean;
    deviceInfo: any;
    issues: string[];
  } {
    const issues: string[] = [];
    
    try {
      const deviceInfo = OrientationAdapter.getDeviceInfo();
      
      // Check for common issues
      if (!deviceInfo) {
        issues.push('getDeviceInfo returned null/undefined');
      }
      
      if (deviceInfo && typeof deviceInfo.orientation !== 'string') {
        issues.push('orientation property is missing or invalid');
      }
      
      if (deviceInfo && typeof deviceInfo.isMobile !== 'boolean') {
        issues.push('isMobile property is missing or invalid');
      }
      
      if (deviceInfo && (!deviceInfo.screenWidth || !deviceInfo.screenHeight)) {
        issues.push('screen dimensions are missing');
      }
      
      console.log('🧪 Orientation Test:', { deviceInfo, issues });
      
      return {
        success: issues.length === 0,
        deviceInfo,
        issues
      };
      
    } catch (error) {
      issues.push(`Error: ${error}`);
      return {
        success: false,
        deviceInfo: null,
        issues
      };
    }
  }
  
  /**
   * Test if media constraints are working
   */
  static testMediaConstraints(): {
    success: boolean;
    constraints: any;
    issues: string[];
  } {
    const issues: string[] = [];
    
    try {
      const constraints = OrientationAdapter.getMediaConstraints();
      
      // Check for common issues
      if (!constraints) {
        issues.push('getMediaConstraints returned null/undefined');
      }
      
      if (constraints && !constraints.video) {
        issues.push('video constraints are missing');
      }
      
      if (constraints && !constraints.audio) {
        issues.push('audio constraints are missing');
      }
      
      console.log('🧪 Media Constraints Test:', { constraints, issues });
      
      return {
        success: issues.length === 0,
        constraints,
        issues
      };
      
    } catch (error) {
      issues.push(`Error: ${error}`);
      return {
        success: false,
        constraints: null,
        issues
      };
    }
  }
  
  /**
   * Test camera preview functionality
   */
  static async testCameraPreview(): Promise<{
    success: boolean;
    mediaState: any;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Check if media stream controller is available
      const { mediaStreamController } = await import('@/lib/media-stream-controller');
      
      if (!mediaStreamController) {
        issues.push('mediaStreamController is not available');
        return { success: false, mediaState: null, issues };
      }
      
      // Get current media state
      const mediaState = mediaStreamController.getState();
      
      if (!mediaState) {
        issues.push('mediaStreamController.getState() returned null');
      }
      
      // Test toggle functions exist
      if (typeof mediaStreamController.toggleAudio !== 'function') {
        issues.push('mediaStreamController.toggleAudio is not a function');
      }
      
      if (typeof mediaStreamController.toggleVideo !== 'function') {
        issues.push('mediaStreamController.toggleVideo is not a function');
      }
      
      console.log('🧪 Camera Preview Test:', { mediaState, issues });
      
      return {
        success: issues.length === 0,
        mediaState,
        issues
      };
      
    } catch (error) {
      issues.push(`Error: ${error}`);
      return {
        success: false,
        mediaState: null,
        issues
      };
    }
  }
  
  /**
   * Run all quick tests
   */
  static async runQuickTests(): Promise<{
    orientation: any;
    mediaConstraints: any;
    cameraPreview: any;
    overallSuccess: boolean;
  }> {
    console.log('🧪 Running quick migration tests...');
    
    const orientation = this.testOrientation();
    const mediaConstraints = this.testMediaConstraints();
    const cameraPreview = await this.testCameraPreview();
    
    const overallSuccess = orientation.success && mediaConstraints.success && cameraPreview.success;
    
    console.log('📊 Quick Test Results:');
    console.log('- Orientation:', orientation.success ? '✅ PASS' : '❌ FAIL', orientation.issues);
    console.log('- Media Constraints:', mediaConstraints.success ? '✅ PASS' : '❌ FAIL', mediaConstraints.issues);
    console.log('- Camera Preview:', cameraPreview.success ? '✅ PASS' : '❌ FAIL', cameraPreview.issues);
    console.log('- Overall:', overallSuccess ? '✅ SUCCESS' : '❌ ISSUES FOUND');
    
    if (!overallSuccess) {
      console.log('🔧 Issues to fix:');
      [...orientation.issues, ...mediaConstraints.issues, ...cameraPreview.issues].forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
    
    return {
      orientation,
      mediaConstraints,
      cameraPreview,
      overallSuccess
    };
  }
}

// Console testing
if (typeof window !== 'undefined') {
  (window as any).quickTestMigration = () => QuickMigrationFix.runQuickTests();
  (window as any).testOrientation = () => QuickMigrationFix.testOrientation();
  (window as any).testMediaConstraints = () => QuickMigrationFix.testMediaConstraints();
  (window as any).testCameraPreview = () => QuickMigrationFix.testCameraPreview();
  
  console.log('🧪 Quick migration testing available:');
  console.log('- quickTestMigration() - Run all quick tests');
  console.log('- testOrientation() - Test orientation detection');
  console.log('- testMediaConstraints() - Test media constraints');
  console.log('- testCameraPreview() - Test camera preview functionality');
}