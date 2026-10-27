import json
import tempfile
import threading
import unittest
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from server import create_server, load_config


@contextmanager
def running(server):
    thread = threading.Thread(target=server.serve_forever)
    thread.start()
    try:
        yield server
    finally:
        server.shutdown()
        thread.join()
        server.server_close()


class Upstream(BaseHTTPRequestHandler):
    requests = []
    definitions_status = 200
    webhook_status = 200

    def do_GET(self):
        self.requests.append(("GET", self.path))
        self.send_response(self.definitions_status)
        self.end_headers()
        self.wfile.write(b"Lights on|lit bulb|#F6C453|lights_on\n")

    def do_POST(self):
        self.requests.append(("POST", self.path))
        self.send_response(self.webhook_status)
        self.end_headers()

    def log_message(self, *_args):
        pass


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.config_path = self.root / "config.json"
        self.html_path = self.root / "index.html"
        self.html_path.write_bytes(b"<h1>HaButtons</h1>")
        self.upstream = ThreadingHTTPServer(("127.0.0.1", 0), Upstream)
        self.upstream_thread = threading.Thread(target=self.upstream.serve_forever)
        self.upstream_thread.start()
        self.addCleanup(self.close_upstream)
        Upstream.requests = []
        Upstream.definitions_status = 200
        Upstream.webhook_status = 200
        self.config = {
            "URL": f"http://127.0.0.1:{self.upstream.server_port}",
            "PATH": "local/ButtonsFile.txt",
            "COLUMNS": 3,
            "TEST": False,
        }
        self.write_config()

    def close_upstream(self):
        self.upstream.shutdown()
        self.upstream_thread.join()
        self.upstream.server_close()

    def write_config(self):
        self.config_path.write_text(json.dumps(self.config), encoding="utf-8")

    def request(self, server, path, method="GET"):
        url = f"http://127.0.0.1:{server.server_port}{path}"
        return urlopen(Request(url, data=b"" if method == "POST" else None, method=method))

    def test_local_routes_and_webhook(self):
        with running(create_server(self.config_path, self.html_path, 0)) as server:
            with self.request(server, "/") as response:
                self.assertEqual(response.read(), b"<h1>HaButtons</h1>")
            with self.request(server, "/api/settings") as response:
                self.assertEqual(json.load(response), {"columns": 3, "test": False})
                self.assertEqual(response.headers["Cache-Control"], "no-store")
            with self.request(server, "/api/definitions") as response:
                self.assertIn(b"Lights on|", response.read())
            with self.request(server, "/api/webhook/hello%20world", "POST") as response:
                self.assertEqual(response.status, 200)
            with self.assertRaises(HTTPError) as error:
                self.request(server, "/config.json")
            self.assertEqual(error.exception.code, 404)
        self.assertEqual(Upstream.requests, [
            ("GET", "/local/ButtonsFile.txt"),
            ("POST", "/api/webhook/hello%20world"),
        ])

    def test_upstream_errors_are_reported(self):
        Upstream.webhook_status = 404
        with running(create_server(self.config_path, self.html_path, 0)) as server:
            with self.assertRaises(HTTPError) as error:
                self.request(server, "/api/webhook/missing", "POST")
            self.assertEqual(error.exception.code, 404)
        Upstream.definitions_status = 404
        with self.assertRaisesRegex(ValueError, "Could not download definitions"):
            create_server(self.config_path, self.html_path, 0)

    def test_test_mode_never_contacts_home_assistant(self):
        self.config["TEST"] = True
        self.write_config()
        with running(create_server(self.config_path, self.html_path, 0)) as server:
            with self.request(server, "/api/settings") as response:
                self.assertEqual(json.load(response), {"columns": 3, "test": True})
            with self.assertRaises(HTTPError) as error:
                self.request(server, "/api/webhook/lights_on", "POST")
            self.assertEqual(error.exception.code, 403)
        self.assertEqual(Upstream.requests, [])

    def test_configuration_rejects_invalid_values(self):
        cases = [
            ("URL", "192.168.0.1:8123"),
            ("URL", "http://localhost:8123/other"),
            ("URL", "http://user:pass@localhost:8123"),
            ("PATH", "../secret"),
            ("PATH", "/local/file.txt"),
            ("COLUMNS", 0),
            ("COLUMNS", True),
            ("COLUMNS", 9007199254740992),
            ("TEST", "false"),
        ]
        for key, value in cases:
            with self.subTest(key=key, value=value):
                self.config[key] = value
                self.write_config()
                with self.assertRaises(ValueError):
                    load_config(self.config_path)
                self.config[key] = {
                    "URL": f"http://127.0.0.1:{self.upstream.server_port}",
                    "PATH": "local/ButtonsFile.txt",
                    "COLUMNS": 3,
                    "TEST": False,
                }[key]


if __name__ == "__main__":
    unittest.main()
