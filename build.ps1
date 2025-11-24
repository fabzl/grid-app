# Root-level build script for Grip
# Supports both native Windows Rust and WSL/Nix builds

param(
    [switch]$UseWSL,
    [switch]$UseNix
)

Write-Host "Building Grip project..." -ForegroundColor Cyan
Write-Host ""

# Check for native Cargo first (unless WSL/Nix explicitly requested)
if (-not $UseWSL -and -not $UseNix) {
    $cargo = Get-Command cargo -ErrorAction SilentlyContinue
    if (-not $cargo) {
        $homeCargo = Join-Path $env:USERPROFILE ".cargo\bin\cargo.exe"
        if (Test-Path $homeCargo) {
            Write-Host "Found Cargo at: $homeCargo" -ForegroundColor Green
            Write-Host "Building backend..." -ForegroundColor Yellow
            Set-Location "packages\backend"
            & $homeCargo build --release --target wasm32-unknown-unknown
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Backend built successfully!" -ForegroundColor Green
                Set-Location "..\.."
                exit 0
            } else {
                Write-Error "Build failed with exit code $LASTEXITCODE"
                Set-Location "..\.."
                exit 1
            }
        }
    } else {
        Write-Host "Found Cargo in PATH" -ForegroundColor Green
        Write-Host "Building backend..." -ForegroundColor Yellow
        Set-Location "packages\backend"
        cargo build --release --target wasm32-unknown-unknown
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend built successfully!" -ForegroundColor Green
            Set-Location "..\.."
            exit 0
        } else {
            Write-Error "Build failed with exit code $LASTEXITCODE"
            Set-Location "..\.."
            exit 1
        }
    }
}

# If native build didn't work, try WSL/Nix
if ($UseWSL -or $UseNix -or -not $cargo) {
    Write-Host "Attempting build via WSL/Nix..." -ForegroundColor Yellow
    
    # Check if WSL is available
    $wsl = Get-Command wsl -ErrorAction SilentlyContinue
    if (-not $wsl) {
        Write-Error "WSL not found. Install WSL or install Rust natively."
        exit 1
    }
    
    Write-Host "Running build in WSL..." -ForegroundColor Yellow
    $repoPath = (Get-Location).Path.Replace('\', '/')
    $wslPath = "/mnt/$($repoPath[0].ToString().ToLower())/$($repoPath.Substring(3))"
    
    # Build using bash script in WSL
    wsl -e bash -c "cd '$wslPath/packages/backend' && nix develop --command bash -c 'cargo build --release --target wasm32-unknown-unknown'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend built successfully via WSL/Nix!" -ForegroundColor Green
        exit 0
    } else {
        Write-Error "WSL/Nix build failed with exit code $LASTEXITCODE"
        Write-Host ""
        Write-Host "To install Rust natively:" -ForegroundColor Yellow
        Write-Host "  1. Visit https://rustup.rs/" -ForegroundColor Cyan
        Write-Host "  2. Run the installer" -ForegroundColor Cyan
        Write-Host "  3. Restart your terminal" -ForegroundColor Cyan
        exit 1
    }
}

