#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kairi 的小站 · 本地服务

只监听 127.0.0.1，负责三件事：
  1. 写入 / 读取 projects/<项目id>/ 下的项目文件
  2. 写入 js/articles-data.js、projects/projects-data.js 这类"数据文件"
  3. 保存点赞与评论（data/social.json + js/social-data.js）

另外顺带能把整个博客当静态站点托管（万一 file:// 下连不上服务时的备用入口）。

零依赖：只用 Python 标准库。
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PORT = 8765

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECTS_DIR = os.path.join(ROOT, "projects")
DATA_DIR = os.path.join(ROOT, "data")
JS_DIR = os.path.join(ROOT, "js")
SOCIAL_JSON = os.path.join(DATA_DIR, "social.json")
SOCIAL_JS = os.path.join(JS_DIR, "social-data.js")

ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")

DATA_TARGETS = {
    "/api/data/projects": os.path.join(PROJECTS_DIR, "projects-data.js"),
    "/api/data/articles": os.path.join(JS_DIR, "articles-data.js"),
}

MAX_BODY = 512 * 1024 * 1024  # 512MB 上限，防手滑

_lock = threading.Lock()
_browser_path = None

SCREENSHOT_SIZE = "1280,800"
SCREENSHOT_BUDGET_MS = "3000"

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Google\Chrome\Application\chrome.exe"),
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]


def find_browser():
    """找一个可用于 headless 截图的浏览器：注册表 App Paths → 常见路径 → PATH。"""
    global _browser_path
    if _browser_path:
        return _browser_path

    try:
        import winreg
        for exe in ("chrome.exe", "msedge.exe"):
            for hive in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
                key = r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\%s" % exe
                try:
                    with winreg.OpenKey(hive, key) as handle:
                        path = winreg.QueryValueEx(handle, "")[0]
                    if path and os.path.isfile(path):
                        _browser_path = path
                        return path
                except OSError:
                    pass
    except ImportError:
        pass

    for path in CHROME_CANDIDATES:
        if path and os.path.isfile(path):
            _browser_path = path
            return path

    for name in ("chrome.exe", "msedge.exe"):
        found = shutil.which(name)
        if found:
            _browser_path = found
            return found

    return None

# ---------------- 桌面程序抓窗口（纯标准库；有 Pillow 时走快路） ----------------


def rel_path(path):
    return os.path.relpath(path, ROOT).replace("\\", "/")


def enable_dpi_awareness():
    """按物理像素取窗口坐标：显示器缩放（125% / 150%）时不会错位或裁歪。"""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        ctypes.windll.shcore.SetProcessDpiAwareness(2)      # PER_MONITOR_AWARE_V2
    except Exception:  # noqa: BLE001
        try:
            import ctypes
            ctypes.windll.user32.SetProcessDPIAware()
        except Exception:  # noqa: BLE001
            pass


def tail_text(path, limit=400):
    """读日志末尾几行，用来告诉用户程序为什么没起来。"""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            text = fh.read().strip()
    except OSError:
        return "（没有日志）"
    if not text:
        return "（日志是空的）"
    return text[-limit:]


def enum_visible_windows():
    """{hwnd: 标题} —— 当前可见且标题非空的顶层窗口。"""
    try:
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    except Exception:
        return {}

    found = {}

    def _callback(hwnd, _lparam):
        try:
            if not user32.IsWindowVisible(hwnd):
                return True
            length = user32.GetWindowTextLengthW(hwnd)
            if length <= 0:
                return True
            buf = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buf, length + 1)
            title = buf.value.strip()
            if title:
                found[int(hwnd)] = title
        except Exception:  # noqa: BLE001
            pass
        return True

    try:
        user32.EnumWindows.argtypes = [WNDENUMPROC, wintypes.LPARAM]
        user32.EnumWindows.restype = wintypes.BOOL
        user32.EnumWindows(WNDENUMPROC(_callback), 0)
    except Exception:  # noqa: BLE001
        return {}
    return found


def window_rect(hwnd):
    """窗口在屏幕上的位置（优先取 DWM 的真实边框）。"""
    import ctypes
    from ctypes import wintypes

    try:
        rect = wintypes.RECT()
        dwmapi = ctypes.windll.dwmapi
        DWMWA_EXTENDED_FRAME_BOUNDS = 9
        hr = dwmapi.DwmGetWindowAttribute(
            wintypes.HWND(hwnd), ctypes.c_uint(DWMWA_EXTENDED_FRAME_BOUNDS),
            ctypes.byref(rect), ctypes.sizeof(rect),
        )
        if hr == 0 and rect.right > rect.left and rect.bottom > rect.top:
            return int(rect.left), int(rect.top), int(rect.right), int(rect.bottom)
    except Exception:  # noqa: BLE001
        pass

    rect = wintypes.RECT()
    ctypes.windll.user32.GetWindowRect(wintypes.HWND(hwnd), ctypes.byref(rect))
    return int(rect.left), int(rect.top), int(rect.right), int(rect.bottom)


