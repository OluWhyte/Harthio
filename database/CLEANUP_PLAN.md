# Database Cleanup Plan

## 🎯 Goal
Keep only the 5 essential production migrations and organize the rest.

## 📦 Proposed Structure

```
database/
├── migrations/              # PRODUCTION ONLY (5 files)
│   ├── combined.sql
│   ├── daily-checkins.sql
│   ├── sobriety-trackers.sql
│   ├── visual-journey.sql
│   └── fix-topics-and-rpc.sql
│
├── monitoring/              # Keep (useful for debugging)
│   ├── health-check-queries.sql
│   ├── security-audit.sql
│   └── security-audit-step-by-step.sql
│
├── setup/                   # Keep (admin setup)
│   └── setup-admin.sql
│
├── archive/                 # NEW - Move unused files here
│   ├── security-fixes/      # Already in combined.sql
│   ├── experimental/        # Not in v0.3
│   └── legacy/              # Old versions
│
├── PRODUCTION_MIGRATIONS.md # NEW - What to run
├── CLEANUP_PLAN.md          # This file
└── README.md                # Keep
```

## 🗂️ Files to Archive

### Move to `archive/security-fixes/` (Already in combined.sql)
- security-fixes/add-archive-foreign-key.sql
- security-fixes/drop-topics-backup.sql
- security-fixes/fix-admin-view-access.sql
- security-fixes/fix-all-security-definer-views.sql
- security-fixes/fix-device-analytics-security.sql
- security-fixes/fix-messages-insert-final.sql
- security-fixes/fix-notifications-security.sql
- security-fixes/fix-remaining-security-issues.sql
- security-fixes/fix-topics-rls-policy.sql
- security-fixes/fix-user-footprints-security.sql
- security-fixes/fix-user-management-view-columns.sql

### Move to `archive/experimental/` (Not in v0.3)
- migrations/add-recovery-goals.sql
- migrations/blog-schema.sql
- migrations/device-tracking-schema.sql
- migrations/enable-pg-cron.sql
- migrations/create-topics-archive.sql
- migrations/fix-archive-no-participants.sql
- migrations/migrate-old-requests-to-new-table.sql

### Move to `archive/legacy/` (Old versions)
- admin-notifications-table.sql
- email-campaigns-schema.sql
- performance-optimizations.sql
- user-management-system.sql
- waitlist-email-template.sql
- recreate-templates-fresh.sql

## ✅ Benefits

1. **Clarity**: Only 5 files in migrations/ - clear what to run
2. **Safety**: Nothing deleted, just organized
3. **History**: Archive preserves development history
4. **Onboarding**: New devs know exactly what to run
5. **Maintenance**: Easy to find what's actually used

## 🚀 How to Execute

**Option 1: Manual** (Safest)
1. Create `database/archive/` folder
2. Create subfolders: `security-fixes/`, `experimental/`, `legacy/`
3. Move files according to list above
4. Test that production migrations still work

**Option 2: Script** (Faster)
Run the PowerShell script (to be created) that does it automatically.

## ⚠️ Before Cleanup

- ✅ Verify all 5 production migrations work
- ✅ Backup entire database/ folder
- ✅ Document what each archived file did (in archive README)

## 📝 After Cleanup

Update these files:
- README.md - Point to PRODUCTION_MIGRATIONS.md
- DEV-DATABASE-SETUP.md - Update file paths
- Any scripts that reference old paths
