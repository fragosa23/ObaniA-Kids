#!/usr/bin/env python3
import http.server
import urllib.request
import urllib.parse
import os
import json

PORT = 8081
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_MODEL = "black-forest-labs/FLUX.1-schnell"
HF_URL   = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path.startswith('/generate'):
            self._proxy_pollinations()
        else:
            super().do_GET()

    def _proxy_pollinations(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        prompt = params.get('prompt', [''])[0]

        if not prompt:
            self.send_response(400)
            self.end_headers()
            return

        print(f'[HF] A gerar: {prompt[:80]}...')

        payload = json.dumps({"inputs": prompt[:400]}).encode('utf-8')

        try:
            req = urllib.request.Request(
                HF_URL,
                data=payload,
                headers={
                    'Authorization': f'Bearer {HF_TOKEN}',
                    'Content-Type': 'application/json',
                },
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
                print(f'[HF] OK — {len(data)} bytes')
                self.send_response(200)
                self.send_header('Content-Type', 'image/jpeg')
                self.send_header('Content-Length', str(len(data)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)

        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', errors='ignore')
            print(f'[HF] Erro {e.code}: {body[:200]}')
            self.send_response(e.code)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
        except Exception as e:
            print(f'[HF] Erro: {e}')
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def log_message(self, fmt, *args):
        print(fmt % args)

if __name__ == '__main__':
    os.chdir(BASE_DIR)
    print(f'ObaniA Kids a correr em http://localhost:{PORT}')
    with http.server.ThreadingHTTPServer(('', PORT), Handler) as httpd:
        httpd.serve_forever()
