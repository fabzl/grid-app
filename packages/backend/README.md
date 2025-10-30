# Grip Holochain Backend

This folder contains a skeleton to run a Holochain conductor via `hc`.

## Requirements (WSL2 Ubuntu recommended)
- Nix installed
- Holochain dev tools (`holochain`, `hc`) from the provided `flake.nix`

## Quick start (inside WSL Ubuntu)
```
cd /mnt/c/Users/usuario/grid-app
nix develop # enters dev shell with holochain and hc
cd packages/backend
# Build zome wasm (placeholder points to Cargo crate path)
# NOTE: this project currently does not implement a real zome, wasm path is a placeholder.
# You can adjust dna.yaml to point to your compiled wasm.

# Create a sandbox and run conductor
hc sandbox generate workdir --run=1 --force --piped -e workdir/conductor.yaml
```

Files:
- happ/dna.yaml: DNA template (update `wasm_path` after building your zome)
- workdir/conductor.yaml: Conductor config (admin websocket on 4444)

## Next steps
- Implement real zome(s) with Holochain crates and build to wasm
- Update `dna.yaml` with the actual wasm path
- Package and run via `hc`/`holochain`
