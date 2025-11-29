# ============================================================================
# Database Cleanup Script
# ============================================================================
# This script cleans up outdated and duplicate database files
# Run this from the project root directory

Write-Host "🧹 Database Cleanup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "This will delete outdated database files. Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Green
Write-Host ""

# Track what we're doing
$deletedFiles = @()
$deletedFolders = @()
$errors = @()

# Function to safely delete file
function Remove-FileIfExists {
    param($path)
    if (Test-Path $path) {
        try {
            Remove-Item $path -Force
            $deletedFiles += $path
            Write-Host "✅ Deleted: $path" -ForegroundColor Green
        } catch {
            $errors += "Failed to delete $path : $_"
            Write-Host "❌ Failed: $path" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Not found: $path" -ForegroundColor Yellow
    }
}

# Function to safely delete folder
function Remove-FolderIfExists {
    param($path)
    if (Test-Path $path) {
        try {
            Remove-Item $path -Recurse -Force
            $deletedFolders += $path
            Write-Host "✅ Deleted folder: $path" -ForegroundColor Green
        } catch {
            $errors += "Failed to delete folder $path : $_"
            Write-Host "❌ Failed: $path" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Not found: $path" -ForegroundColor Yellow
    }
}

Write-Host "1️⃣  Deleting outdated documentation..." -ForegroundColor Cyan
Remove-FileIfExists "database\PRODUCTION_MIGRATIONS.md"

Write-Host ""
Write-Host "2️⃣  Deleting emergency fixes folder..." -ForegroundColor Cyan
Remove-FolderIfExists "database\emergency-fixes"

Write-Host ""
Write-Host "3️⃣  Deleting deprecated migrations..." -ForegroundColor Cyan
Remove-FileIfExists "database\migrations\ai-analytics-complete-setup.sql"
Remove-FileIfExists "database\migrations\visual-journey-complete.sql"
Remove-FileIfExists "database\migrations\combined.sql"

Write-Host ""
Write-Host "4️⃣  Deleting duplicate files..." -ForegroundColor Cyan
Remove-FileIfExists "database\clear-test-user-data.sql"
Remove-FileIfExists "check-admin-status.sql"

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Cleanup Summary" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files deleted: $($deletedFiles.Count)" -ForegroundColor Green
Write-Host "Folders deleted: $($deletedFolders.Count)" -ForegroundColor Green
Write-Host "Errors: $($errors.Count)" -ForegroundColor $(if ($errors.Count -gt 0) { "Red" } else { "Green" })

if ($deletedFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "Deleted files:" -ForegroundColor Yellow
    $deletedFiles | ForEach-Object { Write-Host "  - $_" }
}

if ($deletedFolders.Count -gt 0) {
    Write-Host ""
    Write-Host "Deleted folders:" -ForegroundColor Yellow
    $deletedFolders | ForEach-Object { Write-Host "  - $_" }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Errors encountered:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" }
}

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review DATABASE_DEPLOYMENT_GUIDE.md for production deployment"
Write-Host "2. Use DEPLOYMENT_CHECKLIST.md when deploying"
Write-Host "3. Commit the cleaned-up database folder to git"
Write-Host ""
