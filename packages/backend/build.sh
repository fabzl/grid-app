#!/bin/bash
set -e
echo "Building Grip Holochain zome..."
cargo build --release --target wasm32-unknown-unknown
echo "WASM built successfully at: target/wasm32-unknown-unknown/release/grip_backend.wasm"

