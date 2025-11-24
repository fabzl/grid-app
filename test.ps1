# Quick test script for Grip App
Write-Host "Starting Grip App..." -ForegroundColor Cyan
Write-Host ""

$mobilePath = "packages\mobile"
if (-not (Test-Path $mobilePath)) {
    Write-Error "Mobile directory not found!"
    exit 1
}

Write-Host "Starting Expo web server..." -ForegroundColor Yellow
Set-Location $mobilePath
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run web"

Write-Host ""
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "Opening browser at http://localhost:19006" -ForegroundColor Green
Start-Process "http://localhost:19006"

Write-Host ""
Write-Host "✅ App should be opening in your browser!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick test steps:" -ForegroundColor Cyan
Write-Host "1. Enter any name to login"
Write-Host "2. Explore the 4 tabs: Perfiles, Comprar, Servicios, Perfil"
Write-Host "3. Tap any user profile to see options"
Write-Host "4. Try chat, video call, and moderation features"
Write-Host "5. Test service filters (Taxi, Habitaciones, Profesionales)"
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

