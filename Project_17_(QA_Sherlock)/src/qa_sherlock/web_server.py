from __future__ import annotations

import argparse
import base64
import binascii
import json
import mimetypes
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from .core import load_json
from .service import configuration_status, run_upload

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MAX_REQUEST_BYTES = 27 * 1024 * 1024


def _decode_file(value):
    if not isinstance(value, dict) or not isinstance(value.get("name"), str) or not isinstance(value.get("content"), str):
        raise ValueError("Each upload requires a file name and base64 content")
    try:
        content = base64.b64decode(value["content"], validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ValueError(f"{value.get('name', 'Upload')} has invalid content") from exc
    return {"name": value["name"], "content": content}


class AppHandler(BaseHTTPRequestHandler):
    server_version = "QASherlock/0.2"

    def _cors(self):
        origin = os.getenv("QA_SHERLOCK_UI_ORIGIN", "")
        request_origin = self.headers.get("Origin", "")
        if origin and request_origin == origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")

    def _headers(self, status, content_type="application/json; charset=utf-8", length=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store" if self.path.startswith("/api/") else "no-cache")
        self._cors()
        if length is not None:
            self.send_header("Content-Length", str(length))
        self.end_headers()

    def _json(self, status, value):
        data = json.dumps(value).encode("utf-8")
        self._headers(status, length=len(data))
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/status":
            return self._json(200, {"integrations": configuration_status(), "mode": "upload-ready"})
        path = self.path.split("?", 1)[0]
        if path in ("", "/"):
            return self._file(PROJECT_ROOT / "web" / "index.html")
        if path == "/config.js":
            data = b"window.QA_SHERLOCK_API_URL = '';"
            self._headers(200, "application/javascript; charset=utf-8", len(data)); self.wfile.write(data); return
        if path.startswith("/assets/"):
            return self._safe_file(PROJECT_ROOT / "web", path.removeprefix("/"))
        if path.startswith("/demo/"):
            relative = path.removeprefix("/demo/") or "index.html"
            return self._safe_file(PROJECT_ROOT / "demo", relative)
        if path.startswith("/runs/"):
            relative = path.removeprefix("/runs/") or "index.html"
            if relative.endswith("/"):
                relative += "index.html"
            return self._safe_file(PROJECT_ROOT / "runs", relative)
        self._json(404, {"error": "Not found"})

    def _safe_file(self, root, relative):
        root = root.resolve()
        target = (root / relative).resolve()
        if not target.is_relative_to(root) or not target.is_file():
            return self._json(404, {"error": "Not found"})
        self._file(target)

    def _file(self, path):
        try:
            data = path.read_bytes()
        except OSError:
            return self._json(404, {"error": "Not found"})
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        self._headers(200, mime + ("; charset=utf-8" if mime.startswith("text/") or mime in {"application/javascript", "application/json"} else ""), len(data))
        self.wfile.write(data)

    def do_POST(self):
        if self.path != "/api/investigate":
            return self._json(404, {"error": "Not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_REQUEST_BYTES:
                raise ValueError("Upload request is empty or exceeds 27 MB")
            request = json.loads(self.rfile.read(length))
            payload = {
                "failure": _decode_file(request.get("failure")),
                "evidence": [_decode_file(item) for item in request.get("evidence", [])],
                "jira_key": request.get("jira_key", ""),
                "use_pinecone": request.get("use_pinecone", True) is True,
                "run_evaluation": request.get("run_evaluation", True) is True,
            }
            config = load_json(self.server.config_path)
            run_id, report = run_upload(payload, config, self.server.runs_dir)
            self._json(201, {"run_id": run_id, "report_url": f"/runs/{run_id}/", "summary": report["summary"],
                             "confidence": report["confidence"], "evaluation": report["evaluation"]["status"]})
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            self._json(400, {"error": str(exc)})
        except Exception as exc:
            self._json(500, {"error": "Investigation failed", "error_type": type(exc).__name__})

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")


def main():
    try:
        from dotenv import load_dotenv
        load_dotenv(PROJECT_ROOT / ".env")
    except ImportError:
        pass
    parser = argparse.ArgumentParser(description="QA Sherlock real-data upload interface")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--config", default=str(PROJECT_ROOT / "configs" / "default.json"))
    parser.add_argument("--runs", default=str(PROJECT_ROOT / "runs"))
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), AppHandler)
    server.config_path = args.config
    server.runs_dir = args.runs
    print(f"QA Sherlock upload UI: http://{args.host}:{args.port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
