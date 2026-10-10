"""时间处理工具 - UTC 存储 + 北京时间展示。

后端统一存储 UTC 时间，接口返回 ISO 8601 带 +08:00 时区标识。
前端接收后通过 parseBeijingTime 统一解析为北京时间展示。
"""

from datetime import datetime, timezone, timedelta

from app.core.config import get_settings

BEIJING_TZ = timezone(timedelta(hours=8))


def _get_tz_offset() -> timedelta:
    """从 APP_TIMEZONE 配置解析时区偏移量（目前支持 Asia/Shanghai → +8h）。"""
    tz_name = get_settings().app_timezone
    if tz_name == "Asia/Shanghai":
        return timedelta(hours=8)
    return timedelta(hours=8)


def _get_tz() -> timezone:
    """获取配置的时区对象。"""
    return timezone(_get_tz_offset())


def utc_iso(dt: datetime | None) -> str:
    """将 datetime 转换为 ISO 8601 带 Z 后缀的 UTC 字符串。"""
    if dt is None:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def now_utc_iso() -> str:
    """当前 UTC 时间的 ISO 8601 带 Z 后缀字符串。"""
    return utc_iso(datetime.now(timezone.utc))


def beijing_iso(dt: datetime | None) -> str:
    """将 datetime 转换为带 +08:00 时区偏移的 ISO 8601 字符串。

    无时区信息的 datetime 视为 UTC，None 返回空字符串。
    例：UTC 2026-09-08T02:00:00 → "2026-09-08T10:00:00+08:00"
    """
    if dt is None:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    tz = _get_tz()
    bj = dt.astimezone(tz)
    offset_seconds = int(tz.utcoffset(None).total_seconds())
    sign = "+" if offset_seconds >= 0 else "-"
    offset_hours = abs(offset_seconds) // 3600
    offset_minutes = (abs(offset_seconds) % 3600) // 60
    return f"{bj.strftime('%Y-%m-%dT%H:%M:%S')}{sign}{offset_hours:02d}:{offset_minutes:02d}"


def now_beijing() -> datetime:
    """返回当前北京时间 datetime 对象（带时区信息）。"""
    return datetime.now(_get_tz())


def today_start_utc() -> datetime:
    """计算北京时间今日 0:00:00 对应的 UTC 时间。

    用于统计查询"今日新增"的 created_at >= 条件。
    例：北京时间 2026-09-08 00:00:00 → UTC 2026-09-07T16:00:00Z
    """
    bj_now = now_beijing()
    bj_today_midnight = bj_now.replace(hour=0, minute=0, second=0, microsecond=0)
    return bj_today_midnight.astimezone(timezone.utc)


def beijing_range_to_utc_start(bj_date: datetime) -> datetime:
    """将指定北京时间日期的 0:00:00 转换为 UTC 时间。

    用于按日归档与自定义时间范围查询。
    """
    if bj_date.tzinfo is None:
        bj_date = bj_date.replace(tzinfo=_get_tz())
    bj_midnight = bj_date.replace(hour=0, minute=0, second=0, microsecond=0)
    return bj_midnight.astimezone(timezone.utc)


def format_beijing(dt: datetime | None) -> str:
    """将 datetime 转换为北京时间字符串（YYYY-MM-DD HH:MM:SS）。"""
    if dt is None:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(_get_tz()).strftime("%Y-%m-%d %H:%M:%S")
