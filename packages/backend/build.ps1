# PowerShell build script for Windows
Write-Host "Building Grip Holochain zome..." -ForegroundColor Cyan
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
Write-Host "WASM built successfully at: target\wasm32-unknown-unknown\release\grip_backend.wasm" -ForegroundColor Green

