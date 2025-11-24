# Script para iniciar el servidor web de Expo
Write-Host "Iniciando servidor web de Expo..." -ForegroundColor Green
Write-Host ""

# Cambiar al directorio mobile
Set-Location "packages\mobile"

# Verificar si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Iniciar Expo en modo web
Write-Host "Iniciando Expo web server..." -ForegroundColor Cyan
Write-Host "El servidor estará disponible en: http://localhost:19006" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

$env:CI = "1"
npx expo start --web

