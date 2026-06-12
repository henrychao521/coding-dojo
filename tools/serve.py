#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""程式練功房 coding-dojo 靜態檔案伺服器（本機測試用）。

重點：明確指定 .wasm 的 MIME 為 application/wasm，
否則 Pyodide 的 WebAssembly.instantiateStreaming 會在某些瀏覽器失敗。
零相依，僅用 Python 標準庫；從 repo 根目錄提供檔案（與執行位置無關）。

用法：
  python3 tools/serve.py [port]     # 預設 8733
"""
import http.server
import functools
import socket
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8733


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.wasm': 'application/wasm',
        '.mjs': 'text/javascript',
        '.json': 'application/json',
    }

    # 開發階段關閉快取，避免改了 worker / bundle 卻載到舊版
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return None


if __name__ == '__main__':
    handler = functools.partial(Handler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), handler)
    print('=' * 54)
    print(' 程式練功房 coding-dojo 靜態伺服器已啟動')
    print(f' 本機:      http://localhost:{PORT}')
    ip = lan_ip()
    if ip:
        print(f' 區域網路:  http://{ip}:{PORT}   (iPad 連這個測觸控)')
    print(' 停止伺服器：Ctrl + C')
    print('=' * 54)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
