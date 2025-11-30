# Cleanup Script - Run before production deployment
# Removes development files and sensitive data

Write-Host "🧹 Cleaning up development files..." -ForegroundColor Cyan

# Files to delete
# NOTE: Keeping SSL certificates for local development (needed for video calls)
$filesToDelete = @(
    # "localhost+3-key.pem",  # Keep for local HTTPS testing
    # "localhost+3.pem",      # Keep for local HTTPS testing
    "ngrok.exe",
    "check-my-admin-status.sql",
    "cleanup-database-files.ps1",
    "cleanup-temp-files.ps1",
    "test-templates.js",
    "tsc_output.txt",
    "tsc_output_utf8.txt",
    "tsc_output_utf8_2.txt",
    "typecheck_output.txt",
    "CLEANUP_PLAN.md",
    "CLEANUP_SUMMARY.md",
    "CSRF_FIX_COMPLETE.md",
    "ISSUES_FIXED_SUMMARY.md",
    "TYPESCRIPT_ERRORS_FIXED.md",
    "AI_PROVIDER_TOGGLES_COMPLETE.md",
    "QUICK_FIX.md",
    "audit-report-2025-11-30.md"
)

$deletedCount = 0
$notFoundCount = 0

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✓ Deleted: $file" -ForegroundColor Green
        $deletedCount++
    } else {
        Write-Host "- Not found: $file" -ForegroundColor Gray
        $notFoundCount++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  Deleted: $deletedCount files" -ForegroundColor Green
Write-Host "  Not found: $notFoundCount files" -ForegroundColor Gray

Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
Write-Host "`n⚠️  Remember to:" -ForegroundColor Yellow
Write-Host "  1. Verify .env.local is NOT committed" -ForegroundColor Yellow
Write-Host "  2. Set production environment variables in Vercel" -ForegroundColor Yellow
Write-Host "  3. Run 'npm run build' to test" -ForegroundColor Yellow
