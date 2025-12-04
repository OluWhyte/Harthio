# Cleanup Temporary Files
# Run this to remove temporary files created during development

Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Cyan
Write-Host ""

# Files to delete
$filesToDelete = @(
    "database/CHECK-CURRENT-STATE.sql",
    "database/CHECK-FUNCTION.sql",
    "CURRENCY-FIX-SUMMARY.md"
)

$deletedCount = 0

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ Deleted: $file" -ForegroundColor Green
        $deletedCount++
    } else {
        Write-Host "⏭️  Skipped: $file (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Cleanup complete! Deleted $deletedCount file(s)" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review PRODUCTION-DEPLOYMENT.md"
Write-Host "  2. Run migrations in production Supabase"
Write-Host "  3. Update environment variables in Vercel"
Write-Host "  4. Test payments in production"
Write-Host ""