def pick_window(candidates, name, entry):
    """从新出现的窗口里挑最像目标程序的那个：标题含项目名/入口名优先，其次面积最大。"""
    hints = []
    for value in (name, entry):
        value = str(value or "").strip()
        if not value:
            continue
        hints.append(value.lower())
        base = os.path.basename(value)
        if base:
            hints.append(base.lower())
            hints.append(os.path.splitext(base)[0].lower())

    best = 0
    best_score = None
    for hwnd, title in candidates:
        score = 0
        lower = title.lower()
        for hint in hints:
            if hint and hint in lower:
                score += 100
                break
        try:
            left, top, right, bottom = window_rect(hwnd)
            score += max(0, right - left) * max(0, bottom - top) / 1000.0
        except Exception:  # noqa: BLE001
            pass
        if best_score is None or score > best_score:
            best_score = score
            best = hwnd
    return best


def focus_window(hwnd):
    """把窗口还原并提到最前面，否则抓到的可能是被挡住的内容。"""
    try:
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        SW_RESTORE = 9
        user32.ShowWindow(wintypes.HWND(hwnd), SW_RESTORE)
        user32.SetForegroundWindow(wintypes.HWND(hwnd))
        return True
    except Exception:  # noqa: BLE001
        return False


def write_png(path, width, height, rows):
    """零依赖写 PNG：rows 是每行的 RGB bytes。"""
    import struct
    import zlib

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data +
                struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    raw = b"".join(b"\x00" + row for row in rows)
    with open(path, "wb") as fh:
        fh.write(b"\x89PNG\r\n\x1a\n")
        fh.write(chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)))
        fh.write(chunk(b"IDAT", zlib.compress(raw, 6)))
        fh.write(chunk(b"IEND", b""))


def window_scale(hwnd):
    """目标窗口被系统放大了多少倍（显示器 125% / 150% / 200% 时 > 1）。

    老程序（DPI 不感知）自己按 100% 的像素画，系统再整体放大，
    而 PrintWindow 抓到的是它放大前的原生像素——所以要按这个倍数把多出来的黑边裁掉。
    """
    import ctypes
    from ctypes import wintypes

    try:
        user32 = ctypes.windll.user32
        dpi_win = user32.GetDpiForWindow(wintypes.HWND(hwnd))
        if dpi_win and dpi_win != 96:
            return 1.0                      # 程序自己是 DPI 感知的，按物理像素渲染
        hmon = user32.MonitorFromWindow(wintypes.HWND(hwnd), 2)   # MONITOR_DEFAULTTONEAREST
        dx = ctypes.c_uint()
        dy = ctypes.c_uint()
        if ctypes.windll.shcore.GetDpiForMonitor(
                wintypes.HMONITOR(hmon), 0, ctypes.byref(dx), ctypes.byref(dy)) == 0 and dx.value:
            return max(1.0, dx.value / 96.0)
    except Exception:  # noqa: BLE001
        pass
    return 1.0


