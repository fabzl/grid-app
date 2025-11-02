.PHONY: build wasm test clean run-sandbox

build:
	cargo build --release

wasm:
	cargo build --release --target wasm32-unknown-unknown
	@echo "WASM built at: target/wasm32-unknown-unknown/release/grip_backend.wasm"

test:
	cargo test

clean:
	cargo clean

run-sandbox: wasm
	hc sandbox generate workdir --run=1 --force --piped -e workdir/conductor.yaml

