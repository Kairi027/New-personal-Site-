# -*- coding: utf-8 -*-
"""视频原画提取 - 本地网页服务（零第三方依赖）。

用法：
    python server/app.py                 # 默认 0.0.0.0:8787，自动生成访问口令
    python server/app.py --password 口令  # 指定固定口令（远程共享时推荐）
    python server/app.py --no-auth       # 关闭口令（仅建议纯本机使用）
"""

import hmac
import json
import os
import re
import secrets
import socket
import sys
import threading
import time
import urllib.parse
import urllib.request
import uuid
from collections import defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from parsers import bilibili, douyin, kuaishou
from parsers.common import Session, http_headers, sanitize_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
HOST = "0.0.0.0"
PORT = 8787
TASK_TTL = 3 * 3600

# 访问控制：口令 + 会话 + 限流
AUTH_ENABLED = True
ACCESS_PASSWORD = os.environ.get("ACCESS_PASSWORD", "").strip()
SESSION_TTL = 30 * 24 * 3600          # 登录状态有效期：30 天
LOGIN_MAX, LOGIN_WINDOW = 5, 60       # 登录尝试：60 秒内最多 5 次
PARSE_MAX, PARSE_WINDOW = 10, 60      # 解析请求：60 秒内最多 10 次
DOWNLOAD_MAX, DOWNLOAD_WINDOW = 6, 60  # 下载请求：60 秒内最多 6 次

PLATFORMS = {
    "bilibili": bilibili,
    "douyin": douyin,
    "kuaishou": kuaishou,
}

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".json": "application/json; charset=utf-8",
}

_tasks = {}
_sessions = {}
_rate = defaultdict(list)
_lock = threading.Lock()


def _clean_tasks():
    now = time.time()
    with _lock:
        for key in list(_tasks):
            if now - _tasks[key]["created"] > TASK_TTL:
                del _tasks[key]


def _create_task(meta, formats):
    tid = uuid.uuid4().hex[:12]
    with _lock:
        _tasks[tid] = {"created": time.time(), "meta": meta, "formats": formats}
    return tid


def _new_session():
    token = secrets.token_urlsafe(32)
    with _lock:
        _sessions[token] = time.time() + SESSION_TTL
    return token


def _clean_sessions():
    now = time.time()
    with _lock:
        for key in list(_sessions):
            if _sessions[key] < now:
                del _sessions[key]


def _check_rate(ip, bucket, limit, window):
    now = time.time()
    with _lock:
        arr = _rate[(ip, bucket)]
        arr[:] = [t for t in arr if now - t < window]
        if len(arr) >= limit:
            return False
        arr.append(now)
        return True

def _friendly_device(ua):
    """从 User-Agent 推断一个可读的设备名，用于登录时在控制台显示。"""
    ua = ua or ""
    if "iPhone" in ua:
        return "iPhone"
    if "iPad" in ua:
        return "iPad"
    if "Android" in ua:
        m = re.search(r";\s*([^;]+?)\s*Build/", ua)
        if m:
            model = m.group(1).strip()
            if len(model) <= 24:
                return "Android · " + model
        return "Android"
    if "Windows NT 10.0" in ua:
        return "Windows 10/11"
    if "Windows NT 6.1" in ua:
        return "Windows 7"
    if "Mac OS X" in ua:
        return "Mac"
    if "Linux" in ua:
        return "Linux"
    return "未知设备"


