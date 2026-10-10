# -*- coding: utf-8 -*-
"""公共工具：链接识别、HTTP 会话、JSON 深搜等。"""

import http.cookiejar
import gzip
import re
import urllib.request

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

DEFAULT_HEADERS = {
    "User-Agent": BROWSER_UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip",
}

PLATFORM_RULES = [
    ("bilibili", re.compile(r"bilibili\.com|b23\.tv|bili2233\.cn", re.I)),
    ("douyin", re.compile(r"douyin\.com|iesdouyin\.com", re.I)),
    ("kuaishou", re.compile(r"kuaishou\.com|gifshow\.com", re.I)),
]

URL_RE = re.compile(r"https?://[^\s<>\"'，。！？、；：（）【】\u4e00-\u9fff]+")


def find_url(text):
    """从任意粘贴文本中提取第一个 http 链接。"""
    if not text:
        return None
    m = URL_RE.search(text)
    if not m:
        return None
    return m.group(0).rstrip(".,;:!?)]}") or None


def detect_platform(text):
    for name, rx in PLATFORM_RULES:
        if rx.search(text or ""):
            return name
    return None


class Session:
    """带 Cookie 管理的轻量 HTTP 会话。"""

    def __init__(self, headers=None):
        self.headers = dict(DEFAULT_HEADERS)
        if headers:
            self.headers.update(headers)
        self.cj = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cj)
        )

    def request(self, url, headers=None, timeout=20):
        h = dict(self.headers)
        if headers:
            h.update(headers)
        req = urllib.request.Request(url, headers=h)
        return self.opener.open(req, timeout=timeout)

    def get_bytes(self, url, headers=None, timeout=20):
        with self.request(url, headers, timeout) as r:
            data = r.read()
            enc = (r.headers.get("Content-Encoding") or "").lower()
            if enc in ("gzip", "x-gzip"):
                data = gzip.decompress(data)
            return data, r.geturl(), dict(r.headers)

    def get_text(self, url, headers=None, timeout=20):
        data, final, _ = self.get_bytes(url, headers, timeout)
        return data.decode("utf-8", "ignore"), final

    def cookie_str(self):
        return "; ".join("%s=%s" % (c.name, c.value) for c in self.cj)


def http_headers(extra=None):
    h = dict(DEFAULT_HEADERS)
    if extra:
        h.update(extra)
    return h


def sanitize_filename(name, ext="mp4"):
    name = re.sub(r'[\\/:*?"<>|\r\n\t]', "_", name or "")
    name = re.sub(r"\s+", " ", name).strip(" ._")
    if not name:
        name = "video"
    if len(name) > 80:
        name = name[:80].rstrip(" ._")
    return name + "." + ext


def deep_find(obj, predicate):
    """深度优先查找第一个满足条件的值。"""
    stack = [obj]
    while stack:
        v = stack.pop()
        if predicate(v):
            return v
        if isinstance(v, dict):
            stack.extend(v.values())
        elif isinstance(v, list):
            stack.extend(v)
    return None


def pick_url(url_list):
    if not url_list:
        return None
    for u in url_list:
        if isinstance(u, str) and u.startswith("https://"):
            return u
    for u in url_list:
        if isinstance(u, str) and u.startswith("http"):
            return u
    return None


class ParserError(Exception):
    pass
