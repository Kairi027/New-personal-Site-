# -*- coding: utf-8 -*-
"""快手解析：跟随分享短链 -> 读取页面内嵌 Apollo/初始状态 -> 提取视频地址。"""

import json
import re

from .common import ParserError, deep_find, find_url, sanitize_filename


def _parse_state(html):
    """解析页面内嵌 JSON（新版 __APOLLO_STATE__，旧版 __INITIAL_STATE__）。"""
    i = html.find("__APOLLO_STATE__")
    if i != -1:
        j = html.find("</script>", i)
        if j != -1:
            blob = html[i:j]
            m = re.match(r"__APOLLO_STATE__\s*=\s*(\{.*)", blob, re.S)
            if m:
                try:
                    data, _ = json.JSONDecoder().raw_decode(m.group(1).rstrip().rstrip(";"))
                    return data
                except Exception:
                    pass
    m = re.search(r"window\.__INITIAL_STATE__\s*=\s*(\{.*?\})\s*</script>", html, re.S)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    return None


def _find_author(data):
    target = None
    stack = [data]
    while stack:
        v = stack.pop()
        if isinstance(v, dict):
            if "author" in v and isinstance(v["author"], dict):
                aid = v["author"].get("id")
                if isinstance(aid, str) and aid.startswith("VisionVideoDetailAuthor"):
                    target = aid
                    break
            stack.extend(v.values())
        elif isinstance(v, list):
            stack.extend(v)
    if not target:
        return ""
    node = data.get(target) if isinstance(data, dict) else None
    if isinstance(node, dict) and isinstance(node.get("name"), str):
        return node["name"]
    return ""


def parse(text, session):
    url = find_url(text)
    if not url:
        raise ParserError("未找到快手链接")

    try:
        body, final, _ = session.get_bytes(
            url, {"Referer": "https://www.kuaishou.com/"}
        )
    except Exception:
        raise ParserError("无法访问快手链接，可能已失效或需要重试")
    html = body.decode("utf-8", "ignore")

    data = _parse_state(html)
    vp = None
    if data:
        vp = data.get("videoPlay") or deep_find(
            data,
            lambda v: isinstance(v, dict)
            and isinstance(v.get("photoUrl"), str)
            and v["photoUrl"].startswith("http"),
        )
    if not vp or not vp.get("photoUrl"):
        raise ParserError("解析失败：快手页面结构可能已更新，请稍后再试")

    video_url = vp["photoUrl"]
    if video_url.startswith("http://"):
        video_url = "https://" + video_url[len("http://"):]

    title = (vp.get("caption") or "").strip() or "快手视频"
    author = vp.get("userName") or _find_author(data)
    cover = vp.get("coverUrl", "")
    duration = int(vp.get("duration") or 0) // 1000

    headers = {
        "User-Agent": session.headers.get("User-Agent", ""),
        "Referer": "https://www.kuaishou.com/",
        "Cookie": session.cookie_str(),
    }
    return {
        "platform": "kuaishou",
        "title": title,
        "author": author,
        "cover": cover,
        "duration": duration,
        "note": "原视频（无水印），链接有时效，请尽快下载",
        "formats": [{
            "id": "video",
            "label": "原视频",
            "url": video_url,
            "note": "链接有效期有限，请尽快下载",
            "ext": "mp4",
            "headers": headers,
        }],
        "cover_headers": {"Referer": "https://www.kuaishou.com/"},
        "default_filename": sanitize_filename(title, "mp4"),
    }
