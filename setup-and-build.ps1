# PowerShell script to set up Rust and build the Holochain backend
Write-Host "Setting up Rust for Holochain backend..." -ForegroundColor Cyan
Write-Host ""

# Check if cargo is available
$cargo = Get-Command cargo -ErrorAction SilentlyContinue
if (-not $cargo) {
    $homeCargo = Join-Path $env:USERPROFILE ".cargo\bin\cargo.exe"
    if (Test-Path $homeCargo) {
        $cargo = $homeCargo
    } else {
        Write-Host "Rust/Cargo not found. Installing Rust..." -ForegroundColor Yellow
        Write-Host "Run: npm run backend:install-rust" -ForegroundColor Cyan
        Write-Host "Or visit: https://rustup.rs/" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host "Rust found!" -ForegroundColor Green
Write-Host ""

# Check if wasm32 target is installed
Write-Host "Checking for wasm32-unknown-unknown target..." -ForegroundColor Yellow

# Find rustup
$rustup = Get-Command rustup -ErrorAction SilentlyContinue
if (-not $rustup) {
    $homeRustup = Join-Path $env:USERPROFILE ".cargo\bin\rustup.exe"
    if (Test-Path $homeRustup) {
        $rustup = $homeRustup
    }
}

if ($rustup) {
    $targetCheck = & $rustup target list --installed 2>&1 | Select-String "wasm32-unknown-unknown"
    
    if (-not $targetCheck) {
        Write-Host "Installing wasm32-unknown-unknown target..." -ForegroundColor Yellow
        & $rustup target add wasm32-unknown-unknown
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install wasm32-unknown-unknown target"
            exit 1
        }
        Write-Host "WASM target installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "WASM target already installed!" -ForegroundColor Green
    }
} else {
    Write-Host "rustup not found, skipping target check..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Building Holochain backend..." -ForegroundColor Cyan
Set-Location "packages\backend"

& $cargo build --release --target wasm32-unknown-unknown

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Backend built successfully!" -ForegroundColor Green
    $wasmPath = "target\wasm32-unknown-unknown\release\grip_backend.wasm"
    if (Test-Path $wasmPath) {
        $wasmSize = (Get-Item $wasmPath).Length / 1KB
        Write-Host "WASM file: $wasmPath ($([math]::Round($wasmSize, 2)) KB)" -ForegroundColor Cyan
    }
} else {
    Write-Error "Build failed!"
    Set-Location "..\.."
    exit 1
}

Set-Location "..\.."

