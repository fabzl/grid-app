# PowerShell build script for Windows
Write-Host "Building Grip Holochain zome..." -ForegroundColor Cyan

# Change to the script's directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$cargo = Get-Command cargo -ErrorAction SilentlyContinue
if (-not $cargo) {
    $homeCargo = Join-Path $env:USERPROFILE ".cargo\bin\cargo.exe"
    if (Test-Path $homeCargo) {
        & $homeCargo build --release --target wasm32-unknown-unknown
    } else {
        Write-Error "Cargo not found. Install Rust first."
        exit 1
    }
} else {
    cargo build --release --target wasm32-unknown-unknown
}

if ($LASTEXITCODE -eq 0) {
    $wasmPath = Join-Path $scriptDir "target\wasm32-unknown-unknown\release\grip_backend.wasm"
    if (Test-Path $wasmPath) {
        $size = (Get-Item $wasmPath).Length / 1KB
        Write-Host "WASM built successfully at: $wasmPath ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "Build completed but WASM file not found at expected location" -ForegroundColor Yellow
    }
} else {
    Write-Error "Build failed!"
    exit 1
}

