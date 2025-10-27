/**
 * Migration Rollback Utility
 * Quick rollback if migration causes issues
 */

export class MigrationRollback {
  
  /**
   * Instructions for manual rollback
   */
  static getRollbackInstructions(): string[] {
    return [
      '1. Replace OrientationAdapter imports with AdaptiveVideoConstraints',
      '2. Update method calls back to AdaptiveVideoConstraints.method()',
      '3. Restore original adaptive-video-constraints.ts file',
      '4. Test functionality',
      '5. Debug specific issues'
    ];
  }
  
  /**
   * Check if rollback is needed
   */
  static async checkIfRollbackNeeded(): Promise<{
    needsRollback: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Test basic functionality
      const { OrientationAdapter } = await import('./migrate-to-simple-orientation');
      
      // Test device info
      const deviceInfo = OrientationAdapter.getDeviceInfo();
      if (!deviceInfo || !deviceInfo.orientation) {
        issues.push('Device info detection not working');
      }
      
      // Test media constraints
      const constraints = OrientationAdapter.getMediaConstraints();
      if (!constraints || !constraints.video) {
        issues.push('Media constraints not working');
      }
      
      // Test aspect ratio
      const aspectRatio = OrientationAdapter.getAspectRatioClass();
      if (!aspectRatio || !aspectRatio.className) {
        issues.push('Aspect ratio calculation not working');
      }
      
      const needsRollback = issues.length > 0;
      
      if (needsRollback) {
        recommendations.push('Consider rolling back migration temporarily');
        recommendations.push('Debug specific issues one by one');
        recommendations.push('Test with original implementation');
      } else {
        recommendations.push('Migration appears successful');
        recommendations.push('Continue with testing and validation');
      }
      
      return {
        needsRollback,
        issues,
        recommendations
      };
      
    } catch (error) {
      return {
        needsRollback: true,
        issues: [`Critical error: ${error}`],
        recommendations: ['Immediate rollback recommended', 'Check import paths and dependencies']
      };
    }
  }
  
  /**
   * Generate rollback commands
   */
  static generateRollbackCommands(): string[] {
    return [
      '// 1. Revert imports in session components',
      'import { AdaptiveVideoConstraints, type DeviceInfo } from \'@/lib/adaptive-video-constraints\';',
      '',
      '// 2. Revert method calls',
      'AdaptiveVideoConstraints.getDeviceInfo()',
      'AdaptiveVideoConstraints.getMediaConstraints()',
      'AdaptiveVideoConstraints.onOrientationChange()',
      '',
      '// 3. Files to update:',
      '- src/components/session/harthio-session-ui.tsx',
      '- src/components/session/camera-preview.tsx', 
      '- src/app/session/[sessionId]/page.tsx',
      '- src/lib/fixed-webrtc-manager.ts'
    ];
  }
}

// Console helper
if (typeof window !== 'undefined') {
  (window as any).checkRollback = () => MigrationRollback.checkIfRollbackNeeded();
  (window as any).getRollbackInstructions = () => {
    const instructions = MigrationRollback.getRollbackInstructions();
    const commands = MigrationRollback.generateRollbackCommands();
    
    console.log('🔄 Rollback Instructions:');
    instructions.forEach((instruction, i) => console.log(`${i + 1}. ${instruction}`));
    
    console.log('\n📝 Rollback Commands:');
    commands.forEach(command => console.log(command));
    
    return { instructions, commands };
  };
}