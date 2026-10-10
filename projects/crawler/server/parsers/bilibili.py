# -*- coding: utf-8 -*-
"""B站解析：pagelist/playurl 官方接口 + 视频页元信息。"""

import json
import re
import urllib.parse

from .common import ParserError, find_url, http_headers, sanitize_filename

PAGE_LIST_API = "https://api.bilibili.com/x/player/pagelist"
PLAY_API = "https://api.bilibili.com/x/player/playurl"
SPI_API = "https://api.bilibili.com/x/frontend/finger/spi"

QUALITY = {
    127: "8K",
    126: "杜比视界",
    125: "HDR",
    120: "4K",
    116: "1080P60",
    112: "1080P+",
    100: "1080P",
    80: "720P",
    64: "480P",
    32: "360P",
    16: "240P",
}


def _get_json(session, url, params):
    url = url + "?" + urllib.parse.urlencode(params)
    data, _, _ = session.get_bytes(
        url, http_headers({
            "Referer": "https://www.bilibili.com/",
            "Cookie": session.cookie_str(),
        })
    )
    return json.loads(data.decode("utf-8", "ignore"))


def _warmup(session):
    """先访问首页与指纹接口，获取 buvid 等 Cookie，避免 412 反爬拦截。"""
    try:
        session.get_bytes("https://www.bilibili.com/", timeout=15)
    except Exception:
        pass
    try:
        data, _, _ = session.get_bytes(
            SPI_API, http_headers({"Referer": "https://www.bilibili.com/"}), timeout=15
        )
        info = (json.loads(data.decode("utf-8", "ignore")).get("data") or {})
        b3 = info.get("b_3") or ""
        b4 = info.get("b_4") or ""
        if b3 or b4:
            jar = session.cookie_str()
            session.headers["Cookie"] = "; ".join(
                filter(None, ["buvid3=%s" % b3, "buvid4=%s" % b4, jar])
            )
    except Exception:
        pass


def _page_meta(session, bvid):
    """从视频页提取标题 / 作者 / 封面。"""
    if not bvid:
        return "B站视频", "", ""
    try:
        html, _ = session.get_text(
            "https://www.bilibili.com/video/%s" % bvid,
            http_headers({"Referer": "https://www.bilibili.com/"}),
        )
    except Exception:
        html = ""
    title = author = cover = None
    m = re.search(r'property="og:title" content="([^"]*)"', html)
    if m:
        title = re.sub(r"_哔哩哔哩_bilibili$", "", m.group(1)).strip()
    m = re.search(r'"@type":"Person"[^}]*"name":"([^"]+)"', html)
    if m:
        author = m.group(1)
    if not author:
        m = re.search(r'"owner":\{"mid":\d+,"name":"([^"]+)"', html)
        if m:
            author = m.group(1)
    m = re.search(r'"videoData":\{.*?"pic":"([^"]+)"', html, re.S)
    if m:
        cover = m.group(1).replace("\\u002F", "/").replace("\\/", "/")
    if not cover:
        m = re.search(r'property="og:image" content="([^"]*)"', html)
        if m:
            cover = m.group(1)
    return title or "B站视频", author or "", cover or ""


def extract_id(text):
    url = find_url(text) or ""
    m = re.search(r"BV[0-9A-Za-z]{10}", url)
    if m:
        return {"bvid": m.group(0)}
    m = re.search(r"(?:av|aid=)(\d+)", url, re.I)
    if m:
        return {"aid": int(m.group(1))}
    return None


def _fmt(fmt_id, label, url, note="", ext="mp4"):
    return {
        "id": fmt_id,
        "label": label,
        "url": url,
        "note": note,
        "ext": ext,
        "headers": {"Referer": "https://www.bilibili.com/"},
    }


def parse(text, session):
    vid = extract_id(text)
    if not vid:
        raise ParserError("未识别到B站视频链接，请粘贴 https://www.bilibili.com/video/BVxxxx 格式的链接")

    _warmup(session)

    pl = _get_json(session, PAGE_LIST_API, vid)
    if pl.get("code") != 0:
        raise ParserError(pl.get("message") or "B站接口返回异常")
    items = pl.get("data") or []
    if not items:
        raise ParserError("未获取到视频信息，请检查链接是否正确")
    first = items[0]
    cid = first.get("cid")
    if not cid:
        raise ParserError("未获取到视频信息，请检查链接是否正确")
    duration = int(first.get("duration") or 0)
    note = "多P视频，当前解析第1P（共%dP）" % len(items) if len(items) > 1 else ""

    bvid = vid.get("bvid") or ""
    title, author, cover = _page_meta(session, bvid)

    formats = []

    # 优先 MP4 直出
    mp4 = _get_json(
        session, PLAY_API,
        dict(vid, cid=cid, fnval=1, fnver=0, fourk=1),
    )
    if mp4.get("code") == 0 and (mp4.get("data") or {}).get("durl"):
        durl = mp4["data"]["durl"]
        q = int(mp4["data"].get("quality") or 64)
        qlabel = QUALITY.get(q, "%dP" % q)
        if len(durl) == 1:
            formats.append(_fmt("mp4", qlabel + " MP4直出", durl[0].get("url") or ""))
        else:
            formats.append(
                _fmt("mp4", qlabel + " MP4（分段1/共%d）" % len(durl),
                     durl[0].get("url") or "", note="该清晰度为多段MP4，建议选用下方视频流")
            )

    # DASH 流（视频 + 音频）
    dash = _get_json(
        session, PLAY_API,
        dict(vid, cid=cid, fnval=16, fnver=0, fourk=1),
    )
    if dash.get("code") == 0:
        dd = (dash.get("data") or {}).get("dash") or {}
        videos = sorted(dd.get("video") or [], key=lambda x: int(x.get("id", 0)), reverse=True)
        audios = sorted(dd.get("audio") or [], key=lambda x: int(x.get("bandwidth", 0)), reverse=True)
        if videos:
            v = videos[0]
            url = v.get("baseUrl") or (v.get("backupUrl") or [None])[0]
            if url:
                q = int(v.get("id", 0))
                qlabel = QUALITY.get(q, "%dP" % q)
                formats.append(
                    _fmt("video", qlabel + " 视频流（需合并音频）", url,
                         note="无声音，请同时下载下方音频流后用剪映/ffmpeg 合并")
                )
        if audios:
            a = audios[0]
            url = a.get("baseUrl") or (a.get("backupUrl") or [None])[0]
            if url:
                formats.append(
                    _fmt("audio", "音频流（%dkbps）" % (int(a.get("bandwidth", 0)) // 1000),
                         url, note="需与视频流合并", ext="m4a")
                )

    if not formats:
        raise ParserError("未获取到可下载的清晰度（该视频可能需要登录才能下载）")

    return {
        "platform": "bilibili",
        "title": title,
        "author": author,
        "cover": cover,
        "duration": duration,
        "note": note,
        "formats": formats,
        "cover_headers": {"Referer": "https://www.bilibili.com/"},
        "default_filename": sanitize_filename(title, "mp4"),
    }
