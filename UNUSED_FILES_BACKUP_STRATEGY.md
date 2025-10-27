# Unused Files Backup Strategy

## 🎯 Overview

This document outlines a safe backup strategy for removing potentially unused files from the Harthio project. The strategy ensures we can quickly restore files if needed while cleaning up the codebase.

## 📋 Files Identified for Removal

### **High Confidence (Safe to Remove)**
1. `src/ai/dev.ts` - Development AI utilities, no imports found
2. `src/lib/csp-safe-video-test.ts` - CSP video testing, no imports found
3. `src/test/manual-media-state-test.ts` - Manual testing utilities, no imports found
4. `src/lib/daily-test.ts` - Daily.co testing, only in docs

### **Medium Confidence (Review Before Removal)**
5. `src/lib/error-suppression.ts` - Error handling utilities, no imports found
6. `src/lib/production-stability.ts` - Production utilities, no imports found
7. `src/lib/rollback-migration.ts` - Migration utilities, no imports found

### **Low Confidence (Keep for Now)**
8. `src/lib/enhanced-webrtc-manager.ts` - WebRTC manager, referenced in docs

## 🔄 Backup Strategy

### Phase 1: Create Backup Directory
```bash
# Create backup directory with timestamp
mkdir -p backup/unused-files-$(date +%Y%m%d-%H%M%S)
```

### Phase 2: Copy Files to Backup
```bash
# Copy each file to backup with full directory structure
cp src/ai/dev.ts backup/unused-files-$(date +%Y%m%d-%H%M%S)/src/ai/
cp src/lib/csp-safe-video-test.ts backup/unused-files-$(date +%Y%m%d-%H%M%S)/src/lib/
# ... etc for each file
```

### Phase 3: Document File Dependencies
Create a manifest of what each file contained and any potential dependencies.

### Phase 4: Gradual Removal
Remove files in batches, testing after each batch.

### Phase 5: Monitoring Period
Keep backups for 30 days while monitoring for any issues.

## 🛡️ Safety Measures

1. **Git Commit Before Changes**: Ensure clean git state
2. **Branch Creation**: Create dedicated cleanup branch
3. **Incremental Testing**: Test after each file removal
4. **Rollback Plan**: Clear steps to restore files
5. **Team Notification**: Inform team of cleanup process

## 📝 Execution Checklist

- [ ] Create backup directory
- [ ] Copy files to backup
- [ ] Create file manifest
- [ ] Create cleanup branch
- [ ] Remove files incrementally
- [ ] Test after each removal
- [ ] Monitor for 30 days
- [ ] Clean up backups after verification

## 🚨 Emergency Restore Process

If a removed file is needed:

1. **Identify the file** from backup manifest
2. **Copy from backup** to original location
3. **Test functionality** immediately
4. **Update documentation** about file usage
5. **Remove from cleanup list**

## 📊 Success Metrics

- [ ] No broken imports or build errors
- [ ] All tests pass
- [ ] No runtime errors in production
- [ ] Team confirms no missing functionality
- [ ] Reduced codebase size without functionality loss