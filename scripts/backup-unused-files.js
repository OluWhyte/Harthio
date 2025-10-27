#!/usr/bin/env node

/**
 * Backup Unused Files Script
 * 
 * This script safely backs up potentially unused files before removal.
 * It creates a complete backup with directory structure and verification.
 */

const fs = require('fs');
const path = require('path');

// Files to backup
const UNUSED_FILES = [
  'src/ai/dev.ts',
  'src/lib/csp-safe-video-test.ts', 
  'src/test/manual-media-state-test.ts',
  'src/lib/daily-test.ts',
  'src/lib/error-suppression.ts',
  'src/lib/production-stability.ts',
  'src/lib/rollback-migration.ts',
  'src/lib/enhanced-webrtc-manager.ts'
];

// Backup directory
const BACKUP_DIR = 'backup/unused-files-backup';

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

/**
 * Copy file to backup location
 */
function backupFile(filePath) {
  const sourcePath = path.resolve(filePath);
  const backupPath = path.resolve(BACKUP_DIR, filePath);
  const backupDirPath = path.dirname(backupPath);

  // Check if source file exists
  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  Source file not found: ${filePath}`);
    return false;
  }

  // Ensure backup directory exists
  ensureDir(backupDirPath);

  try {
    // Copy file
    fs.copyFileSync(sourcePath, backupPath);
    
    // Verify copy
    const sourceStats = fs.statSync(sourcePath);
    const backupStats = fs.statSync(backupPath);
    
    if (sourceStats.size === backupStats.size) {
      console.log(`✅ Backed up: ${filePath} (${sourceStats.size} bytes)`);
      return true;
    } else {
      console.log(`❌ Backup verification failed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Failed to backup ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Create backup summary
 */
function createBackupSummary(results) {
  const timestamp = new Date().toISOString();
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  const summary = `# Backup Summary

**Timestamp**: ${timestamp}
**Total Files**: ${results.length}
**Successful**: ${successful}
**Failed**: ${failed}

## Results

${results.map(r => `- ${r.success ? '✅' : '❌'} ${r.file}`).join('\n')}

## Next Steps

${successful > 0 ? `
1. Review backed up files in ${BACKUP_DIR}
2. Test application functionality
3. Remove files incrementally if safe
4. Monitor for 30 days
` : ''}

${failed > 0 ? `
⚠️ **Warning**: ${failed} files failed to backup. Review before proceeding.
` : ''}
`;

  fs.writeFileSync(path.resolve(BACKUP_DIR, 'BACKUP_SUMMARY.md'), summary);
  console.log(`📄 Created backup summary: ${BACKUP_DIR}/BACKUP_SUMMARY.md`);
}

/**
 * Main backup process
 */
function main() {
  console.log('🚀 Starting unused files backup process...\n');
  
  // Ensure backup directory exists
  ensureDir(BACKUP_DIR);
  
  // Backup each file
  const results = UNUSED_FILES.map(file => ({
    file,
    success: backupFile(file)
  }));
  
  // Create summary
  createBackupSummary(results);
  
  // Final report
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Backup Complete:`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Backup Location: ${BACKUP_DIR}`);
  
  if (successful > 0) {
    console.log(`\n🎯 Next Steps:`);
    console.log(`   1. Review backup manifest`);
    console.log(`   2. Test application functionality`);
    console.log(`   3. Remove files incrementally`);
    console.log(`   4. Monitor for issues`);
  }
  
  if (failed > 0) {
    console.log(`\n⚠️  Warning: ${failed} files failed to backup. Review before proceeding.`);
    process.exit(1);
  }
}

// Run the backup process
if (require.main === module) {
  main();
}

module.exports = { backupFile, ensureDir, UNUSED_FILES, BACKUP_DIR };