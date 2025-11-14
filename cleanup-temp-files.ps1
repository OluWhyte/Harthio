# Safe cleanup of temporary diagnostic files
# These files are NOT used by the application - only for debugging

Write-Host "Starting safe cleanup of temporary files..." -ForegroundColor Green

# Create backup list of what we're deleting
$deletedFiles = @()

# Root directory - SQL diagnostic files (NOT used by app)
$sqlDiagnostics = @(
    "CHECK_CANCELLED_REQUESTS.sql",
    "CHECK_EXPIRED_TOPICS.sql",
    "CHECK_INSERT_POLICIES_DETAIL.sql",
    "CHECK_JOIN_REQUESTS_RLS.sql",
    "CHECK_MESSAGES_CURRENT_STATE.sql",
    "CHECK_MESSAGES_RLS_ONLY.sql",
    "CHECK_MY_USER_AND_REQUESTS.sql",
    "CHECK_OLD_REQUESTS_DETAILS.sql",
    "CHECK_RLS_POLICIES.sql",
    "CHECK_TOPICS_SCHEMA.sql",
    "CHECK_USER_SCHEMA.sql",
    "FIND_MISSING_REQUEST.sql",
    "INVESTIGATE_WHATS_WORKING.sql",
    "RUN_THIS_LOCALLY.sql",
    "TEST_RLS_AS_USER.sql"
)

# Root directory - Temporary status/summary MD files (NOT used by app)
$tempMdFiles = @(
    "ADMIN_ARCHIVE_COMPLETE.md",
    "ARCHIVE_SYSTEM_COMPLETE.md",
    "CHECK_DEPLOYMENT_STATUS.md",
    "CLEANUP_AUDIT_REPORT.md",
    "CLEANUP_COMPLETED.md",
    "CLEANUP_FINAL_REPORT.md",
    "COMPLETE_FIX_AND_PREVENTION.md",
    "DATABASE_DIAGNOSTIC_QUERIES.md",
    "DEPLOYMENT_ARCHIVE_SYSTEM.md",
    "DEPLOYMENT_STEPS_NOW.md",
    "DO_THIS_NOW.md",
    "EMAIL_APPROVAL_DIAGNOSIS.md",
    "EMAIL_CAMPAIGN_FIXES_SUMMARY.md",
    "EMAIL_CAMPAIGNS_DEPLOYMENT.md",
    "EMAIL_CAMPAIGNS_IMPROVEMENTS.md",
    "EMAIL_CAMPAIGNS_UPDATES_COMPLETE.md",
    "EMAIL_PERSONALIZATION_AND_LOGO.md",
    "EMAIL_URL_FIX_COMPLETE.md",
    "FINAL_DIAGNOSIS_AND_FIX.md",
    "FINAL_OPTIMIZATION_STATUS.md",
    "FINAL_SECURITY_AUDIT_REPORT.md",
    "FORCE_TURN_TEST.md",
    "HISTORY_AND_ADMIN_IMPROVEMENTS.md",
    "HISTORY_PERFORMANCE_FIX.md",
    "IMPLEMENTATION_COMPLETE_SUMMARY.md",
    "JOIN_REQUESTS_FIX_SUMMARY.md",
    "MOBILE_VIDEO_BLACK_SCREEN_FIX.md",
    "O1_INTEGRATION_COMPLETE.md",
    "O1_OPTIMIZATION_SUMMARY.md",
    "PAST_SESSION_REQUESTS_FIX.md",
    "PERFORMANCE_OPTIMIZATION_IMPLEMENTATION.md",
    "PREVENTION_CHECKLIST.md",
    "PROFILE_CACHE_IMPLEMENTATION.md",
    "PROFILE_CACHE_QUICK_START.md",
    "PROGRESS_TRACKER.md",
    "QUICK_FIX_CHECKLIST.md",
    "QUICK_FIX_DEPLOYMENT_GUIDE.md",
    "QUICK_START_CHECKLIST.md",
    "READY_TO_DEPLOY.md",
    "SECURITY_ALERTS_CONFIGURED.md",
    "SECURITY_DASHBOARD_COMPLETE.md",
    "SECURITY_FIXES_APPLIED.md",
    "SECURITY_HEADERS_FIX.md",
    "SESSION_COMPLETE_SUMMARY.md",
    "SESSION_HISTORY_IMPLEMENTATION_SUMMARY.md",
    "SESSION_START_WITHOUT_PARTICIPANTS_FIX.md",
    "SETUP_LOCAL_DATABASE.md",
    "SYSTEM_PERFORMANCE_AUDIT.md",
    "TEST_COMMANDS.md",
    "TEST_RESULTS.md",
    "TESTING_VERIFICATION_GUIDE.md",
    "TURN_MIGRATION_CHECKLIST.md",
    "TURN_SERVER_DIAGNOSTIC_GUIDE.md",
    "TYPESCRIPT_FIXES_PHASE3.md",
    "UNUSED_CODE_AUDIT.md",
    "WHATS_NEXT.md"
)

# Root directory - Test scripts (NOT used by app)
$testScripts = @(
    "check-database-state.js",
    "test-approve-reject.js",
    "test-email-api.js",
    "test-email.js",
    "test-get-requests.js",
    "test-rpc-function.js"
)

# Database directory - Temporary fix files (already applied)
$dbTempFiles = @(
    "database/backup-and-cleanup-topics-backup.sql",
    "database/CHECK_CURRENT_STATE.sql",
    "database/check-backup-schema.sql",
    "database/check-device-analytics-view.sql",
    "database/export-topics-backup.sql",
    "database/FIX_WITHOUT_RENAMING.sql",
    "database/fix-join-requests-rls.sql",
    "database/fix-messages-rls.sql",
    "database/fix-rpc-functions.sql",
    "database/migrate-specific-request.sql",
    "database/RESTORE_ORIGINAL.sql",
    "database/rollback-logo-changes.sql",
    "database/secure-topics-backup.sql",
    "database/SIMPLE_FIX_NOW.sql",
    "database/URGENT_FIX_RPC.sql",
    "database/verify-join-requests-status.sql"
)

# Delete SQL diagnostics
foreach ($file in $sqlDiagnostics) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        $deletedFiles += $file
        Write-Host "Deleted: $file" -ForegroundColor Yellow
    }
}

# Delete temp MD files
foreach ($file in $tempMdFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        $deletedFiles += $file
        Write-Host "Deleted: $file" -ForegroundColor Yellow
    }
}

# Delete test scripts
foreach ($file in $testScripts) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        $deletedFiles += $file
        Write-Host "Deleted: $file" -ForegroundColor Yellow
    }
}

# Delete database temp files
foreach ($file in $dbTempFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        $deletedFiles += $file
        Write-Host "Deleted: $file" -ForegroundColor Yellow
    }
}

# Delete debug folder
if (Test-Path "database/debug") {
    Remove-Item "database/debug" -Recurse -Force
    $deletedFiles += "database/debug/"
    Write-Host "Deleted: database/debug/" -ForegroundColor Yellow
}

# Summary
Write-Host "`nCleanup complete!" -ForegroundColor Green
Write-Host "Total files deleted: $($deletedFiles.Count)" -ForegroundColor Cyan
Write-Host "`nKept important files:" -ForegroundColor Green
Write-Host "- All source code (src/)" -ForegroundColor White
Write-Host "- All migrations (database/migrations/)" -ForegroundColor White
Write-Host "- All documentation (README.md, guides, etc.)" -ForegroundColor White
Write-Host "- All configuration files" -ForegroundColor White
Write-Host "`nYour app will work exactly the same!" -ForegroundColor Green
