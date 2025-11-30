# Database Deployment Preparation Script
# This script helps identify and organize database migrations for deployment

Write-Host "=== Harthio Database Deployment Preparation ===" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✓ Supabase CLI installed: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI not found" -ForegroundColor Red
    Write-Host "Install with: npm install -g supabase" -ForegroundColor Yellow
    Write-Host ""
    $install = Read-Host "Install Supabase CLI now? (y/n)"
    if ($install -eq 'y') {
        npm install -g supabase
    } else {
        Write-Host "Exiting. Please install Supabase CLI first." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== Database Migration Files ===" -ForegroundColor Cyan
Write-Host ""

# List all migration files
$migrationPath = "database/migrations"
$migrations = Get-ChildItem -Path $migrationPath -Filter "*.sql" | Sort-Object Name

Write-Host "Found $($migrations.Count) migration files:" -ForegroundColor Yellow
Write-Host ""

$criticalMigrations = @(
    "add-ai-chat-history.sql",
    "add-ai-feedback.sql",
    "add-ai-provider-tracking.sql",
    "007_ai_user_preferences.sql",
    "add-new-features-announcement-email.sql"
)

Write-Host "CRITICAL MIGRATIONS (for new AI features):" -ForegroundColor Red
foreach ($file in $criticalMigrations) {
    $exists = Test-Path "$migrationPath/$file"
    if ($exists) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (MISSING)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "ALL MIGRATION FILES:" -ForegroundColor Yellow
foreach ($migration in $migrations) {
    $size = [math]::Round($migration.Length / 1KB, 2)
    Write-Host "  - $($migration.Name) ($size KB)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Deployment Options ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Deploy all migrations at once" -ForegroundColor Yellow
Write-Host "  Command: supabase db push" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Deploy specific migration" -ForegroundColor Yellow
Write-Host "  Command: supabase db push --file database/migrations/FILENAME.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3: Create consolidated migration" -ForegroundColor Yellow
Write-Host "  This script can combine critical migrations into one file" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Create consolidated migration file? (y/n)"

if ($choice -eq 'y') {
    Write-Host ""
    Write-Host "Creating consolidated migration..." -ForegroundColor Yellow
    
    $consolidatedPath = "database/migrations/DEPLOY_consolidated_ai_features.sql"
    $content = @"
-- Consolidated Migration for AI Features
-- Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- This file combines all critical migrations for the AI feature update

-- ============================================
-- IMPORTANT: Review each section before running
-- ============================================

"@

    foreach ($file in $criticalMigrations) {
        $filePath = "$migrationPath/$file"
        if (Test-Path $filePath) {
            $content += "`n`n-- ============================================`n"
            $content += "-- Migration: $file`n"
            $content += "-- ============================================`n`n"
            $content += Get-Content $filePath -Raw
        }
    }

    Set-Content -Path $consolidatedPath -Value $content -Encoding UTF8
    Write-Host "✓ Created: $consolidatedPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Review this file before deploying!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Link to your Supabase project:" -ForegroundColor Yellow
Write-Host "   supabase login" -ForegroundColor Gray
Write-Host "   supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy migrations to development first:" -ForegroundColor Yellow
Write-Host "   supabase db push" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test thoroughly in preview environment" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Deploy to production only after testing" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Safety Reminder ===" -ForegroundColor Red
Write-Host "Always backup production database before migrations!" -ForegroundColor Red
Write-Host ""
