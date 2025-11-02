# Grip Holochain Backend

Zome implementation for Grip user management and location-based features.

## Features

- **User Management**: Create, read, and update user profiles
- **Verification**: RUT validation and verification status
- **Location**: Store and update user coordinates
- **Queries**: Distance-based user discovery (TODO: link queries)

## Prerequisites

### Windows
1. **Rust** (stable): Install from [rustup.rs](https://rustup.rs/)
2. **WSL2 + Ubuntu**: For Holochain development
3. **Nix**: Install in WSL Ubuntu:
   ```bash
   sh <(curl -L https://nixos.org/nix/install) --no-daemon
   ```
4. **Holochain tools**: Use the flake.nix at repo root:
   ```bash
   cd /mnt/c/Users/usuario/grid-app
   nix develop  # Provides holochain and hc
   ```

## Build

### Windows (PowerShell)
```powershell
cd packages\backend
.\build.ps1
```

### Linux/WSL
```bash
cd packages/backend
make wasm
# or
./build.sh
```

The WASM file will be at: `target/wasm32-unknown-unknown/release/grip_backend.wasm`

## Running

### 1. Build the WASM first
```bash
cd packages/backend
cargo build --release --target wasm32-unknown-unknown
```

### 2. Ensure DNA points to the WASM
Check `happ/dna.yaml` - it should have:
```yaml
zomes:
  - name: grip_zome
    wasm_path: ../target/wasm32-unknown-unknown/release/grip_backend.wasm
```

### 3. Run conductor sandbox (WSL/Ubuntu with nix develop)
```bash
cd packages/backend
hc sandbox generate workdir --run=1 --force --piped -e workdir/conductor.yaml
```

Or use the Makefile:
```bash
make run-sandbox
```

## Zome Functions

- `create_user(name: String) -> ActionHash` - Create a new user
- `get_user(user_hash: ActionHash) -> Option<UserEntry>` - Get user by hash
- `update_user_location(user_hash: ActionHash, lat: f64, lon: f64) -> ActionHash` - Update location
- `verify_user(user_hash: ActionHash, rut: String) -> ActionHash` - Verify user with RUT
- `list_users_nearby(lat: f64, lon: f64) -> Vec<(ActionHash, UserEntry)>` - List nearby users (TODO)
- `hello() -> String` - Test function

## Development

### Test the Rust code (not Holochain runtime)
```bash
cargo test
cargo run --bin demo
```

### Check for compilation errors
```bash
cargo check --target wasm32-unknown-unknown
```

## Troubleshooting

- **"cargo not found"**: Open a new terminal or restart after Rust installation
- **WASM build fails**: Ensure `wasm32-unknown-unknown` target is installed: `rustup target add wasm32-unknown-unknown`
- **hc command not found**: Enter the nix dev shell: `nix develop` from repo root
- **Conductor errors**: Check `workdir/conductor.yaml` and ensure WASM path is correct

## Next Steps

1. Implement link queries for `list_users_nearby`
2. Add validation logic for RUT format
3. Add image/document storage for ID photos
4. Connect mobile app to Holochain via websocket client
