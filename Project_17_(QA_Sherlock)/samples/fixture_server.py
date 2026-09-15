"""Local-only fake checkout for verifying generated tests, never production."""
import argparse
import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from uuid import uuid4

promotions = {}
buggy = False


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            data = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
            if self.path == '/test-support/promotions':
                code = str(uuid4()); promotions[code] = data['expiresAt']
                return self.reply(201, {'code': code})
            if self.path == '/checkout/quote':
                if data['code'] not in promotions:
                    return self.reply(404, {'error': 'UNKNOWN_CODE'})
                now = datetime.fromisoformat(data['now'].replace('Z', '+00:00'))
                expiry = datetime.fromisoformat(promotions[data['code']].replace('Z', '+00:00'))
                expired = now >= expiry if buggy else now > expiry
                return self.reply(422, {'error': 'PROMO_EXPIRED'}) if expired else self.reply(200, {'total': round(data['subtotal'] * .8)})
            self.reply(404, {'error': 'NOT_FOUND'})
        except (ValueError, KeyError, TypeError):
            self.reply(400, {'error':'INVALID_REQUEST'})

    def reply(self, status, body):
        payload = json.dumps(body).encode()
        self.send_response(status); self.send_header('Content-Type', 'application/json')
        self.end_headers(); self.wfile.write(payload)


if __name__ == '__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--buggy',action='store_true')
    buggy=parser.parse_args().buggy
    HTTPServer(('127.0.0.1',8765),Handler).serve_forever()
