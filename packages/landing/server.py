#!/usr/bin/env python3
"""
Simple HTTP server for Grip landing page
"""
import http.server
import socketserver
import os
import sys
from pathlib import Path

PORT = 8080
LANDING_DIR = Path(__file__).resolve().parent
PORT_FILE = LANDING_DIR / ".landing_port"  # File to store the actual port being used

class LandingHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(LANDING_DIR), **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Suppress default logging to reduce noise
        pass

def start_server(port=PORT):
    # Clean up port file on startup
    if PORT_FILE.exists():
        try:
            PORT_FILE.unlink()
        except Exception:
            pass
    
    original_port = port
    # Try to find an available port
    for attempt in range(10):  # Try up to 10 ports
        try:
            with socketserver.TCPServer(("", port), LandingHandler) as httpd:
                # Write port to file so main.py can read it
                try:
                    PORT_FILE.write_text(str(port))
                except Exception:
                    pass  # Non-critical
                
                if port != original_port:
                    print(f"WARNING: Port {original_port} was in use, using port {port} instead", flush=True)
                print(f"Landing page server running at http://localhost:{port}", flush=True)
                print(f"   Serving files from: {LANDING_DIR}", flush=True)
                sys.stdout.flush()
                try:
                    httpd.serve_forever()
                except KeyboardInterrupt:
                    print("\nLanding page server stopped", flush=True)
                finally:
                    # Clean up port file on exit
                    if PORT_FILE.exists():
                        try:
                            PORT_FILE.unlink()
                        except Exception:
                            pass
                return  # Success, exit function
        except OSError as e:
            # Check if it's a port already in use error
            # Windows: WinError 10048, Linux: errno 98
            winerror = getattr(e, 'winerror', None)
            errno = getattr(e, 'errno', None)
            if winerror == 10048 or errno == 98:
                if attempt < 9:  # Don't print error on last attempt
                    print(f"WARNING: Port {port} is already in use. Trying port {port + 1}...", flush=True)
                port += 1
            else:
                print(f"ERROR: Could not start server: {e}", flush=True)
                sys.exit(1)
        except Exception as e:
            print(f"ERROR: Unexpected error: {e}", flush=True)
            sys.exit(1)
    
    # If we get here, all ports failed
    print(f"ERROR: Could not find an available port. Tried ports {original_port} to {port - 1}", flush=True)
    sys.exit(1)

if __name__ == "__main__":
    start_server()
