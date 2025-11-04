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
    try:
        with socketserver.TCPServer(("", port), LandingHandler) as httpd:
            print(f"🌐 Landing page server running at http://localhost:{port}", flush=True)
            print(f"   Serving files from: {LANDING_DIR}", flush=True)
            sys.stdout.flush()
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n🛑 Landing page server stopped", flush=True)
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:  # Address already in use (Linux/Windows)
            print(f"⚠️  Port {port} is already in use. Trying alternative port...", flush=True)
            # Try alternative port
            alt_port = port + 1
            try:
                with socketserver.TCPServer(("", alt_port), LandingHandler) as httpd:
                    print(f"🌐 Landing page server running at http://localhost:{alt_port}", flush=True)
                    print(f"   Serving files from: {LANDING_DIR}", flush=True)
                    sys.stdout.flush()
                    httpd.serve_forever()
            except Exception as e2:
                print(f"❌ Could not start server: {e2}", flush=True)
                sys.exit(1)
        else:
            print(f"❌ Could not start server: {e}", flush=True)
            sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    start_server()
