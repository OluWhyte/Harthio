# Clean Next.js Cache Script
Write-Host "Cleaning Next.js cache..." -ForegroundColor Cyan

# Remove .next directory
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host ".next removed" -ForegroundColor Green
}

# Remove node_modules cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "node_modules cache removed" -ForegroundColor Green
}

# Remove TypeScript build info
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo"
    Write-Host "TypeScript build info removed" -ForegroundColor Green
}

Write-Host "Cache cleaned successfully!" -ForegroundColor Green
