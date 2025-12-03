# Generate self-signed certificate for localhost
$cert = New-SelfSignedCertificate `
    -Subject "CN=localhost" `
    -DnsName "localhost", "127.0.0.1", "::1" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddYears(1) `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName "Harthio Development Certificate" `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

Write-Host "Certificate created with thumbprint: $($cert.Thumbprint)"

# Export certificate
$certPath = Join-Path $PSScriptRoot ".certs"
if (-not (Test-Path $certPath)) {
    New-Item -ItemType Directory -Path $certPath | Out-Null
}

$pfxPassword = ConvertTo-SecureString -String "dev" -Force -AsPlainText
$pfxPath = Join-Path $certPath "localhost.pfx"
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pfxPassword | Out-Null

# Convert PFX to PEM format using .NET
$pfxCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, "dev", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)

# Export certificate (public key)
$certPem = "-----BEGIN CERTIFICATE-----`n"
$certPem += [System.Convert]::ToBase64String($pfxCert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
$certPem += "`n-----END CERTIFICATE-----"
$certPem | Out-File -FilePath (Join-Path $certPath "localhost.crt") -Encoding ASCII

# Export private key
$rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($pfxCert)
$keyBytes = $rsa.ExportRSAPrivateKey()
$keyPem = "-----BEGIN RSA PRIVATE KEY-----`n"
$keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$keyPem += "`n-----END RSA PRIVATE KEY-----"
$keyPem | Out-File -FilePath (Join-Path $certPath "localhost.key") -Encoding ASCII

Write-Host "✅ Certificates generated successfully in .certs folder"
Write-Host "   - localhost.crt (certificate)"
Write-Host "   - localhost.key (private key)"
Write-Host ""
Write-Host "You can now run: npm run dev:https"
