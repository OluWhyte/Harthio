# ============================================================================
# Generate Combined Deployment SQL
# ============================================================================
# This script combines all migration files into a single SQL file
# that you can run in Supabase SQL Editor

Write-Host "📦 Generating Combined Deployment SQL" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$outputFile = "DEPLOY_TO_PRODUCTION.sql"

# Check if output file exists
if (Test-Path $outputFile) {
    $overwrite = Read-Host "File $outputFile already exists. Overwrite? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "❌ Cancelled" -ForegroundColor Yellow
        exit
    }
    Remove-Item $outputFile
}

# Create the combined SQL file
$content = @"
-- ============================================================================
-- HARTHIO PRODUCTION DEPLOYMENT SQL
-- ============================================================================
-- Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- 
-- This file contains all migrations needed for production deployment.
-- Run this entire file in Supabase SQL Editor.
--
-- IMPORTANT: 
-- - Backup your database before running this
-- - Test in staging environment first
-- - Run during low-traffic period
-- ============================================================================

-- ============================================================================
-- STEP 1: ADMIN SYSTEM
-- ============================================================================

"@

# Function to add migration file
function Add-Migration {
    param($path, $description)
    
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        return @"

-- ----------------------------------------------------------------------------
-- $description
-- File: $path
-- ----------------------------------------------------------------------------

$content

"@
    } else {
        Write-Host "⚠️  Warning: $path not found" -ForegroundColor Yellow
        return "-- WARNING: $path not found`n`n"
    }
}

Write-Host "Adding migrations to combined file..." -ForegroundColor Green

# Step 1: Admin System
$content += Add-Migration "database\migrations\admin-roles.sql" "Admin Roles Table"
$content += Add-Migration "database\migrations\add-permissions-to-admin-roles.sql" "Admin Permissions"
$content += Add-Migration "database\migrations\fix-admin-roles-rls.sql" "Admin RLS Policies"
$content += Add-Migration "database\migrations\add-admin-views.sql" "Admin Dashboard Views"

# Step 2: Tier System
$content += "`n-- ============================================================================`n"
$content += "-- STEP 2: TIER SYSTEM`n"
$content += "-- ============================================================================`n`n"
$content += Add-Migration "database\migrations\add-tier-system.sql" "Subscription Tiers"
$content += Add-Migration "database\migrations\add-tier-admin-policies.sql" "Tier RLS Policies"

# Step 3: Email System
$content += "`n-- ============================================================================`n"
$content += "-- STEP 3: EMAIL SYSTEM`n"
$content += "-- ============================================================================`n`n"
$content += Add-Migration "database\migrations\add-email-templates.sql" "Email Templates"
$content += Add-Migration "database\migrations\fix-email-templates-rls.sql" "Email Templates RLS"
$content += Add-Migration "database\migrations\add-custom-blank-template.sql" "Custom Blank Template"

# Step 4: AI Analytics
$content += "`n-- ============================================================================`n"
$content += "-- STEP 4: AI ANALYTICS (CORRECTED VERSION)`n"
$content += "-- ============================================================================`n`n"
$content += Add-Migration "database\migrations\RUN-THIS-ai-analytics-setup.sql" "AI Analytics Setup"
$content += Add-Migration "database\migrations\add-ai-feedback.sql" "AI Feedback Tracking"
$content += Add-Migration "database\migrations\add-ai-chat-history.sql" "AI Chat History"

# Step 5: Session Archive
$content += "`n-- ============================================================================`n"
$content += "-- STEP 5: SESSION ARCHIVE`n"
$content += "-- ============================================================================`n`n"
$content += Add-Migration "database\migrations\add-session-archive-system.sql" "Session Archive System"

# Step 6: Recovery Trackers
$content += "`n-- ============================================================================`n"
$content += "-- STEP 6: RECOVERY TRACKERS`n"
$content += "-- ============================================================================`n`n"
$content += Add-Migration "database\migrations\sobriety-trackers.sql" "Sobriety Trackers"
$content += Add-Migration "database\migrations\daily-checkins.sql" "Daily Check-ins"

# Step 7: Security Fixes
$content += "`n-- ============================================================================`n"
$content += "-- STEP 7: SECURITY FIXES (CRITICAL)`n"
$content += "-- ============================================================================`n`n"
$content += Add-Migration "database\security-fixes\secure-recovery-data.sql" "Secure Recovery Data"
$content += Add-Migration "database\security-fixes\fix-all-security-definer-views.sql" "Fix Security Definer Views"
$content += Add-Migration "database\security-fixes\fix-notifications-security.sql" "Fix Notifications Security"
$content += Add-Migration "database\security-fixes\fix-topics-rls-policy.sql" "Fix Topics RLS"

# Footer
$content += @"

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
-- 
-- Next steps:
-- 1. Run database/setup/add-admin-user.sql (edit email first)
-- 2. Run database/monitoring/health-check-queries.sql to verify
-- 3. Test all functionality
-- 4. Monitor Supabase logs for errors
--
-- ============================================================================
"@

# Write to file
$content | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host ""
Write-Host "✅ Generated: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "File size: $((Get-Item $outputFile).Length / 1KB) KB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the generated file: $outputFile"
Write-Host "2. Backup your production database"
Write-Host "3. Copy the contents of $outputFile"
Write-Host "4. Paste into Supabase SQL Editor"
Write-Host "5. Run the entire script"
Write-Host "6. Follow DEPLOYMENT_CHECKLIST.md for verification"
Write-Host ""