def capture_window_pixels(hwnd, strategy):
    """用 GDI 抓窗口像素：(width, height, rows)；失败返回 None。

    strategy='print'  抓客户区自身内容（程序原生像素，被别的窗口挡住也有内容）；
    strategy='screen' 从屏幕对应位置拷贝（只有窗口真在前台时才靠谱）。
    """
    import ctypes
    from ctypes import wintypes

    user32 = ctypes.windll.user32
    gdi32 = ctypes.windll.gdi32
    PW_CLIENTONLY = 1
    SRCCOPY = 0x00CC0020

    if strategy == "print":
        client = wintypes.RECT()
        user32.GetClientRect(wintypes.HWND(hwnd), ctypes.byref(client))
        scale = window_scale(hwnd)
        width = int(round(client.right / scale))
        height = int(round(client.bottom / scale))
        origin_x = origin_y = 0
    else:
        left, top, right, bottom = window_rect(hwnd)
        width = right - left
        height = bottom - top
        origin_x, origin_y = left, top
        # 窗口最小化时 GetWindowRect 会给出 (-32000, -32000) 这种假坐标
        if left <= -30000 or top <= -30000:
            return None

    if width < 32 or height < 32 or width > 20000 or height > 20000:
        return None

    class BITMAPINFOHEADER(ctypes.Structure):
        _fields_ = [
            ("biSize", wintypes.DWORD), ("biWidth", ctypes.c_long),
            ("biHeight", ctypes.c_long), ("biPlanes", wintypes.WORD),
            ("biBitCount", wintypes.WORD), ("biCompression", wintypes.DWORD),
            ("biSizeImage", wintypes.DWORD), ("biXPelsPerMeter", ctypes.c_long),
            ("biYPelsPerMeter", ctypes.c_long), ("biClrUsed", wintypes.DWORD),
            ("biClrImportant", wintypes.DWORD),
        ]

    class BITMAPINFO(ctypes.Structure):
        _fields_ = [("bmiHeader", BITMAPINFOHEADER), ("bmiColors", wintypes.DWORD * 3)]

    info = BITMAPINFO()
    info.bmiHeader.biSize = ctypes.sizeof(BITMAPINFOHEADER)
    info.bmiHeader.biWidth = width
    info.bmiHeader.biHeight = -height        # 负数 = 从上到下
    info.bmiHeader.biPlanes = 1
    info.bmiHeader.biBitCount = 32
    info.bmiHeader.biCompression = 0         # BI_RGB

    hdc_window = user32.GetWindowDC(wintypes.HWND(hwnd))
    hdc_mem = gdi32.CreateCompatibleDC(hdc_window)
    hbitmap = gdi32.CreateCompatibleBitmap(hdc_window, width, height)
    gdi32.SelectObject(hdc_mem, hbitmap)

    try:
        buffer = ctypes.create_string_buffer(width * height * 4)
        if strategy == "print":
            ok = user32.PrintWindow(wintypes.HWND(hwnd), hdc_mem, PW_CLIENTONLY)
        else:
            hdc_screen = user32.GetDC(0)
            ok = gdi32.BitBlt(hdc_mem, 0, 0, width, height, hdc_screen, origin_x, origin_y, SRCCOPY)
            user32.ReleaseDC(0, hdc_screen)
        if not ok:
            return None
        if not gdi32.GetDIBits(hdc_mem, hbitmap, 0, height, buffer, ctypes.byref(info), 0):
            return None

        raw = buffer.raw
        if not max(raw[0::4] + raw[1::4] + raw[2::4]):
            return None                      # 纯黑，说明这种方式没抓到内容

        rows = []
        stride = width * 4
        for y in range(height):
            line = raw[y * stride:(y + 1) * stride]
            rgb = bytearray(width * 3)
            rgb[0::3] = line[2::4]
            rgb[1::3] = line[1::4]
            rgb[2::3] = line[0::4]
            rows.append(bytes(rgb))
        return width, height, rows
    finally:
        gdi32.DeleteObject(hbitmap)
        gdi32.DeleteDC(hdc_mem)
        user32.ReleaseDC(wintypes.HWND(hwnd), hdc_window)


def grab_window_pixels(hwnd):
    """先抓窗口自身内容，抓不到再退回屏幕拷贝。"""
    for strategy in ("print", "screen"):
        grabbed = capture_window_pixels(hwnd, strategy)
        if grabbed:
            return grabbed
    return None


def is_foreground(hwnd):
    try:
        import ctypes
        return int(ctypes.windll.user32.GetForegroundWindow()) == int(hwnd)
    except Exception:  # noqa: BLE001
        return False


def grab_window_to_png(hwnd, out_file):
    """把窗口内容存成 PNG；成功返回 True。"""
    # 1) 首选 PrintWindow：抓的是窗口自己的画面，被挡住也有内容
    grabbed = capture_window_pixels(hwnd, "print")
    if grabbed:
        write_png(out_file, grabbed[0], grabbed[1], grabbed[2])
        return True

    # 2) 抓不到窗口内容时才能用屏幕截图，而且必须确认窗口真的在前台，
    #    否则截到的是压在它上面的别的窗口，封面就错了。
    if not is_foreground(hwnd):
        return False

    try:
        from PIL import ImageGrab
        left, top, right, bottom = window_rect(hwnd)
        if right > left and bottom > top:
            image = ImageGrab.grab(bbox=(left, top, right, bottom), all_screens=False)
            image = image.convert("RGB")
            if image.getbbox() and image.getextrema() != ((0, 0), (0, 0), (0, 0)):
                image.save(out_file)
                return True
    except Exception:  # noqa: BLE001
        pass

    # 3) 没装 Pillow（或它也没抓到）就用 GDI + zlib 自己写
    grabbed = capture_window_pixels(hwnd, "screen")
    if grabbed:
        write_png(out_file, grabbed[0], grabbed[1], grabbed[2])
        return True
    return False


MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
}


def safe_path(base, *parts):
    """把相对路径拼到 base 下，并确保结果没有跑出 base。"""
    target = os.path.abspath(os.path.join(base, *parts))
    base_abs = os.path.abspath(base)
    if target != base_abs and not target.startswith(base_abs + os.sep):
        raise ValueError("路径越界")
    return target


