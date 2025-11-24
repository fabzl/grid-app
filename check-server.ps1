# Quick test script to check Expo web server
Write-Host "Checking Expo web server status..." -ForegroundColor Cyan
Write-Host ""

# Check if server is running
$port = 19006
$connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue

if ($connection.TcpTestSucceeded) {
    Write-Host "✅ Server is running on port $port" -ForegroundColor Green
    Write-Host ""
    Write-Host "Open: http://localhost:$port" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "If you see a white screen:" -ForegroundColor Yellow
    Write-Host "1. Press F12 to open DevTools" -ForegroundColor White
    Write-Host "2. Check the Console tab for JavaScript errors" -ForegroundColor White
    Write-Host "3. Check the Network tab for failed requests" -ForegroundColor White
} else {
    Write-Host "❌ Server is not running on port $port" -ForegroundColor Red
    Write-Host ""
    Write-Host "Start the server with:" -ForegroundColor Yellow
    Write-Host "  python main.py" -ForegroundColor Cyan
    Write-Host "  or" -ForegroundColor White
    Write-Host "  cd packages\mobile && npm run web" -ForegroundColor Cyan
}


