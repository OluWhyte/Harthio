# Setup Development Database - Helper Script
# This script helps you copy the database schema to your dev Supabase project

Write-Host ""
Write-Host "Setting up Development Database" -ForegroundColor Cyan
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue

# Configuration
$devSupabaseUrl = "https://scnbnmqokchmnnoehnjr.supabase.co"
$sqlFile = "database\migrations\combined.sql"

# Step 1: Check if SQL file exists
Write-Host ""
Write-Host "Step 1: Checking SQL file..." -ForegroundColor Yellow

if (Test-Path $sqlFile) {
    $fileSize = (Get-Item $sqlFile).Length / 1KB
    $roundedSize = [math]::Round($fileSize, 1)
    Write-Host "Found: $sqlFile ($roundedSize KB)" -ForegroundColor Green
} else {
    Write-Host "Error: SQL file not found at $sqlFile" -ForegroundColor Red
    exit 1
}

# Step 2: Copy SQL content to clipboard
Write-Host ""
Write-Host "Step 2: Copying SQL to clipboard..." -ForegroundColor Yellow

try {
    Get-Content $sqlFile -Raw | Set-Clipboard
    Write-Host "SQL content copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "Error copying to clipboard: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Open Supabase SQL Editor
Write-Host ""
Write-Host "Step 3: Opening Supabase SQL Editor..." -ForegroundColor Yellow
$sqlEditorUrl = "$devSupabaseUrl/project/default/sql/new"

Write-Host "Opening: $sqlEditorUrl" -ForegroundColor Blue
Start-Process $sqlEditorUrl

# Instructions
Write-Host ""
Write-Host "==================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Supabase SQL Editor should open in your browser" -ForegroundColor White
Write-Host "2. The SQL is already in your clipboard" -ForegroundColor White
Write-Host "3. Paste it (Ctrl+V) into the editor" -ForegroundColor White
Write-Host "4. Click 'Run' button (or press Ctrl+Enter)" -ForegroundColor White
Write-Host "5. Wait ~30 seconds for completion" -ForegroundColor White
Write-Host "6. Look for success message at the bottom" -ForegroundColor White

Write-Host ""
Write-Host "Tip: If browser doesn't open, go to:" -ForegroundColor Yellow
Write-Host "$sqlEditorUrl" -ForegroundColor Blue
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
