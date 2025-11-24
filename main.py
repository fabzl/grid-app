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


def find_npm() -> str | None:
    """Locate npm executable across platforms."""
    for exe in ("npm", "npm.cmd", "npm.exe"):
        path = which(exe)
        if path:
            return path
    return None


def find_python_executable() -> str | None:
    """Locate Python interpreter."""
    for exe in ("python", "python3", "py"):
        path = which(exe)
        if path:
            return path
    return None


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


def ensure_node_dependencies(npm: str) -> None:
    """Install Node dependencies if missing."""
    root_node_modules = REPO_ROOT / "node_modules"
    mobile_node_modules = MOBILE_DIR / "node_modules"

    if not root_node_modules.exists():
        print("Installing root workspace dependencies (npm install)...", flush=True)
        try:
            result = subprocess.run(
                [npm, "install"],
                cwd=str(REPO_ROOT),
                text=True,
                timeout=900,
            )
            if result.returncode != 0:
                print("WARNING: npm install failed for workspace. Check logs above.", flush=True)
        except Exception as e:
            print(f"WARNING: Could not install root dependencies automatically: {e}", flush=True)
    else:
        print("Root workspace dependencies detected", flush=True)

    if not mobile_node_modules.exists():
        print("Installing mobile dependencies...", flush=True)
        try:
            result = subprocess.run(
                [npm, "--prefix", str(MOBILE_DIR), "install"],
                cwd=str(REPO_ROOT),
                text=True,
                timeout=900,
            )
            if result.returncode != 0:
                print("WARNING: npm install failed for mobile package. Check logs above.", flush=True)
        except Exception as e:
            print(f"WARNING: Could not install mobile dependencies automatically: {e}", flush=True)
    else:
        print("Mobile dependencies detected", flush=True)


def ensure_eas_cli(npm: str) -> str | None:
    """Install EAS CLI if missing (required for Expo native builds)."""
    for exe in ("eas", "eas.cmd", "eas.exe"):
        path = which(exe)
        if path:
            return path

    print("Installing EAS CLI globally (npm install -g eas-cli)...", flush=True)
    try:
        result = subprocess.run(
            [npm, "install", "-g", "eas-cli"],
            text=True,
            timeout=600,
        )
        if result.returncode == 0:
            for exe in ("eas", "eas.cmd", "eas.exe"):
                path = which(exe)
                if path:
                    print("EAS CLI installed", flush=True)
                    return path
        else:
            print("WARNING: Failed to install EAS CLI automatically. Please install it manually.", flush=True)
    except Exception as e:
        print(f"WARNING: Could not install EAS CLI automatically: {e}", flush=True)
    return None


