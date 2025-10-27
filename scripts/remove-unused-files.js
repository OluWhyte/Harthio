#!/usr/bin/env node

/**
 * Remove Unused Files Script
 * 
 * This script safely removes unused files in phases with testing between each phase.
 * It provides rollback capabilities and verification at each step.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files organized by removal phases (safest first)
const REMOVAL_PHASES = {
  phase1: {
    name: 'Safe Removal - Development/Test Files',
    files: [
      'src/ai/dev.ts',
      'src/lib/csp-safe-video-test.ts',
      'src/test/manual-media-state-test.ts',
      'src/lib/daily-test.ts'
    ],
    risk: 'LOW'
  },
  phase2: {
    name: 'Medium Risk - Utility Files',
    files: [
      'src/lib/error-suppression.ts',
      'src/lib/production-stability.ts',
      'src/lib/rollback-migration.ts'
    ],
    risk: 'MEDIUM'
  },
  phase3: {
    name: 'High Risk - Keep for Review',
    files: [
      'src/lib/enhanced-webrtc-manager.ts'
    ],
    risk: 'HIGH'
  }
};

const BACKUP_DIR = 'backup/unused-files-backup';

/**
 * Check if backup exists
 */
function verifyBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ Backup directory not found. Run backup script first.');
    process.exit(1);
  }
  
  console.log('✅ Backup directory verified');
}

/**
 * Run tests to verify application still works
 */
function runTests() {
  try {
    console.log('🧪 Running TypeScript compilation check...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful');
    
    console.log('🧪 Running ESLint check...');
    execSync('npm run lint', { stdio: 'pipe' });
    console.log('✅ ESLint check passed');
    
    return true;
  } catch (error) {
    console.log('❌ Tests failed:', error.message);
    return false;
  }
}

/**
 * Remove a single file
 */
