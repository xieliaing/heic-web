"""Local static server that sends the cross-origin isolation headers.

Python's http.server does not read Cloudflare's _headers file, so this mirrors
what production will send and lets the multithreaded ffmpeg core be tested
locally.  Usage: python tools/coi-server.py [port]
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
