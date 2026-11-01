#!/usr/bin/env python3
"""
Automation/02_Local_Preview.py
==============================
Serve a local preview of the Apps Script Home template in your browser.
Includes automatic port fallback and address reuse to prevent "Address already in use" errors.

Usage:
    /opt/homebrew/bin/python3.14 Automation/02_Local_Preview.py
"""

import sys
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
INCLUDES = {
    "css": ROOT / "css.html",
    "PageModules": ROOT / "PageModules.html",
    "supabase": ROOT / "supabase.html",
    "attendance": ROOT / "attendance.html",
    "javascript": ROOT / "javascript.html",
}
INCLUDE_PATTERN = re.compile(r"<\?!=\s*include\('([^']+)'\)\s*;\s*\?>")


def render_home() -> bytes:
    page = (ROOT / "Routes" / "Home" / "page.html").read_text(encoding="utf-8")

    def replace_include(match: re.Match[str]) -> str:
        name = match.group(1)
        include_path = INCLUDES.get(name)
        if include_path is None:
            raise ValueError(f"Unsupported Apps Script include: {name}")
        return include_path.read_text(encoding="utf-8")

    rendered = INCLUDE_PATTERN.sub(replace_include, page)
    if "<?" in rendered:
        raise ValueError("The Home template contains Apps Script template code not handled by this preview.")
    return rendered.encode("utf-8")


class PreviewHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path not in ("/", "/index.html"):
            self.send_error(404)
            return
        try:
            content = render_home()
        except (OSError, ValueError) as error:
            self.send_error(500, str(error))
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format: str, *args: object) -> None:
        print("%s - %s" % (self.address_string(), format % args))


def start_server_with_fallback(start_port: int = 8765, max_attempts: int = 10) -> None:
    """Starts the server, automatically finding an open port if the default is busy."""
    ThreadingHTTPServer.allow_reuse_address = True

    server = None
    active_port = start_port

    for port in range(start_port, start_port + max_attempts):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), PreviewHandler)
            active_port = port
            break
        except OSError as e:
            if e.errno == 48:  # Address already in use
                continue
            raise

    if server is None:
        print(f"❌ Error: Could not find an available port between {start_port} and {start_port + max_attempts - 1}.")
        sys.exit(1)

    print("=" * 60)
    print("🌐 DIVINE CLASSES — LOCAL OFFLINE PREVIEW SERVER")
    print("=" * 60)
    print(f"👉 Local preview ready at: http://127.0.0.1:{active_port}")
    print("👉 Open the URL above in your web browser (Chrome / Safari)")
    print("ℹ️  Press Ctrl+C to stop the preview server.")
    print("=" * 60)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Stopping preview server.")
    finally:
        server.server_close()


def main() -> None:
    start_server_with_fallback(8765)


if __name__ == "__main__":
    main()
