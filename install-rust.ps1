# PowerShell script to install Rust via rustup
Write-Host "Installing Rust toolchain..." -ForegroundColor Cyan
Write-Host ""

# Check if rustup is already installed
$rustup = Get-Command rustup -ErrorAction SilentlyContinue
if ($rustup) {
    Write-Host "Rustup is already installed!" -ForegroundColor Green
    Write-Host "Current Rust version:" -ForegroundColor Yellow
    rustc --version
    exit 0
}

# Check if cargo is already available
$cargo = Get-Command cargo -ErrorAction SilentlyContinue
if ($cargo) {
    Write-Host "Rust/Cargo is already installed!" -ForegroundColor Green
    Write-Host "Current Rust version:" -ForegroundColor Yellow
    rustc --version
    exit 0
}

Write-Host "Downloading rustup installer..." -ForegroundColor Yellow
$rustupUrl = "https://win.rustup.rs/x86_64"
$rustupInstaller = "$env:TEMP\rustup-init.exe"

try {
    Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupInstaller -UseBasicParsing
    Write-Host "Installer downloaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Launching rustup installer..." -ForegroundColor Yellow
    Write-Host "Please follow the prompts in the installer window." -ForegroundColor Cyan
    Write-Host "After installation, restart your terminal and run: npm run backend:build" -ForegroundColor Cyan
    Write-Host ""
    
    # Run the installer
    Start-Process -FilePath $rustupInstaller -Wait
    
    Write-Host ""
    Write-Host "Installation complete! Please restart your terminal." -ForegroundColor Green
    Write-Host "Then run: npm run backend:build" -ForegroundColor Cyan
} catch {
    Write-Error "Failed to download rustup installer: $_"
    Write-Host ""
    Write-Host "You can manually install Rust by:" -ForegroundColor Yellow
    Write-Host "1. Visit https://rustup.rs/" -ForegroundColor Cyan
    Write-Host "2. Download and run the installer" -ForegroundColor Cyan
    Write-Host "3. Restart your terminal" -ForegroundColor Cyan
    exit 1
}

