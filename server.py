import argparse
import json
import re
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen


def load_config(path):
    try:
        config = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ValueError(f"Could not read {path}: {error}") from error

    if not isinstance(config, dict) or set(config) != {"URL", "PATH", "COLUMNS", "TEST"}:
        raise ValueError("config.json must contain exactly URL, PATH, COLUMNS, and TEST.")

    url = config["URL"]
    if not isinstance(url, str) or url != url.strip():
        raise ValueError("URL must be a full http(s) origin without a trailing path.")
    try:
        origin = urlsplit(url)
        port = origin.port
    except ValueError as error:
        raise ValueError(f"Invalid URL: {error}") from error
    if (
        origin.scheme not in ("http", "https")
        or not origin.hostname
        or origin.username is not None
        or origin.password is not None
        or origin.path not in ("", "/")
        or origin.query
        or origin.fragment
        or any(char.isspace() for char in url)
        or port == 0
    ):
        raise ValueError("URL must be a full http(s) origin without credentials, path, query, or fragment.")

    file_path = config["PATH"]
    if (
        not isinstance(file_path, str)
        or not file_path
        or file_path != file_path.strip()
        or file_path.startswith("/")
        or any(char in file_path for char in "\\?#")
        or any(part in ("", ".", "..") for part in file_path.split("/"))
    ):
        raise ValueError("PATH must be a relative file path without query, fragment, or traversal.")

    columns = config["COLUMNS"]
    if type(columns) is not int or not 1 <= columns <= 9007199254740991:
        raise ValueError("COLUMNS must be a positive JavaScript-safe integer.")
    if type(config["TEST"]) is not bool:
        raise ValueError("TEST must be true or false.")
    return config


def make_handler(config, definitions, html):
    origin = config["URL"].rstrip("/")

    class Handler(BaseHTTPRequestHandler):
        def send_data(self, status, content, content_type="text/plain; charset=utf-8"):
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(content)

        def do_GET(self):
            if self.path in ("/", "/index.html"):
                self.send_data(200, html, "text/html; charset=utf-8")
            elif self.path == "/api/settings":
                settings = {"columns": config["COLUMNS"], "test": config["TEST"]}
                self.send_data(200, json.dumps(settings).encode("utf-8"), "application/json; charset=utf-8")
            elif self.path == "/api/definitions" and definitions is not None:
                self.send_data(200, definitions)
            else:
                self.send_data(404, b"Not found.")

        def do_POST(self):
            prefix = "/api/webhook/"
            encoded = self.path[len(prefix):] if self.path.startswith(prefix) else ""
            if not encoded or "/" in encoded or re.search(r"%(?![0-9a-fA-F]{2})", encoded):
                self.send_data(404, b"Not found.")
                return
            try:
                command = unquote(encoded, encoding="utf-8", errors="strict")
            except UnicodeError:
                self.send_data(400, b"Invalid webhook command.")
                return
            if not command or self.headers.get("Content-Length", "0") != "0":
                self.send_data(400, b"Webhook requests must have no body.")
                return
            if config["TEST"]:
                self.send_data(403, b"Webhooks are disabled in test mode.")
                return
            url = f"{origin}/api/webhook/{quote(command, safe='')}"
            try:
                with urlopen(Request(url, data=b"", method="POST"), timeout=10) as response:
                    self.send_data(response.status, b"")
            except HTTPError as error:
                self.send_data(error.code, f"Home Assistant returned HTTP {error.code}.".encode("utf-8"))
            except OSError as error:
                self.log_error("Webhook request failed: %s", error)
                self.send_data(502, b"Could not reach Home Assistant.")

    return Handler


def create_server(config_path, html_path, port=8080):
    config = load_config(config_path)
    try:
        html = html_path.read_bytes()
    except OSError as error:
        raise ValueError(f"Could not read {html_path}; run npm run build first: {error}") from error

    definitions = None
    if not config["TEST"]:
        origin = config["URL"].rstrip("/")
        path = quote(config["PATH"], safe="/")
        try:
            with urlopen(f"{origin}/{path}", timeout=10) as response:
                definitions = response.read()
                definitions.decode("utf-8")
        except (OSError, UnicodeError) as error:
            raise ValueError(f"Could not download definitions from {origin}/{path}: {error}") from error
        if not definitions.strip():
            raise ValueError("The downloaded definitions file is empty.")

    return ThreadingHTTPServer(("127.0.0.1", port), make_handler(config, definitions, html))


def main():
    parser = argparse.ArgumentParser(description="Serve HaButtons with local Home Assistant proxy")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--open", action="store_true", help="open the browser after the server is ready")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    try:
        server = create_server(root / "config.json", root / "dist" / "index.html", args.port)
    except (ValueError, OSError) as error:
        print(f"HaButtons startup failed: {error}", file=sys.stderr)
        return 1
    address = f"http://localhost:{server.server_port}"
    print(f"HaButtons running at {address}", flush=True)
    if args.open:
        threading.Thread(target=webbrowser.open, args=(address,), daemon=True).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
