#!/usr/bin/env python3
"""Tjen den statiske appen under /Trening/, slik GitHub Pages gjør."""
from __future__ import annotations

import argparse
import http.server
import os
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "/Trening"


class TrainHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        parsed = urlparse(path)
        p = unquote(parsed.path)
        if p == PREFIX or p == PREFIX + "/":
            return str(ROOT / "index.html")
        if p.startswith(PREFIX + "/"):
            rel = p[len(PREFIX) + 1 :]
            candidate = (ROOT / rel).resolve()
            if candidate == ROOT or str(candidate).startswith(str(ROOT) + os.sep):
                if candidate.is_dir():
                    return str(candidate / "index.html")
                return str(candidate)
        return str(ROOT / "__missing__")

    def log_message(self, fmt: str, *args) -> None:
        if os.environ.get("SERVE_QUIET"):
            return
        super().log_message(fmt, *args)


def make_server(host: str = "127.0.0.1", port: int = 8765):
    return http.server.ThreadingHTTPServer((host, port), TrainHandler)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--bind", default="127.0.0.1")
    args = ap.parse_args()
    httpd = make_server(args.bind, args.port)
    print(f"Serving {ROOT} at http://{args.bind}:{args.port}{PREFIX}/", flush=True)
    httpd.serve_forever()