def _lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("223.5.5.5", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


class Handler(BaseHTTPRequestHandler):
    server_version = "VideoFetch/1.0"
    protocol_version = "HTTP/1.1"

    def handle_error(self, request, client_address):
        """客户端正常断开（如关闭下载/停止服务）不打印堆栈。"""
        import traceback
        exc = sys.exc_info()[1]
        if isinstance(exc, (ConnectionResetError, BrokenPipeError, TimeoutError)):
            return
        traceback.print_exc()

    def log_message(self, fmt, *args):
        try:
            print("[%s] %s" % (time.strftime("%H:%M:%S"), fmt % args))
        except Exception:
            pass

    def _cookie_token(self):
        raw = self.headers.get("Cookie") or ""
        for part in raw.split(";"):
            k, _, v = part.strip().partition("=")
            if k == "vf_token":
                return v
        return ""

    def _authed(self):
        if not AUTH_ENABLED:
            return True
        token = self._cookie_token()
        if not token:
            return False
        _clean_sessions()
        with _lock:
            exp = _sessions.get(token)
            if exp is None:
                return False
            return exp > time.time()

    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    def _serve_static(self, path):
        if path in ("/", "/index.html"):
            name = "login.html" if (AUTH_ENABLED and not self._authed()) else "index.html"
        else:
            name = path.lstrip("/")
        full = os.path.realpath(os.path.join(STATIC_DIR, name))
        static_root = os.path.realpath(STATIC_DIR)
        if not full.startswith(static_root) or not os.path.isfile(full):
            self._send_json({"ok": False, "message": "页面不存在"}, 404)
            return
        ext = os.path.splitext(full)[1].lower()
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", CONTENT_TYPES.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    # ---------- API ----------

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/download/"):
            if not self._authed():
                self._send_json({"ok": False, "message": "请先登录"}, 401)
                return
            parts = parsed.path.split("/")
            if len(parts) >= 5:
                self._proxy_download(parts[3], parts[4])
            return
        if parsed.path.startswith("/api/proxy"):
            if not self._authed():
                self._send_json({"ok": False, "message": "请先登录"}, 401)
                return
            self._proxy_image(parsed)
            return
        self._serve_static(parsed.path)

    def do_POST(self):
        if self.path == "/api/login":
            self._api_login()
        elif self.path == "/api/logout":
            self._api_logout()
        elif self.path == "/api/parse":
            if not self._authed():
                self._send_json({"ok": False, "message": "请先登录"}, 401)
                return
            self._api_parse()
        else:
            self._send_json({"ok": False, "message": "接口不存在"}, 404)

    def _api_login(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > 1 << 20:
                raise ValueError("bad length")
            raw = self.rfile.read(length)
            payload = json.loads(raw.decode("utf-8", "ignore"))
            password = str(payload.get("password") or "")
        except Exception:
            self._send_json({"ok": False, "message": "请求格式不正确"}, 400)
            return
        ip = self.client_address[0]
        if not _check_rate(ip, "login", LOGIN_MAX, LOGIN_WINDOW):
            self._send_json({"ok": False, "message": "尝试次数过多，请 1 分钟后再试"}, 429)
            return
        if AUTH_ENABLED and not hmac.compare_digest(password, ACCESS_PASSWORD):
            self._send_json({"ok": False, "message": "口令错误"}, 401)
            return
        ua = self.headers.get("User-Agent") or ""
        print("[登录] %s 设备=%s IP=%s" % (
            time.strftime("%Y-%m-%d %H:%M:%S"),
            _friendly_device(ua),
            self.client_address[0],
        ), flush=True)
        token = _new_session()
        body = json.dumps({"ok": True}, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.send_header(
            "Set-Cookie",
            "vf_token=%s; Path=/; HttpOnly; SameSite=Lax; Max-Age=%d"
            % (token, SESSION_TTL),
        )
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    def _api_logout(self):
        token = self._cookie_token()
        if token:
            with _lock:
                _sessions.pop(token, None)
        body = json.dumps({"ok": True}, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Set-Cookie", "vf_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    def _api_parse(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > 1 << 20:
                raise ValueError("bad length")
            raw = self.rfile.read(length)
            payload = json.loads(raw.decode("utf-8", "ignore"))
            text = (payload.get("text") or "").strip()
        except Exception:
            self._send_json({"ok": False, "message": "请求格式不正确"}, 400)
            return
        if not text:
            self._send_json({"ok": False, "message": "请先粘贴视频链接"}, 400)
            return

        ip = self.client_address[0]
        if not _check_rate(ip, "parse", PARSE_MAX, PARSE_WINDOW):
            self._send_json({"ok": False, "message": "请求过于频繁，请稍后再试"}, 429)
            return

        from parsers.common import detect_platform
        platform = detect_platform(text)
        if not platform:
            self._send_json(
                {"ok": False, "message": "暂只支持 B站 / 抖音 / 快手 的链接"}, 400
            )
            return

        try:
            session = Session()
            result = PLATFORMS[platform].parse(text, session)
        except Exception as e:
            self._send_json({"ok": False, "message": str(e) or "解析失败，请稍后重试"})
            return

        meta = {
            key: result.get(key)
            for key in ("platform", "title", "author", "cover", "duration", "note",
                        "cover_headers")
            if result.get(key)
        }
        tid = _create_task(meta, result["formats"])
        out_formats = []
        for f in result["formats"]:
            out_formats.append({
                "id": f["id"],
                "label": f["label"],
                "note": f.get("note", ""),
                "download_url": "/api/download/%s/%s" % (tid, f["id"]),
            })
        self._send_json({"ok": True, "meta": meta, "formats": out_formats})

    def _proxy_image(self, parsed):
        query = urllib.parse.parse_qs(parsed.query)
        url = (query.get("u") or [""])[0]
        tid = (query.get("tid") or [""])[0]
        if not url:
            self._send_json({"ok": False, "message": "缺少参数"}, 400)
            return
        headers = http_headers()
        with _lock:
            if tid and tid in _tasks:
                headers.update(_tasks[tid]["meta"].get("cover_headers") or {})
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                body = resp.read()
                ctype = resp.headers.get("Content-Type", "image/jpeg")
        except Exception:
            self._send_json({"ok": False, "message": "封面加载失败"}, 502)
            return
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    def _proxy_download(self, tid, fmt_id):
        ip = self.client_address[0]
        if not _check_rate(ip, "download", DOWNLOAD_MAX, DOWNLOAD_WINDOW):
            self._send_json({"ok": False, "message": "下载请求过于频繁，请稍后再试"}, 429)
            return
        _clean_tasks()
        with _lock:
            task = _tasks.get(tid)
        if not task:
            self._send_json({"ok": False, "message": "下载任务已过期，请重新解析"}, 404)
            return
        fmt = next((f for f in task["formats"] if f["id"] == fmt_id), None)
        if not fmt:
            self._send_json({"ok": False, "message": "该格式不存在"}, 404)
            return

        url = fmt["url"]
        headers = http_headers(fmt.get("headers") or {})
        range_hdr = self.headers.get("Range")
        if range_hdr:
            headers["Range"] = range_hdr

        try:
            req = urllib.request.Request(url, headers=headers)
            resp = urllib.request.urlopen(req, timeout=30)
            try:
                raw = resp.fp
                if raw is not None:
                    raw.settimeout(None)
            except Exception:
                pass
        except Exception as e:
            self._send_json({"ok": False, "message": "下载失败：%s" % e})
            return

        title = task["meta"].get("title") or "video"
        filename = sanitize_filename(title, fmt.get("ext", "mp4"))
        ascii_name = filename.encode("ascii", "ignore").decode() or "video.mp4"
        cd = "attachment; filename=\"%s\"; filename*=UTF-8''%s" % (
            ascii_name, urllib.parse.quote(filename),
        )
        ctype = resp.headers.get("Content-Type", "video/mp4")
        clen = resp.headers.get("Content-Length")

        status = getattr(resp, "status", 200)
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Disposition", cd)
        self.send_header("Accept-Ranges", "bytes")
        if resp.headers.get("Content-Range"):
            self.send_header("Content-Range", resp.headers["Content-Range"])
        chunked = clen is None
        if chunked:
            self.send_header("Transfer-Encoding", "chunked")
        else:
            self.send_header("Content-Length", clen)
        self.end_headers()

        try:
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                if chunked:
                    self.wfile.write(("%X\r\n" % len(chunk)).encode("ascii"))
                self.wfile.write(chunk)
                if chunked:
                    self.wfile.write(b"\r\n")
            if chunked:
                self.wfile.write(b"0\r\n\r\n")
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            try:
                resp.close()
            except Exception:
                pass


def main():
    global HOST, PORT, AUTH_ENABLED, ACCESS_PASSWORD
    args = sys.argv[1:]
    for i, a in enumerate(args):
        if a == "--port" and i + 1 < len(args):
            PORT = int(args[i + 1])
        elif a == "--host" and i + 1 < len(args):
            HOST = args[i + 1]
        elif a == "--password" and i + 1 < len(args):
            ACCESS_PASSWORD = args[i + 1]
        elif a == "--no-auth":
            AUTH_ENABLED = False

    if AUTH_ENABLED and not ACCESS_PASSWORD:
        ACCESS_PASSWORD = secrets.token_urlsafe(9)

    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.daemon_threads = True

    print("=" * 56)
    print("  视频原画提取（个人自用）已启动")
    print("=" * 56)
    print("  本机访问:   http://127.0.0.1:%d" % PORT)
    ip = _lan_ip()
    if ip:
        print("  手机访问:   http://%s:%d  （需同一WiFi）" % (ip, PORT))
    if AUTH_ENABLED:
        print("  访问口令:   %s" % ACCESS_PASSWORD)
        print("  提示: 首次访问需输入口令，登录后 30 天内免输")
        print("  固定口令: python server\\app.py --password 你的口令")
    else:
        print("  提示: 当前未启用访问口令（--no-auth），请勿暴露到公网")
    print("  按 Ctrl+C 停止")
    print("=" * 56)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止服务")


if __name__ == "__main__":
    main()