def ensure_rust_target():
    """Ensure the wasm32-unknown-unknown target is installed for Rust builds."""
    target = "wasm32-unknown-unknown"
    rustup = which("rustup") or which("rustup.exe")
    if not rustup:
        print("WARNING: rustup not found. Skipping target verification (install Rust to build backend WASM).", flush=True)
        return

    try:
        result = subprocess.run(
            [rustup, "target", "list", "--installed"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode != 0 or target not in result.stdout:
            print(f"Adding Rust target {target}...", flush=True)
            add_result = subprocess.run(
                [rustup, "target", "add", target],
                text=True,
                timeout=300,
            )
            if add_result.returncode == 0:
                print(f"Rust target {target} ready", flush=True)
            else:
                print(f"WARNING: Failed to add Rust target {target}. Please run 'rustup target add {target}' manually.", flush=True)
        else:
            print(f"Rust target {target} already installed", flush=True)
    except Exception as e:
        print(f"WARNING: Could not verify Rust target {target}: {e}", flush=True)


def ensure_dependencies() -> dict[str, str | None]:
    """Check and install core dependencies required to run the stack."""
    print("\n" + "=" * 60, flush=True)
    print("Checking project dependencies", flush=True)
    print("=" * 60, flush=True)

    node = which("node") or which("node.exe")
    if node:
        print(f"Node.js detected at {node}", flush=True)
    else:
        print("ERROR: Node.js not found. Install it from https://nodejs.org/ to continue.", flush=True)
        raise RuntimeError("Node.js is required but not installed.")

    npm = find_npm()
    if not npm:
        print("ERROR: npm not found on PATH. Ensure Node.js is installed correctly.", flush=True)
        raise RuntimeError("npm is required but not found.")
    print(f"npm detected at {npm}", flush=True)

    ensure_node_dependencies(npm)

    python = find_python_executable()
    if python:
        print(f"Python detected at {python}", flush=True)
    else:
        print("ERROR: Python not found. Install Python 3.10+ to serve the landing page.", flush=True)
        raise RuntimeError("Python is required but not installed.")

    cargo = find_cargo()
    if cargo:
        print(f"Cargo detected at {cargo}", flush=True)
        ensure_rust_target()
    else:
        print("WARNING: Cargo (Rust) not found. Backend build will be skipped. Run npm run backend:install-rust to install.", flush=True)

    eas_cli = ensure_eas_cli(npm)
    if eas_cli:
        print(f"EAS CLI ready at {eas_cli}", flush=True)
    else:
        print("WARNING: EAS CLI unavailable. Expo native builds may be skipped.", flush=True)

    return {"npm": npm, "python": python, "cargo": cargo, "eas": eas_cli}


def build_backend(npm_path: str | None = None):
    """Build the Holochain backend WASM file"""
    print("Building backend...", flush=True)
    npm = npm_path or find_npm()
    if not npm:
        print("WARNING: npm not found, skipping backend build", flush=True)
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
            print("Backend built successfully!", flush=True)
            return True
        else:
            print("WARNING: Backend build failed:", flush=True)
            if result.stderr:
                print(result.stderr, flush=True)
            return False
    except subprocess.TimeoutExpired:
        print("WARNING: Backend build timed out", flush=True)
        return False
    except Exception as e:
        print(f"WARNING: Backend build error: {e}", flush=True)
        return False


def start_mobile(new_windows: bool = False, npm_path: str | None = None):
    """Start the Expo mobile web server"""
    npm = npm_path or find_npm()
    if not npm:
        raise RuntimeError("npm not found. Install Node.js to run the mobile app.")

    # Use npx expo directly to ensure it works correctly
    cmd = [
        npm,
        "run",
        "web",
    ]
    creationflags = 0
    if os.name == "nt" and new_windows:
        creationflags = subprocess.CREATE_NEW_CONSOLE  # type: ignore[attr-defined]
    else:
        creationflags = 0  # Show output in current console

    # Set CI=1 for non-interactive mode (replaces --non-interactive flag)
    env = os.environ.copy()
    env["CI"] = "1"
    # Ensure Expo uses the web port we expect
    env["EXPO_WEB_PORT"] = "19006"

    return subprocess.Popen(
        cmd,
        cwd=str(MOBILE_DIR),
        env=env,
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


def start_landing(new_windows: bool = False, python_path: str | None = None):
    """Start the landing page server"""
    python = python_path or find_python_executable()
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


def run_mobile_builds(npm: str, eas_available: bool):
    """Compile Expo outputs for web, Android, and iOS workflows."""
    print("\n" + "=" * 60, flush=True)
    print("Preparing Expo builds", flush=True)
    print("=" * 60, flush=True)

    def run_script(script: list[str], description: str, allow_failure: bool = False):
        print(f"Running: {description}", flush=True)
        try:
            result = subprocess.run(
                script,
                cwd=str(REPO_ROOT),
                text=True,
            )
            if result.returncode == 0:
                print(f"Completed: {description}", flush=True)
                return True
            print(f"WARNING: {description} failed with exit code {result.returncode}", flush=True)
            return False
        except Exception as exc:
            print(f"WARNING: {description} error: {exc}", flush=True)
            if allow_failure:
                return False
            raise

    run_script([npm, "run", "mobile:build:web"], "Exporting Expo web build")

    if eas_available:
        run_script(
            [npm, "run", "mobile:build:android", "--", "--non-interactive"],
            "Triggering Expo Android build (EAS)",
            allow_failure=True,
        )

        ios_description = "Triggering Expo iOS build (EAS)"
        if sys.platform != "darwin":
            print(f"WARNING: {ios_description} skipped on non-macOS platform.", flush=True)
        else:
            run_script(
                [npm, "run", "mobile:build:ios", "--", "--non-interactive"],
                ios_description,
                allow_failure=True,
            )
    else:
        print("WARNING: Skipping native builds because EAS CLI is unavailable.", flush=True)


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
            print(f"Browser opened: {url}", flush=True)
            return True
        except Exception as e:
            if i < max_retries - 1:
                print(f"Waiting for server... ({i+1}/{max_retries})", flush=True)
            else:
                print(f"WARNING: Could not open browser: {e}", flush=True)
    return False


def print_status(services: dict):
    """Print status of all services"""
    print("\n" + "="*60, flush=True)
    print("Services Status:", flush=True)
    print("="*60, flush=True)
    for name, proc in services.items():
        if proc:
            if proc.poll() is None:
                print(f"{name}: Running (PID: {proc.pid})", flush=True)
            else:
                exit_code = proc.poll()
                status = "Exited successfully" if exit_code == 0 else f"Exited with code {exit_code}"
                print(f"{name}: {status}", flush=True)
        else:
            print(f"{name}: Not started", flush=True)
    print("="*60 + "\n", flush=True)


def main():
    new_windows = "--new-windows" in sys.argv
    skip_build = "--skip-build" in sys.argv
    skip_mobile_builds = "--skip-mobile-builds" in sys.argv
    skip_dependency_check = "--skip-checks" in sys.argv
    
    print("\n" + "="*60, flush=True)
    print("Launching Grip Services", flush=True)
    print("="*60 + "\n", flush=True)

    env_info = {"npm": None, "python": None, "cargo": None, "eas": None}
    if skip_dependency_check:
        print("Skipping dependency checks (--skip-checks flag)\n", flush=True)
        env_info["npm"] = find_npm()
        env_info["python"] = find_python_executable()
    else:
        try:
            env_info = ensure_dependencies()
        except Exception as dep_error:
            print(f"ERROR: Dependency check failed: {dep_error}", flush=True)
            return
    
    # Build backend first if not skipped
    if not skip_build:
        build_backend(npm_path=env_info.get("npm"))
        print()
    else:
        print("Skipping backend build (--skip-build flag)\n", flush=True)

    if not skip_mobile_builds and env_info.get("npm"):
        run_mobile_builds(env_info["npm"], eas_available=bool(env_info.get("eas")))
    elif skip_mobile_builds:
        print("Skipping Expo build steps (--skip-mobile-builds flag)\n", flush=True)

    # Start mobile server
    print("Starting mobile web server...", flush=True)
    mobile = None
    try:
        mobile = start_mobile(new_windows=new_windows, npm_path=env_info.get("npm"))
        print("Mobile server process started", flush=True)
        print("   Expo is starting... This may take 30-60 seconds on first run.", flush=True)
        
        # Wait for server to be ready - Expo web typically uses port 19006
        print("Waiting for Expo web server to be ready on port 19006...", flush=True)
        web_ready = False
        # Try multiple ports in case Expo chooses a different one
        for port in [19006, 19000, 19001, 19002]:
            if wait_for_server(port, timeout=15, name=f"Mobile (port {port})"):
                print(f"✅ Mobile web server is ready on port {port}!", flush=True)
                print(f"   Access the app at: http://localhost:{port}", flush=True)
                web_ready = True
                break
        
        if not web_ready:
            print("WARNING: Mobile web server may not be ready yet.", flush=True)
            print("   Expo is still starting in the background...", flush=True)
            print("   The server will be available at http://localhost:19006 once ready.", flush=True)
            print("   Check the console output above for the actual port.", flush=True)
    except Exception as e:
        print(f"ERROR: Mobile server failed to start: {e}", flush=True)
        print(f"   Error details: {type(e).__name__}: {str(e)}", flush=True)
        print("   You can try starting manually: cd packages/mobile && npm run web", flush=True)
        mobile = None

    # Start landing page
    landing = None
    landing_port = 8080
    print("\nStarting landing page server...", flush=True)
    try:
        landing = start_landing(new_windows=new_windows, python_path=env_info.get("python"))
        print(f"Landing page process started (PID: {landing.pid})", flush=True)
        
        # Try to read actual port from file (in case it used an alternative port)
        port_file = LANDING_DIR / ".landing_port"
        for _ in range(10):  # Wait up to 2 seconds for port file
            if port_file.exists():
                try:
                    landing_port = int(port_file.read_text().strip())
                    break
                except Exception:
                    pass
            time.sleep(0.2)
        
        # Wait for landing page server
        print(f"Waiting for landing page server to be ready on port {landing_port}...", flush=True)
        if wait_for_server(landing_port, timeout=15, name="Landing"):
            print(f"Landing page server is ready on port {landing_port}!", flush=True)
        else:
            # Try ports 8080-8090 in case server chose a different port
            found_port = None
            for p in range(8080, 8090):
                if wait_for_server(p, timeout=1, name="Landing"):
                    found_port = p
                    landing_port = p
                    break
            if found_port:
                print(f"Landing page server found on port {found_port}!", flush=True)
            else:
                print("WARNING: Landing page server may not be ready yet, but continuing...", flush=True)
                print("   Try accessing http://localhost:8080 (or check console output for actual port)", flush=True)
    except Exception as e:
        print(f"WARNING: Landing page failed to start: {e}", flush=True)
        print(f"   Error details: {type(e).__name__}: {str(e)}", flush=True)
        print("   (This is optional - mobile app can run without it)", flush=True)
        landing = None

    # Start backend demo
    backend = None
    print("\nStarting backend demo...", flush=True)
    try:
        backend = start_backend_demo(new_windows=new_windows)
        print("Backend demo process started", flush=True)
    except Exception as e:
        print(f"WARNING: Backend demo failed to start: {e}", flush=True)
        print("   (This is optional - mobile app can run without it)", flush=True)

    # Give servers a moment to fully start, then open browsers
    print("\nWaiting for servers to be fully ready...", flush=True)
    time.sleep(5)  # Give more time for Expo to start
    
    if landing:
        print(f"\n🌐 Opening landing page in browser...", flush=True)
        try:
            landing_url = f"http://localhost:{landing_port}"
            open_browser_with_retry(landing_url, max_retries=5, delay=2)
        except Exception as e:
            print(f"WARNING: Could not open landing page browser: {e}", flush=True)
            print(f"   You can manually open: http://localhost:{landing_port}", flush=True)
    
    if mobile:
        print("\n📱 Opening mobile web app in browser...", flush=True)
        # Wait a bit more for Expo web to be ready
        print("   Waiting for Expo web server to be ready...", flush=True)
        mobile_port = 19006
        for port in [19006, 19000, 19001, 19002]:
            if wait_for_server(port, timeout=5, name=f"Mobile web (port {port})"):
                mobile_port = port
                break
        
        try:
            expo_url = f"http://localhost:{mobile_port}"
            print(f"   Opening {expo_url}...", flush=True)
            open_browser_with_retry(expo_url, max_retries=5, delay=3)
        except Exception as e:
            print(f"WARNING: Could not open mobile app browser: {e}", flush=True)
            print(f"   The server is starting in the background.", flush=True)
            print(f"   Once ready, manually open: http://localhost:{mobile_port}", flush=True)
            print(f"   (Check console output above for the actual port if different)", flush=True)

    # Print initial status
    print_status({"Landing": landing, "Mobile": mobile, "Backend": backend})

    print("\n" + "="*60, flush=True)
    print("✅ Todos los servidores están iniciando", flush=True)
    print("="*60, flush=True)
    print("\n📍 URLs disponibles:", flush=True)
    if landing:
        print(f"   🌐 Landing page: http://localhost:{landing_port}", flush=True)
    if mobile:
        print(f"   📱 App web (Expo): http://localhost:19006", flush=True)
        print("      (El servidor puede tardar 30-60 segundos en estar listo)", flush=True)
    print("\n💡 Tips:", flush=True)
    print("   - Presiona Ctrl+C para detener todos los servicios", flush=True)
    print("   - Si la app no carga, revisa la consola del navegador (F12)", flush=True)
    print("   - El servidor web de Expo puede tardar un momento en iniciar", flush=True)
    print("   - Usa --new-windows para ver la salida en ventanas separadas", flush=True)
    print("", flush=True)

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
                    print(f"\nWARNING: [Mobile] Process exited with code {mobile_exit_code}", flush=True)
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
                    print(f"\n[Landing] Process exited with code {landing_exit_code}", flush=True)
            else:
                landing_exit_code = 999  # Failed to start
            
            # Check backend process
            if backend:
                if backend.poll() is None:
                    backend_exit_code = None  # Still running
                elif backend_exit_code is None:
                    backend_exit_code = backend.poll()
                    print(f"\n[Backend] Process exited with code {backend_exit_code}", flush=True)
            
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
                print("All services stopped. Exiting...", flush=True)
                print("="*60 + "\n", flush=True)
                break
                
            time.sleep(2)  # Check every 2 seconds
            
    except KeyboardInterrupt:
        print("\n\nStopping services...", flush=True)
    finally:
        print("\nCleaning up processes...", flush=True)
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
        print("All services stopped.\n", flush=True)


if __name__ == "__main__":
    main()
