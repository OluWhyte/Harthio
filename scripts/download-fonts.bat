@echo off
REM Font Download Script for Harthio (Windows)
REM Downloads all required fonts locally to eliminate Google Fonts dependency

echo 📥 Downloading fonts locally...

REM Create fonts directory
if not exist "public\fonts" mkdir "public\fonts"

REM Download Inter fonts
echo ⬇️ Downloading Inter fonts...
curl -o "public/fonts/inter-400.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2"
curl -o "public/fonts/inter-500.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2"
curl -o "public/fonts/inter-600.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZ9hiJ-Ek-_EeA.woff2"
curl -o "public/fonts/inter-700.woff2" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2"

REM Download Poppins fonts
echo ⬇️ Downloading Poppins fonts...
curl -o "public/fonts/poppins-400.woff2" "https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2"
curl -o "public/fonts/poppins-500.woff2" "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2"
curl -o "public/fonts/poppins-600.woff2" "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2"
curl -o "public/fonts/poppins-700.woff2" "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2"

echo ✅ All fonts downloaded successfully!
echo 📊 Font files:
dir public\fonts

echo.
echo 🎯 Next steps:
echo 1. Fonts are ready to use
echo 2. Build your app: npm run build
echo 3. No more Google Fonts network issues!