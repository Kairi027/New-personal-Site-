"""统一推送服务 - 按目标端类型路由到极光或 WebSocket，离线累计未读数。"""

import json
from typing import Optional

from app.core.deps import get_redis
from app.core.logging import get_logger
from app.adapters.push_adapter import jpush_provider, WebSocketPushProvider

logger = get_logger("push_service")

ws_provider = WebSocketPushProvider()


async def push_to_user(
    user_id: str,
    title: str,
    body: str,
    *,
    channel: str = "auto",
    extra: Optional[dict] = None,
) -> None:
    """向指定用户推送消息。

    channel:
      - auto: 优先 WebSocket 在线推送，离线则极光推送 + 累计未读
      - ws: 仅 WebSocket
      - jpush: 仅极光推送
    """
    from app.api.realtime.connection_manager import manager

    delivered = False
    if channel in ("auto", "ws"):
        if manager.is_online(user_id):
            delivered = await ws_provider.push(user_id, title, body, extra)

    if not delivered and channel in ("auto", "jpush"):
        await jpush_provider.push(user_id, title, body, extra)

    if not delivered:
        await _increment_unread(user_id, extra or {})


async def _increment_unread(user_id: str, extra: dict) -> None:
    """离线用户累计未读消息数。"""
    redis = get_redis()
    scope = extra.get("scope", "default")
    key = f"unread:{scope}:{user_id}"
    await redis.incr(key)


async def get_unread(user_id: str, scope: str = "default") -> int:
    redis = get_redis()
    val = await redis.get(f"unread:{scope}:{user_id}")
    return int(val) if val else 0


async def clear_unread(user_id: str, scope: str = "default") -> None:
    redis = get_redis()
    await redis.delete(f"unread:{scope}:{user_id}")