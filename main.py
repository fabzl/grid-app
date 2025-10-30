import os
import sys
import time
import shutil
import webbrowser
import subprocess
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent
MOBILE_DIR = REPO_ROOT / "packages" / "mobile"
BACKEND_DIR = REPO_ROOT / "packages" / "backend"


def which(exe: str) -> str | None:
    path = shutil.which(exe)
    return path


def find_cargo() -> str | None:
    # Prefer PATH
    cargo = which("cargo")
    if cargo:
        return cargo
    # Common Windows user install location
    home = os.environ.get("USERPROFILE") or str(Path.home())
    candidate = Path(home) / ".cargo" / "bin" / "cargo.exe"
    if candidate.exists():
        return str(candidate)
    return None


def start_mobile(new_windows: bool = False):
    npm = which("npm") or which("npm.cmd") or which("npm.exe")
    if not npm:
        raise RuntimeError("npm not found. Install Node.js to run the mobile app.")

    cmd = [npm, "run", "web", "--", "--no-open"]
    creationflags = 0
    if os.name == "nt" and new_windows:
        creationflags = subprocess.CREATE_NEW_CONSOLE  # type: ignore[attr-defined]

    return subprocess.Popen(
        cmd,
        cwd=str(MOBILE_DIR),
        creationflags=creationflags,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def start_backend_demo(new_windows: bool = False):
    cargo = find_cargo()
    if not cargo:
        raise RuntimeError("cargo not found. Ensure Rust is installed and Cargo is on PATH.")

    cmd = [cargo, "run", "--manifest-path", str(BACKEND_DIR / "Cargo.toml"), "--bin", "demo"]
    creationflags = 0
    if os.name == "nt" and new_windows:
        creationflags = subprocess.CREATE_NEW_CONSOLE  # type: ignore[attr-defined]

    return subprocess.Popen(
        cmd,
        cwd=str(BACKEND_DIR),
        creationflags=creationflags,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def tail_prefix(proc: subprocess.Popen, name: str):
    assert proc.stdout is not None
    for line in proc.stdout:
        print(f"[{name}] {line.rstrip()}")


def main():
    new_windows = "--new-windows" in sys.argv
    print("Launching Grip services...", flush=True)

    # Start mobile first
    mobile = start_mobile(new_windows=new_windows)
    print("Mobile dev server starting (packages/mobile)...", flush=True)

    # Give Expo a moment, then open browser
    time.sleep(3)
    try:
        webbrowser.open("http://localhost:19006")
    except Exception:
        pass

    # Start backend demo
    backend = None
    try:
        backend = start_backend_demo(new_windows=new_windows)
        print("Backend demo running (Rust) ...", flush=True)
    except Exception as e:
        print(f"Warning: backend demo failed to start: {e}")

    print("Press Ctrl+C to stop.")

    try:
        # Stream logs minimally
        while True:
            alive = False
            if mobile.poll() is None:
                alive = True
            if backend is not None and backend.poll() is None:
                alive = True
            if not alive:
                break
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        for proc in (backend, mobile):
            if proc and proc.poll() is None:
                try:
                    proc.terminate()
                except Exception:
                    pass


if __name__ == "__main__":
    main()


