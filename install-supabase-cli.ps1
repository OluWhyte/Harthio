# Install Supabase CLI for Windows
Write-Host "Installing Supabase CLI..." -ForegroundColor Cyan

# Create directory for CLI
$installDir = "$env:LOCALAPPDATA\supabase"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

# Download latest release
$version = "v1.200.3"  # Update this to latest version
$url = "https://github.com/supabase/cli/releases/download/$version/supabase_windows_amd64.zip"
$zipPath = "$installDir\supabase.zip"

Write-Host "Downloading from $url..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $url -OutFile $zipPath

Write-Host "Extracting..." -ForegroundColor Yellow
Expand-Archive -Path $zipPath -DestinationPath $installDir -Force
Remove-Item $zipPath

# Add to PATH for current session
$env:Path += ";$installDir"

Write-Host "✓ Supabase CLI installed to: $installDir" -ForegroundColor Green
Write-Host ""
Write-Host "To use in future sessions, add to your PATH:" -ForegroundColor Yellow
Write-Host "  $installDir" -ForegroundColor Gray
Write-Host ""
Write-Host "Or run this command:" -ForegroundColor Yellow
Write-Host '  [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$installDir", "User")' -ForegroundColor Gray
Write-Host ""
Write-Host "Testing installation..." -ForegroundColor Yellow
& "$installDir\supabase.exe" --version
