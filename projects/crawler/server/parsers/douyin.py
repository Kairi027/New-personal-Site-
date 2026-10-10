# -*- coding: utf-8 -*-
"""抖音解析：分享页取 Cookie/webId -> 调 web detail 接口 -> 提取无水印播放地址。"""

import json
import random
import re
import string
import urllib.parse
import urllib.request

from .common import ParserError, BROWSER_UA, find_url, pick_url, sanitize_filename

MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
)
DETAIL_API = "https://www.douyin.com/aweme/v1/web/aweme/detail/"


def _extract_aweme_id(url, session):
    """跟随跳转，拿到最终视频页 URL 中的作品 ID。"""
    final = url
    try:
        resp = session.request(url, {"Referer": "https://www.douyin.com/"}, timeout=20)
        final = resp.geturl()
        resp.close()
    except Exception:
        pass
    m = re.search(r"(?:/video/|/note/|modal_id=)(\d+)", final)
    if not m:
        raise ParserError("未识别到抖音视频ID，请确认链接有效")
    return m.group(1)


def _prepare(session, aweme_id):
    """访问分享页获取 ttwid Cookie 与 webId。"""
    webid = ""
    try:
        data, _, _ = session.get_bytes(
            "https://www.iesdouyin.com/share/video/%s/" % aweme_id,
            {"User-Agent": MOBILE_UA, "Referer": "https://www.iesdouyin.com/"},
            timeout=20,
        )
        html = data.decode("utf-8", "ignore")
        m = re.search(r'"webId":"(\d+)"', html)
        if m:
            webid = m.group(1)
    except Exception:
        pass
    if not any(c.name == "ttwid" for c in session.cj):
        # 备用：通过 ttwid 注册接口获取
        try:
            body = json.dumps({
                "region": "cn", "aid": 1768, "needFid": False,
                "service": "www.ixigua.com",
                "migrate_info": {"ticket": "", "source": "node"},
                "cbUrlProtocol": "https", "union": True,
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://ttwid.bytedance.com/ttwid/union/register/",
                data=body,
                headers={"User-Agent": BROWSER_UA, "Content-Type": "application/json"},
            )
            resp = session.opener.open(req, timeout=20)
            info = json.loads(resp.read().decode("utf-8", "ignore"))
            redirect = info.get("redirect_url")
            if redirect:
                session.get_bytes(redirect, timeout=20)
        except Exception:
            pass
    ms = "".join(random.choices(string.ascii_letters + string.digits, k=146))
    return webid, ms


def _detail(session, aweme_id, webid, ms):
    params = {
        "aweme_id": aweme_id,
        "device_platform": "webapp",
        "aid": "6383",
        "channel": "channel_pc_web",
        "pc_client_type": "1",
        "version_code": "170400",
        "version_name": "17.4.0",
        "cookie_enabled": "true",
        "screen_width": "1536",
        "screen_height": "864",
        "browser_language": "zh-CN",
        "browser_platform": "Win32",
        "browser_name": "Chrome",
        "browser_version": "126.0.0.0",
        "browser_online": "true",
        "engine_name": "Blink",
        "engine_version": "126.0.0.0",
        "os_name": "Windows",
        "os_version": "10",
        "platform": "PC",
        "downlink": "10",
        "effective_type": "4g",
        "round_trip_time": "50",
    }
    if webid:
        params["webid"] = webid
    url = DETAIL_API + "?" + urllib.parse.urlencode(params)
    cookie = session.cookie_str() + "; msToken=" + ms
    data, _, _ = session.get_bytes(
        url,
        {
            "User-Agent": BROWSER_UA,
            "Referer": "https://www.douyin.com/",
            "Cookie": cookie,
        },
        timeout=20,
    )
    return json.loads(data.decode("utf-8", "ignore"))


def parse(text, session):
    url = find_url(text)
    if not url:
        raise ParserError("未找到抖音链接")

    aweme_id = _extract_aweme_id(url, session)
    webid, ms = _prepare(session, aweme_id)
    try:
        payload = _detail(session, aweme_id, webid, ms)
    except Exception:
        raise ParserError("无法获取抖音视频数据，请稍后重试")
    aweme = payload.get("aweme_detail") or {}
    if not aweme:
        raise ParserError("解析失败：抖音接口返回异常，可能被风控拦截，请稍后再试")

    video = aweme.get("video") or {}
    play_addr = video.get("play_addr") or {}
    video_url = pick_url(play_addr.get("url_list"))
    if not video_url:
        video_url = pick_url((video.get("download_addr") or {}).get("url_list"))
    if not video_url:
        raise ParserError("未找到可下载的视频地址")

    title = (aweme.get("desc") or "").strip() or "抖音视频"
    author = (aweme.get("author") or {}).get("nickname", "")
    cover = pick_url((video.get("cover") or {}).get("url_list")) or ""
    duration_ms = int(aweme.get("duration") or video.get("duration") or 0)
    duration = duration_ms // 1000

    headers = {
        "User-Agent": BROWSER_UA,
        "Referer": "https://www.douyin.com/",
        "Cookie": session.cookie_str() + "; msToken=" + ms,
    }
    return {
        "platform": "douyin",
        "title": title,
        "author": author,
        "cover": cover,
        "duration": duration,
        "note": "无水印原视频，链接有时效，请尽快下载",
        "formats": [{
            "id": "video",
            "label": "无水印原视频",
            "url": video_url,
            "note": "链接有效期有限，请尽快下载",
            "ext": "mp4",
            "headers": headers,
        }],
        "cover_headers": {"Referer": "https://www.douyin.com/"},
        "default_filename": sanitize_filename(title, "mp4"),
    }