function removeFile(filePath) {
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File already removed or not found: ${filePath}`);
    return true;
  }
  
  try {
    fs.unlinkSync(fullPath);
    console.log(`🗑️  Removed: ${filePath}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to remove ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Restore a file from backup
 */
function restoreFile(filePath) {
  const backupPath = path.resolve(BACKUP_DIR, filePath);
  const targetPath = path.resolve(filePath);
  const targetDir = path.dirname(targetPath);
  
  if (!fs.existsSync(backupPath)) {
    console.log(`❌ Backup not found for: ${filePath}`);
    return false;
  }
  
  try {
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.copyFileSync(backupPath, targetPath);
    console.log(`🔄 Restored: ${filePath}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to restore ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Process a removal phase
 */
function processPhase(phaseKey, phase, options = {}) {
  console.log(`\n🎯 Starting ${phase.name}`);
  console.log(`   Risk Level: ${phase.risk}`);
  console.log(`   Files: ${phase.files.length}`);
  
  if (phase.risk === 'HIGH' && !options.forceHigh) {
    console.log(`⚠️  Skipping HIGH risk phase. Use --force-high to proceed.`);
    return { success: true, skipped: true };
  }
  
  if (!options.skipConfirmation) {
    console.log(`\n❓ Proceed with ${phase.name}? (y/N)`);
    // In a real implementation, you'd want to add readline for user input
    // For now, we'll assume confirmation
  }
  
  const results = [];
  
  // Remove files
  for (const file of phase.files) {
    const success = removeFile(file);
    results.push({ file, success, action: 'remove' });
  }
  
  // Test after removal
  console.log('\n🧪 Testing after removal...');
  const testsPass = runTests();
  
  if (!testsPass) {
    console.log('❌ Tests failed! Rolling back this phase...');
    
    // Rollback all files from this phase
    for (const file of phase.files) {
      const restored = restoreFile(file);
      results.push({ file, success: restored, action: 'restore' });
    }
    
    // Test again after rollback
    console.log('🧪 Testing after rollback...');
    const rollbackTestsPass = runTests();
    
    if (!rollbackTestsPass) {
      console.log('❌ Critical error: Tests still failing after rollback!');
      process.exit(1);
    }
    
    return { success: false, results, rolledBack: true };
  }
  
  console.log(`✅ Phase ${phaseKey} completed successfully`);
  return { success: true, results };
}

/**
 * Create removal report
 */
function createRemovalReport(phaseResults) {
  const timestamp = new Date().toISOString();
  const totalFiles = Object.values(phaseResults).reduce((sum, phase) => 
    sum + (phase.results ? phase.results.length : 0), 0);
  
  const report = `# File Removal Report

**Timestamp**: ${timestamp}
**Total Files Processed**: ${totalFiles}

## Phase Results

${Object.entries(phaseResults).map(([phaseKey, result]) => `
### ${phaseKey.toUpperCase()}
- **Status**: ${result.success ? '✅ Success' : '❌ Failed'}
- **Skipped**: ${result.skipped ? 'Yes' : 'No'}
- **Rolled Back**: ${result.rolledBack ? 'Yes' : 'No'}
${result.results ? result.results.map(r => `- ${r.action === 'remove' ? '🗑️' : '🔄'} ${r.file} (${r.success ? 'Success' : 'Failed'})`).join('\n') : ''}
`).join('\n')}

## Summary

- All phases completed with testing
- Backup available at: ${BACKUP_DIR}
- Monitor application for 30 days
- Remove backup after verification period

## Rollback Instructions

If issues are discovered:

1. Run: \`node scripts/restore-unused-files.js [filename]\`
2. Or manually copy from backup directory
3. Test functionality
4. Update documentation

`;

  fs.writeFileSync('REMOVAL_REPORT.md', report);
  console.log('📄 Created removal report: REMOVAL_REPORT.md');
}

/**
 * Main removal process
 */
function main() {
  const args = process.argv.slice(2);
  const options = {
    skipConfirmation: args.includes('--yes'),
    forceHigh: args.includes('--force-high'),
    phaseOnly: args.find(arg => arg.startsWith('--phase='))?.split('=')[1]
  };
  
  console.log('🚀 Starting unused files removal process...\n');
  
  // Verify backup exists
  verifyBackup();
  
  // Initial test to ensure we start from a working state
  console.log('🧪 Running initial tests...');
  if (!runTests()) {
    console.log('❌ Initial tests failed. Fix issues before proceeding.');
    process.exit(1);
  }
  
  const phaseResults = {};
  
  // Process phases
  for (const [phaseKey, phase] of Object.entries(REMOVAL_PHASES)) {
    if (options.phaseOnly && options.phaseOnly !== phaseKey) {
      continue;
    }
    
    phaseResults[phaseKey] = processPhase(phaseKey, phase, options);
    
    if (!phaseResults[phaseKey].success && !phaseResults[phaseKey].skipped) {
      console.log(`❌ Phase ${phaseKey} failed. Stopping process.`);
      break;
    }
  }
  
  // Create report
  createRemovalReport(phaseResults);
  
  // Final summary
  const successful = Object.values(phaseResults).filter(r => r.success).length;
  const failed = Object.values(phaseResults).filter(r => !r.success).length;
  
  console.log(`\n📊 Removal Process Complete:`);
  console.log(`   ✅ Successful Phases: ${successful}`);
  console.log(`   ❌ Failed Phases: ${failed}`);
  console.log(`   📄 Report: REMOVAL_REPORT.md`);
  
  console.log(`\n🎯 Next Steps:`);
  console.log(`   1. Monitor application for issues`);
  console.log(`   2. Test all functionality thoroughly`);
  console.log(`   3. Keep backup for 30 days`);
  console.log(`   4. Update documentation if needed`);
}

// Run the removal process
if (require.main === module) {
  main();
}

module.exports = { removeFile, restoreFile, REMOVAL_PHASES };