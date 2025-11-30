# Regenerate Supabase Database Types
# This script extracts the project ID from .env.local and regenerates TypeScript types

Write-Host "🔄 Regenerating Supabase Database Types..." -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    Write-Host "Please create .env.local with NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Extract Supabase URL
$envContent = Get-Content ".env.local" -Raw
$supabaseUrl = $envContent | Select-String -Pattern 'NEXT_PUBLIC_SUPABASE_URL=(.+)' | ForEach-Object { $_.Matches.Groups[1].Value.Trim() }

if (-not $supabaseUrl) {
    Write-Host "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local" -ForegroundColor Red
    exit 1
}

# Extract project ID from URL (format: https://PROJECT_ID.supabase.co)
if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $projectId = $matches[1]
    Write-Host "✅ Found Project ID: $projectId" -ForegroundColor Green
} else {
    Write-Host "❌ Error: Could not extract project ID from URL: $supabaseUrl" -ForegroundColor Red
    exit 1
}

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command npx -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Error: npx not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host "🔐 Generating types from Supabase project..." -ForegroundColor Cyan
Write-Host "   Project ID: $projectId" -ForegroundColor Gray

# Generate types
try {
    $output = npx supabase gen types typescript --project-id $projectId 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $output | Out-File -FilePath "src/lib/database.types.ts" -Encoding UTF8
        Write-Host "✅ Database types regenerated successfully!" -ForegroundColor Green
        Write-Host "   File: src/lib/database.types.ts" -ForegroundColor Gray
        
        # Show file size
        $fileSize = (Get-Item "src/lib/database.types.ts").Length
        Write-Host "   Size: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor Gray
    } else {
        Write-Host "❌ Error generating types:" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        Write-Host "" -ForegroundColor Yellow
        Write-Host "💡 Possible solutions:" -ForegroundColor Yellow
        Write-Host "   1. Login to Supabase: npx supabase login" -ForegroundColor Gray
        Write-Host "   2. Check your project ID is correct" -ForegroundColor Gray
        Write-Host "   3. Verify you have access to the project" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Done! Run 'npm run typecheck' to verify." -ForegroundColor Green
