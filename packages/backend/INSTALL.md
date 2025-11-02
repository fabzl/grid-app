# Installation Guide

## Quick Setup

### 1. Install Rust WASM Target
```powershell
# Open PowerShell and run:
rustup target add wasm32-unknown-unknown
```

### 2. Verify Cargo is in PATH
After installing Rust, open a **new** PowerShell window or restart your terminal.

Test:
```powershell
cargo --version
```

If it fails, add Cargo to PATH manually:
```powershell
$env:Path += ";$env:USERPROFILE\.cargo\bin"
```

### 3. Build the Zome
```powershell
cd packages\backend
.\build.ps1
```

Or from repo root:
```powershell
npm run backend:build
```

### 4. Test Compilation
```powershell
npm run backend:check
```

## What Was Implemented

✅ **Complete Holochain zome** with:
- User creation and management
- RUT verification support
- Location tracking
- Entry types and link types defined
- All HDK functions properly exported

✅ **Build system**:
- PowerShell build script
- Bash build script  
- Makefile for Linux/WSL
- npm scripts for easy access

✅ **Documentation**:
- README with full instructions
- Function documentation
- Troubleshooting guide

## Next: Running Holochain

1. Install WSL2 + Ubuntu (if not already)
2. Install Nix in Ubuntu
3. Use `nix develop` from repo root to get `hc` and `holochain`
4. Build WASM first: `npm run backend:build`
5. Run sandbox: `npm run backend:hc:run`

See `README.md` for detailed instructions.

