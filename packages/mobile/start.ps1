# Simple script to start Expo
Write-Host "Starting Expo web server..." -ForegroundColor Green
Write-Host ""
cd $PSScriptRoot
npx expo start --clear --web

