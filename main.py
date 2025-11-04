import os
import sys
import time
import shutil
import webbrowser
import subprocess
import threading
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent
MOBILE_DIR = REPO_ROOT / "packages" / "mobile"
BACKEND_DIR = REPO_ROOT / "packages" / "backend"
LANDING_DIR = REPO_ROOT / "packages" / "landing"


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


def build_backend():
    """Build the Holochain backend WASM file"""
    print("🔨 Building backend...", flush=True)
    npm = which("npm") or which("npm.cmd") or which("npm.exe")
    if not npm:
        print("⚠️  npm not found, skipping backend build", flush=True)
        return False
    
    try:
        result = subprocess.run(
            [npm, "run", "backend:build"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        if result.returncode == 0:
            print("✅ Backend built successfully!", flush=True)
            return True
        else:
            print(f"⚠️  Backend build failed:", flush=True)
            if result.stderr:
                print(result.stderr, flush=True)
            return False
    except subprocess.TimeoutExpired:
        print("⚠️  Backend build timed out", flush=True)
        return False
    except Exception as e:
        print(f"⚠️  Backend build error: {e}", flush=True)
        return False


def start_mobile(new_windows: bool = False):
    """Start the Expo mobile web server"""
    npm = which("npm") or which("npm.cmd") or which("npm.exe")
    if not npm:
        raise RuntimeError("npm not found. Install Node.js to run the mobile app.")

    cmd = [npm, "run", "web"]
    creationflags = 0
    if os.name == "nt" and new_windows:
        creationflags = subprocess.CREATE_NEW_CONSOLE  # type: ignore[attr-defined]
    else:
        creationflags = 0  # Show output in current console

    return subprocess.Popen(
        cmd,
        cwd=str(MOBILE_DIR),
        creationflags=creationflags,
        stdout=None,  # Show output directly
        stderr=subprocess.STDOUT,  # Redirect stderr to stdout
        text=True,
    )


def start_backend_demo(new_windows: bool = False):
    """Start the Rust backend demo"""
    cargo = find_cargo()
    if not cargo:
        raise RuntimeError("cargo not found. Ensure Rust is installed and Cargo is on PATH.")

    cmd = [cargo, "run", "--manifest-path", str(BACKEND_DIR / "Cargo.toml"), "--bin", "demo"]
    creationflags = 0
    if os.name == "nt" and new_windows:
        creationflags = subprocess.CREATE_NEW_CONSOLE  # type: ignore[attr-defined]
    else:
        creationflags = 0  # Show output in current console

    return subprocess.Popen(
        cmd,
        cwd=str(BACKEND_DIR),
        creationflags=creationflags,
        stdout=None,  # Show output directly
        stderr=subprocess.STDOUT,  # Redirect stderr to stdout
        text=True,
    )


def start_landing(new_windows: bool = False):
    """Start the landing page server"""
    python = which("python") or which("python3") or which("py")
    if not python:
        raise RuntimeError("Python not found. Install Python to run the landing page.")
    
    server_script = LANDING_DIR / "server.py"
    if not server_script.exists():
        raise RuntimeError(f"Landing page server not found at {server_script}")
    
    cmd = [python, str(server_script)]
    creationflags = 0
    if os.name == "nt" and new_windows:
        creationflags = subprocess.CREATE_NEW_CONSOLE  # type: ignore[attr-defined]
    else:
        # On Windows, don't hide output in current console
        creationflags = 0  # Show output in current console

    return subprocess.Popen(
        cmd,
        cwd=str(LANDING_DIR),
        creationflags=creationflags,
        stdout=None,  # Show output directly so we can see server messages
        stderr=subprocess.STDOUT,  # Redirect stderr to stdout
        text=True,
    )


def wait_for_server(port: int, timeout: int = 60, name: str = "server"):
    """Wait for a server to be ready on a specific port"""
    import socket
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            if result == 0:
                return True
        except Exception:
            pass
        time.sleep(1)
    return False


def open_browser_with_retry(url: str, max_retries: int = 5, delay: int = 2):
    """Try to open browser with retries"""
    for i in range(max_retries):
        try:
            time.sleep(delay)
            webbrowser.open(url)
            print(f"🌐 Browser opened: {url}", flush=True)
            return True
        except Exception as e:
            if i < max_retries - 1:
                print(f"⏳ Waiting for server... ({i+1}/{max_retries})", flush=True)
            else:
                print(f"⚠️  Could not open browser: {e}", flush=True)
    return False


def print_status(services: dict):
    """Print status of all services"""
    print("\n" + "="*60, flush=True)
    print("📊 Services Status:", flush=True)
    print("="*60, flush=True)
    for name, proc in services.items():
        if proc:
            if proc.poll() is None:
                print(f"✅ {name}: Running (PID: {proc.pid})", flush=True)
            else:
                exit_code = proc.poll()
                status = "✅ Exited successfully" if exit_code == 0 else f"❌ Exited with code {exit_code}"
                print(f"{status} {name}: {status}", flush=True)
        else:
            print(f"⚠️  {name}: Not started", flush=True)
    print("="*60 + "\n", flush=True)


def main():
    new_windows = "--new-windows" in sys.argv
    skip_build = "--skip-build" in sys.argv
    
    print("\n" + "="*60, flush=True)
    print("🚀 Launching Grip Services", flush=True)
    print("="*60 + "\n", flush=True)
    
    # Build backend first if not skipped
    if not skip_build:
        build_backend()
        print()
    else:
        print("⏭️  Skipping backend build (--skip-build flag)\n", flush=True)

    # Start mobile server
    print("📱 Starting mobile dev server...", flush=True)
    mobile = None
    try:
        mobile = start_mobile(new_windows=new_windows)
        print("✅ Mobile server process started", flush=True)
        
        # Wait for server to be ready
        print("⏳ Waiting for Expo server to be ready...", flush=True)
        if wait_for_server(19006, timeout=60, name="Mobile"):
            print("✅ Mobile server is ready!", flush=True)
        else:
            print("⚠️  Mobile server may not be ready yet, but continuing...", flush=True)
    except Exception as e:
        print(f"❌ Error starting mobile server: {e}", flush=True)
        mobile = None

    # Start landing page
    landing = None
    print("\n🌐 Starting landing page server...", flush=True)
    try:
        landing = start_landing(new_windows=new_windows)
        print(f"✅ Landing page process started (PID: {landing.pid})", flush=True)
        
        # Wait for landing page server
        print("⏳ Waiting for landing page server to be ready on port 8080...", flush=True)
        if wait_for_server(8080, timeout=15, name="Landing"):
            print("✅ Landing page server is ready!", flush=True)
        else:
            print("⚠️  Landing page server may not be ready yet, but continuing...", flush=True)
            print("   Try accessing http://localhost:8080 manually", flush=True)
    except Exception as e:
        print(f"⚠️  Landing page failed to start: {e}", flush=True)
        print(f"   Error details: {type(e).__name__}: {str(e)}", flush=True)
        print("   (This is optional - mobile app can run without it)", flush=True)
        landing = None

    # Start backend demo
    backend = None
    print("\n🦀 Starting backend demo...", flush=True)
    try:
        backend = start_backend_demo(new_windows=new_windows)
        print("✅ Backend demo process started", flush=True)
    except Exception as e:
        print(f"⚠️  Backend demo failed to start: {e}", flush=True)
        print("   (This is optional - mobile app can run without it)", flush=True)

    # Give servers a moment, then open browsers
    time.sleep(3)
    if landing:
        print("\n🌐 Opening landing page in browser...", flush=True)
        try:
            open_browser_with_retry("http://localhost:8080", max_retries=5, delay=2)
        except Exception as e:
            print(f"⚠️  Could not open landing page browser: {e}", flush=True)
            print("   You can manually open: http://localhost:8080", flush=True)
    
    if mobile:
        print("🌐 Opening mobile app in browser...", flush=True)
        try:
            open_browser_with_retry("http://localhost:19006", max_retries=3, delay=2)
        except Exception as e:
            print(f"⚠️  Could not open mobile app browser: {e}", flush=True)
            print("   You can manually open: http://localhost:19006", flush=True)

    # Print initial status
    print_status({"Landing": landing, "Mobile": mobile, "Backend": backend})

    print("💡 Tips:", flush=True)
    print("   - Press Ctrl+C to stop all services", flush=True)
    print("   - Check browser console (F12) if app doesn't load", flush=True)
    print("   - Landing page: http://localhost:8080", flush=True)
    print("   - Mobile app: http://localhost:19006", flush=True)
    print("   - Use --new-windows flag to see output in separate windows\n", flush=True)

    print("Press Ctrl+C to stop.\n", flush=True)

    try:
        # Monitor processes
        mobile_exit_code = None
        landing_exit_code = None
        backend_exit_code = None
        last_status_time = time.time()
        
        while True:
            # Check mobile process
            if mobile:
                if mobile.poll() is None:
                    mobile_exit_code = None  # Still running
                elif mobile_exit_code is None:
                    mobile_exit_code = mobile.poll()
                    print(f"\n⚠️  [Mobile] Process exited with code {mobile_exit_code}", flush=True)
                    if mobile_exit_code != 0:
                        print("[Mobile] Error: Mobile server failed. Check output above for details.", flush=True)
                        print("[Mobile] Try running manually: cd packages\\mobile && npm run web", flush=True)
            else:
                mobile_exit_code = 999  # Failed to start
            
            # Check landing page process
            if landing:
                if landing.poll() is None:
                    landing_exit_code = None  # Still running
                elif landing_exit_code is None:
                    landing_exit_code = landing.poll()
                    print(f"\n🌐 [Landing] Process exited with code {landing_exit_code}", flush=True)
            else:
                landing_exit_code = 999  # Failed to start
            
            # Check backend process
            if backend:
                if backend.poll() is None:
                    backend_exit_code = None  # Still running
                elif backend_exit_code is None:
                    backend_exit_code = backend.poll()
                    print(f"\n📋 [Backend] Process exited with code {backend_exit_code}", flush=True)
            
            # Print status every 30 seconds
            if time.time() - last_status_time > 30:
                print_status({"Landing": landing, "Mobile": mobile, "Backend": backend})
                last_status_time = time.time()
            
            # Keep running if at least one process is alive
            mobile_done = mobile_exit_code is not None if mobile else True
            landing_done = landing_exit_code is not None if landing else True
            backend_done = backend_exit_code is not None if backend else True
            
            if mobile_done and landing_done and backend_done:
                print("\n" + "="*60, flush=True)
                print("🛑 All services stopped. Exiting...", flush=True)
                print("="*60 + "\n", flush=True)
                break
                
            time.sleep(2)  # Check every 2 seconds
            
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping services...", flush=True)
    finally:
        print("\n🧹 Cleaning up processes...", flush=True)
        for name, proc in [("Landing", landing), ("Mobile", mobile), ("Backend", backend)]:
            if proc and proc.poll() is None:
                try:
                    print(f"   Stopping {name}...", flush=True)
                    proc.terminate()
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    try:
                        proc.kill()
                    except Exception:
                        pass
                except Exception:
                    pass
        print("✅ All services stopped.\n", flush=True)


if __name__ == "__main__":
    main()