def valid_id(value):
    return bool(value and ID_RE.match(value))


def read_social():
    try:
        with open(SOCIAL_JSON, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        if not isinstance(data, dict) or not isinstance(data.get("articles"), dict):
            return {"articles": {}}
        for entry in data["articles"].values():
            if not isinstance(entry, dict):
                continue
            entry.setdefault("likes", 0)
            entry.setdefault("comments", [])
            for comment in entry["comments"]:
                if isinstance(comment, dict):
                    comment.setdefault("replies", [])
        return data
    except FileNotFoundError:
        return {"articles": {}}
    except Exception:
        return {"articles": {}}


def write_social(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = SOCIAL_JSON + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    os.replace(tmp, SOCIAL_JSON)

    os.makedirs(JS_DIR, exist_ok=True)
    text = ("/* 由本地服务根据 data/social.json 自动生成，请勿手改 */\n\n"
            "window.KAIRI_SOCIAL = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")
    tmp_js = SOCIAL_JS + ".tmp"
    with open(tmp_js, "w", encoding="utf-8") as fh:
        fh.write(text)
    os.replace(tmp_js, SOCIAL_JS)


class Handler(BaseHTTPRequestHandler):
    server_version = "KairiBlogService/1.0"
    protocol_version = "HTTP/1.1"

    # ---------------- 基础工具 ----------------

    def log_message(self, fmt, *args):
        sys.stdout.write("[%s] %s\n" % (time.strftime("%H:%M:%S"), fmt % args))
        sys.stdout.flush()

    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "600")

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return b""
        if length > MAX_BODY:
            raise ValueError("请求体过大")
        remaining = length
        chunks = []
        while remaining > 0:
            chunk = self.rfile.read(min(remaining, 1 << 20))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        return b"".join(chunks)

    def read_json(self):
        raw = self.read_body()
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8", "ignore"))

    # ---------------- 路由 ----------------

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        try:
            if path == "/api/ping":
                return self.send_json({"ok": True, "root": ROOT, "port": PORT})
            if path == "/api/social":
                return self.send_json(read_social())
            if path.startswith("/api/file/"):
                return self.get_project_file(path)
            return self.serve_static(path)
        except Exception as exc:  # noqa: BLE001
            return self.send_json({"ok": False, "message": str(exc)}, 400)

    def do_PUT(self):
        path = self.path.split("?")[0]
        try:
            if path.startswith("/api/file/"):
                return self.put_project_file(path)
            return self.send_json({"ok": False, "message": "接口不存在"}, 404)
        except Exception as exc:  # noqa: BLE001
            return self.send_json({"ok": False, "message": str(exc)}, 400)

    def do_DELETE(self):
        path = self.path.split("?")[0]
        try:
            if path.startswith("/api/project/"):
                return self.delete_project(path)
            if path.startswith("/api/file/"):
                return self.delete_project_file(path)
            return self.send_json({"ok": False, "message": "接口不存在"}, 404)
        except Exception as exc:  # noqa: BLE001
            return self.send_json({"ok": False, "message": str(exc)}, 400)

    def do_POST(self):
        path = self.path.split("?")[0]
        try:
            if path in DATA_TARGETS:
                return self.write_data_file(path)
            if path == "/api/social/comment":
                return self.add_comment()
            if path == "/api/social/reply":
                return self.add_reply()
            if path == "/api/social/delete-comment":
                return self.delete_comment()
            if path == "/api/social/like":
                return self.add_like()
            if path == "/api/screenshot":
                return self.take_screenshot()
            return self.send_json({"ok": False, "message": "接口不存在"}, 404)
        except Exception as exc:  # noqa: BLE001
            return self.send_json({"ok": False, "message": str(exc)}, 400)

    # ---------------- 项目文件 ----------------

    def split_file_path(self, path):
        rest = path[len("/api/file/"):]
        parts = [urllib.parse.unquote(p) for p in rest.split("/") if p not in ("", ".")]
        if len(parts) < 2:
            raise ValueError("路径不完整")
        project_id = parts[0]
        if not valid_id(project_id):
            raise ValueError("项目 id 不合法")
        if any(p == ".." for p in parts):
            raise ValueError("路径不合法")
        return project_id, parts[1:]

    def get_project_file(self, path):
        project_id, rel = self.split_file_path(path)
        target = safe_path(os.path.join(PROJECTS_DIR, project_id), *rel)
        if not os.path.isfile(target):
            return self.send_json({"ok": False, "message": "文件不存在"}, 404)
        with open(target, "rb") as fh:
            body = fh.read()
        ext = os.path.splitext(target)[1].lower()
        self.send_response(200)
        self.cors()
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def put_project_file(self, path):
        project_id, rel = self.split_file_path(path)
        target = safe_path(os.path.join(PROJECTS_DIR, project_id), *rel)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        body = self.read_body()
        with open(target, "wb") as fh:
            fh.write(body)
        return self.send_json({"ok": True, "bytes": len(body), "path": os.path.relpath(target, ROOT).replace("\\", "/")})

    def delete_project_file(self, path):
        project_id, rel = self.split_file_path(path)
        target = safe_path(os.path.join(PROJECTS_DIR, project_id), *rel)
        if os.path.isdir(target):
            shutil.rmtree(target, ignore_errors=True)
        elif os.path.isfile(target):
            os.remove(target)
        return self.send_json({"ok": True})

    def delete_project(self, path):
        project_id = urllib.parse.unquote(path[len("/api/project/"):].strip("/"))
        if not valid_id(project_id):
            raise ValueError("项目 id 不合法")
        target = safe_path(PROJECTS_DIR, project_id)
        if os.path.isdir(target):
            shutil.rmtree(target, ignore_errors=True)
        return self.send_json({"ok": True, "removed": project_id})

    # ---------------- 数据文件 ----------------

    def write_data_file(self, path):
        target = DATA_TARGETS[path]
        text = self.read_body().decode("utf-8", "ignore")
        if "window.KAIRI_" not in text:
            raise ValueError("内容看起来不是博客数据文件，已拒绝写入")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        tmp = target + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            fh.write(text)
        os.replace(tmp, target)
        return self.send_json({"ok": True, "file": os.path.relpath(target, ROOT).replace("\\", "/")})

    # ---------------- 点赞 / 评论 ----------------

    def article_entry(self, data, article_id, create=False):
        articles = data.setdefault("articles", {})
        entry = articles.get(article_id)
        if entry is None:
            if not create:
                return None
            entry = {"likes": 0, "comments": []}
            articles[article_id] = entry
        entry.setdefault("likes", 0)
        entry.setdefault("comments", [])
        return entry

    def add_like(self):
        payload = self.read_json()
        article_id = str(payload.get("articleId") or "")
        if not article_id:
            raise ValueError("缺少 articleId")
        delta = int(payload.get("delta") or 0)
        delta = 1 if delta > 0 else (-1 if delta < 0 else 0)
        with _lock:
            data = read_social()
            entry = self.article_entry(data, article_id, create=True)
            entry["likes"] = max(0, int(entry.get("likes", 0)) + delta)
            write_social(data)
            likes = entry["likes"]
        return self.send_json({"ok": True, "likes": likes})

    def add_comment(self):
        payload = self.read_json()
        article_id = str(payload.get("articleId") or "")
        text = str(payload.get("text") or "").strip()
        author = str(payload.get("author") or "").strip() or "匿名访客"
        if not article_id:
            raise ValueError("缺少 articleId")
        if not text:
            raise ValueError("评论内容不能为空")
        if len(text) > 2000:
            raise ValueError("评论太长了（最多 2000 字）")
        if len(author) > 40:
            author = author[:40]
        comment = {
            "id": "c" + format(int(time.time() * 1000), "x"),
            "author": author,
            "text": text,
            "at": int(time.time() * 1000),
        }
        with _lock:
            data = read_social()
            entry = self.article_entry(data, article_id, create=True)
            entry["comments"].append(comment)
            write_social(data)
            count = len(entry["comments"])
        return self.send_json({"ok": True, "comment": comment, "count": count})

    def add_reply(self):
        """回复某条评论。作者名由服务端写死为「站长」，避免冒名。"""
        payload = self.read_json()
        article_id = str(payload.get("articleId") or "")
        comment_id = str(payload.get("commentId") or "")
        text = str(payload.get("text") or "").strip()
        if not article_id or not comment_id:
            raise ValueError("参数不完整")
        if not text:
            raise ValueError("回复内容不能为空")
        if len(text) > 2000:
            raise ValueError("回复太长了（最多 2000 字）")

        reply = {
            "id": "r" + format(int(time.time() * 1000), "x"),
            "author": "站长",
            "text": text,
            "at": int(time.time() * 1000),
        }
        with _lock:
            data = read_social()
            entry = self.article_entry(data, article_id)
            if not entry:
                raise ValueError("找不到这篇文章的评论")
            target = None
            for comment in entry["comments"]:
                if comment.get("id") == comment_id:
                    target = comment
                    break
            if target is None:
                raise ValueError("找不到这条评论")
            target.setdefault("replies", []).append(reply)
            write_social(data)
        return self.send_json({"ok": True, "reply": reply})

    def delete_comment(self):
        payload = self.read_json()
        article_id = str(payload.get("articleId") or "")
        comment_id = str(payload.get("commentId") or "")
        if not article_id or not comment_id:
            raise ValueError("参数不完整")
        with _lock:
            data = read_social()
            entry = self.article_entry(data, article_id)
            if entry:
                entry["comments"] = [c for c in entry["comments"] if c.get("id") != comment_id]
            write_social(data)
            count = len(entry["comments"]) if entry else 0
        return self.send_json({"ok": True, "count": count})

    # ---------------- 自动截图 ----------------

    def wait_for_url(self, url, wait_ms):
        """等一个 http 地址可用（任何 HTTP 响应都算起来了）。"""
        import urllib.request
        import urllib.error

        deadline = time.time() + wait_ms / 1000.0
        while time.time() < deadline:
            try:
                with urllib.request.urlopen(url, timeout=1.5):
                    return True
            except urllib.error.HTTPError:
                return True          # 有响应就算起来了（404 也算）
            except Exception:
                time.sleep(0.6)
        return False

    def stop_launched(self, proc):
        """杀掉为截图启动的进程（连同它拉起来的子进程）。"""
        if proc is None:
            return
        try:
            if proc.poll() is None:
                flags = subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    capture_output=True, timeout=20, creationflags=flags,
                )
        except Exception:  # noqa: BLE001
            pass

    def take_screenshot(self):
        """给项目生成封面截图。

        三种模式（mode 不传就按老规则推断）：
          1. web：在项目目录里把项目跑起来，等 url 能访问后用浏览器截图，截完杀掉进程；
          2. static：按 entry 打开 projects/<id>/<entry> 这个文件（适合纯静态页面）；
          3. desktop：把本机程序（pygame / exe ...）跑起来，抓它的窗口截图。
        """
        payload = self.read_json()
        project_id = str(payload.get("projectId") or "")
        entry = str(payload.get("entry") or "index.html")
        command = str(payload.get("command") or "").strip()
        url = str(payload.get("url") or "").strip()
        cwd_rel = str(payload.get("cwd") or "").strip()
        name = str(payload.get("name") or "").strip()
        mode = str(payload.get("mode") or "").strip().lower()
        if mode not in ("web", "static", "desktop"):
            mode = "web" if url else ("desktop" if command else "static")
        try:
            wait_ms = int(payload.get("waitMs") or 15000)
        except (TypeError, ValueError):
            wait_ms = 15000
        wait_ms = max(1000, min(wait_ms, 300000))

        try:
            settle_ms = int(payload.get("settleMs") or 0)
        except (TypeError, ValueError):
            settle_ms = 0
        # 运行起来的应用（Streamlit / Vite 等）需要更久才渲染出内容
        if settle_ms <= 0:
            settle_ms = 12000 if command else int(SCREENSHOT_BUDGET_MS)
        settle_ms = max(1000, min(settle_ms, 40000))

        if not valid_id(project_id):
            raise ValueError("项目 id 不合法")

        project_dir = safe_path(PROJECTS_DIR, project_id)
        if not os.path.isdir(project_dir):
            raise ValueError("项目目录不存在")

        # 很多项目要求在自己的子目录里启动（例如 ../resources 这类相对路径）
        run_dir = project_dir
        if cwd_rel:
            cwd_parts = [part for part in cwd_rel.replace("\\", "/").split("/") if part not in ("", ".")]
            if any(part == ".." for part in cwd_parts):
                raise ValueError("工作目录不合法")
            run_dir = safe_path(project_dir, *cwd_parts) if cwd_parts else project_dir
            if not os.path.isdir(run_dir):
                return self.send_json({
                    "ok": False, "reason": "no-cwd",
                    "message": "工作目录不存在：%s" % cwd_rel,
                })

        # 桌面程序：跑起来抓窗口，不走浏览器
        if mode == "desktop":
            if not command:
                return self.send_json({
                    "ok": False, "reason": "no-command",
                    "message": "这是桌面程序，需要在编辑页填一条启动命令（例如 python \"东方复刻/main.py\"）",
                })
            return self.send_json(self.shoot_desktop(project_id, run_dir, command, wait_ms, name, entry))

        target_url = url
        if not target_url:
            rel_parts = [part for part in entry.split("/") if part not in ("", ".")]
            if any(part == ".." for part in rel_parts):
                raise ValueError("入口路径不合法")
            target = safe_path(project_dir, *rel_parts) if rel_parts else None
            if not target or not os.path.isfile(target):
                return self.send_json({
                    "ok": False, "reason": "no-entry",
                    "message": "这个项目没有可运行入口，也没有配置启动命令（%s）" % entry,
                })
            target_url = "file:///" + target.replace("\\", "/")

        browser = find_browser()
        if not browser:
            return self.send_json({
                "ok": False, "reason": "no-browser",
                "message": "没有找到 Chrome 或 Edge，无法自动截图",
            })

        # 需要先把项目跑起来
        launched = None
        ready = False
        log_path = os.path.join(DATA_DIR, "launch-%s.log" % project_id)
        if command:
            os.makedirs(DATA_DIR, exist_ok=True)
            flags = subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
            if hasattr(subprocess, "CREATE_NEW_PROCESS_GROUP"):
                flags |= subprocess.CREATE_NEW_PROCESS_GROUP
            self.log_message("启动项目命令: %s（工作目录 %s）", command, run_dir)
            try:
                log_file = open(log_path, "w", encoding="utf-8", errors="ignore")
                launched = subprocess.Popen(
                    command, cwd=run_dir, shell=True, stdout=log_file,
                    stderr=subprocess.STDOUT, creationflags=flags,
                )
            except Exception as exc:  # noqa: BLE001
                return self.send_json({
                    "ok": False, "reason": "launch-failed",
                    "message": "启动命令执行失败：%s" % exc,
                })
            ready = self.wait_for_url(target_url, wait_ms)
            if not ready:
                self.log_message("等 %d ms 后 %s 仍不可访问，仍然截图", wait_ms, target_url)

        out_dir = os.path.join(ROOT, "pics", "projects", project_id)
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, "cover.png")
        try:
            os.remove(out_file)
        except OSError:
            pass

        profile = os.path.join(tempfile.gettempdir(), "kairi-shot-profile")
        flags = subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0

        # 运行起来的应用（Streamlit / Vite 这类）内容是异步渲染的，
        # 一次截图常常只截到骨架屏，所以隔几秒多截几张。虚拟时间在这种场景下没用，必须靠真实等待。
        attempts = 3 if command else 1
        best_file = ""
        best_size = 0
        last_err = ""
        base_file = out_file[:-4] if out_file.lower().endswith(".png") else out_file

        try:
            for attempt in range(attempts):
                trial = out_file if attempts == 1 else "%s.try%d.png" % (base_file, attempt)
                try:
                    os.remove(trial)
                except OSError:
                    pass
                args = [
                    browser,
                    "--headless=new",
                    "--disable-gpu",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--hide-scrollbars",
                    "--user-data-dir=" + profile,
                    "--window-size=" + SCREENSHOT_SIZE,
                    "--virtual-time-budget=" + str(settle_ms),
                    "--screenshot=" + trial,
                    target_url,
                ]
                shot = subprocess.run(args, capture_output=True, timeout=90, creationflags=flags)
                if os.path.isfile(trial):
                    size = os.path.getsize(trial)
                    if size > best_size:
                        best_size = size
                        best_file = trial
                elif shot.stderr:
                    last_err = shot.stderr.decode("utf-8", "ignore")[-300:]
                if attempt < attempts - 1:
                    time.sleep(3)
        except subprocess.TimeoutExpired:
            self.stop_launched(launched)
            return self.send_json({"ok": False, "reason": "timeout", "message": "截图超时"})
        finally:
            self.stop_launched(launched)

        if not best_file:
            return self.send_json({"ok": False, "reason": "failed", "message": "截图失败：" + last_err})

        shutil.move(best_file, out_file)
        for attempt in range(attempts):
            trial = "%s.try%d.png" % (base_file, attempt)
            try:
                os.remove(trial)
            except OSError:
                pass

        rel = os.path.relpath(out_file, ROOT).replace("\\", "/")
        self.log_message("截图完成 %s -> %s", project_id, rel)
        return self.send_json({
            "ok": True,
            "path": rel,
            "browser": os.path.basename(browser),
            "bytes": os.path.getsize(out_file),
            "url": target_url,
            "launched": bool(command),
            "ready": ready if command else True,
            "log": os.path.relpath(log_path, ROOT).replace("\\", "/") if command else "",
        })

    # ---------------- 桌面程序抓窗口 ----------------

    def shoot_desktop(self, project_id, run_dir, command, wait_ms, name, entry):
        """把桌面程序跑起来，抓它的窗口当封面，截完把进程连同子进程一起杀掉。"""
        log_path = os.path.join(DATA_DIR, "launch-%s.log" % project_id)
        os.makedirs(DATA_DIR, exist_ok=True)

        flags = subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
        if hasattr(subprocess, "CREATE_NEW_PROCESS_GROUP"):
            flags |= subprocess.CREATE_NEW_PROCESS_GROUP

        before = enum_visible_windows()
        self.log_message("启动桌面程序: %s（工作目录 %s）", command, run_dir)
        try:
            log_file = open(log_path, "w", encoding="utf-8", errors="ignore")
        except OSError as exc:
            return {"ok": False, "reason": "launch-failed", "message": "打不开日志文件：%s" % exc}

        try:
            launched = subprocess.Popen(
                command, cwd=run_dir, shell=True, stdout=log_file,
                stderr=subprocess.STDOUT, creationflags=flags,
            )
        except Exception as exc:  # noqa: BLE001
            log_file.close()
            return {"ok": False, "reason": "launch-failed", "message": "启动命令执行失败：%s" % exc}

        try:
            deadline = time.time() + wait_ms / 1000.0
            hwnd = 0
            title = ""
            while time.time() < deadline:
                if launched.poll() is not None:
                    log_file.flush()
                    return {
                        "ok": False, "reason": "exited", "log": rel_path(log_path),
                        "message": "程序启动后很快就退出了（退出码 %s）。日志末尾：%s"
                                   % (launched.returncode, tail_text(log_path)),
                    }
                fresh = [(h, t) for h, t in enum_visible_windows().items() if h not in before]
                if fresh:
                    hwnd = pick_window(fresh, name, entry)
                    title = dict(fresh).get(hwnd, "")
                    break
                time.sleep(0.5)

            if not hwnd:
                log_file.flush()
                return {
                    "ok": False, "reason": "no-window", "log": rel_path(log_path),
                    "message": "等了 %d 秒也没等到程序窗口；如果它需要更久，把「启动后等待」调大一点。日志末尾：%s"
                               % (int(wait_ms / 1000), tail_text(log_path)),
                }

            self.log_message("找到窗口 #%s「%s」，开始截图", hwnd, title)
            focus_window(hwnd)
            time.sleep(1.5)

            out_dir = os.path.join(ROOT, "pics", "projects", project_id)
            os.makedirs(out_dir, exist_ok=True)
            out_file = os.path.join(out_dir, "cover.png")
            base_file = out_file[:-4]
            attempts = 3
            best_file = ""
            best_size = 0
            try:
                for attempt in range(attempts):
                    trial = "%s.try%d.png" % (base_file, attempt)
                    try:
                        os.remove(trial)
                    except OSError:
                        pass
                    if grab_window_to_png(hwnd, trial) and os.path.isfile(trial):
                        size = os.path.getsize(trial)
                        if size > best_size:
                            best_size = size
                            best_file = trial
                    if attempt < attempts - 1:
                        time.sleep(3)
            finally:
                try:
                    log_file.flush()
                except Exception:  # noqa: BLE001
                    pass

            if not best_file:
                return {
                    "ok": False, "reason": "failed", "log": rel_path(log_path),
                    "message": "抓窗口截图失败（窗口「%s」）" % title,
                }

            try:
                os.remove(out_file)
            except OSError:
                pass
            shutil.move(best_file, out_file)
            for attempt in range(attempts):
                try:
                    os.remove("%s.try%d.png" % (base_file, attempt))
                except OSError:
                    pass

            rel = rel_path(out_file)
            self.log_message("桌面截图完成 %s -> %s（窗口「%s」）", project_id, rel, title)
            return {
                "ok": True, "path": rel, "mode": "desktop", "window": title,
                "bytes": os.path.getsize(out_file), "url": "", "launched": True,
                "ready": True, "log": rel_path(log_path),
            }
        finally:
            try:
                log_file.close()
            except Exception:  # noqa: BLE001
                pass
            self.stop_launched(launched)

    # ---------------- 备用：静态托管 ----------------

    def serve_static(self, path):
        if path == "/":
            path = "/index.html"
        rel = [urllib.parse.unquote(p) for p in path.split("/") if p not in ("", ".")]
        if any(p == ".." for p in rel):
            raise ValueError("路径不合法")
        target = safe_path(ROOT, *rel) if rel else os.path.join(ROOT, "index.html")
        if os.path.isdir(target):
            target = os.path.join(target, "index.html")
        if not os.path.isfile(target):
            return self.send_json({"ok": False, "message": "文件不存在"}, 404)
        with open(target, "rb") as fh:
            body = fh.read()
        ext = os.path.splitext(target)[1].lower()
        self.send_response(200)
        self.cors()
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)


def main():
    enable_dpi_awareness()

    port = PORT
    for i, arg in enumerate(sys.argv):
        if arg == "--port" and i + 1 < len(sys.argv):
            port = int(sys.argv[i + 1])

    os.makedirs(PROJECTS_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(SOCIAL_JSON):
        write_social({"articles": {}})

    print("")
    print("  Kairi 的小站 · 本地服务")
    print("  ----------------------------------------")
    print("  服务地址:   http://%s:%d" % (HOST, port))
    print("  博客目录:   %s" % ROOT)
    print("  只监听本机，请勿暴露到公网。按 Ctrl+C 停止。")
    print("")

    server = ThreadingHTTPServer((HOST, port), Handler)
    server.daemon_threads = True
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")


if __name__ == "__main__":
    main()
