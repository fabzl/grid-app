# Start Expo web server
Write-Host "Starting Expo web server..." -ForegroundColor Green
Set-Location "packages\mobile"

# Check if expo is installed
if (-not (Test-Path "node_modules\.bin\expo.cmd")) {
    Write-Host "Expo not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Launching Expo..." -ForegroundColor Cyan
npx expo start --web --port 19006


