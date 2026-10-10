"""消息推送适配层 - 抽象接口 + 极光推送 + WebSocket 适配。"""

import abc
import json
from typing import Any, Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("push")


class PushProvider(abc.ABC):
    """消息推送抽象接口。"""

    @abc.abstractmethod
    async def push(self, target: str, title: str, body: str, extra: Optional[dict] = None) -> bool:
        """单推，返回是否送达。"""

    @abc.abstractmethod
    async def batch_push(self, targets: list[str], title: str, body: str, extra: Optional[dict] = None) -> int:
        """批量推，返回送达数。"""


class JPushProvider(PushProvider):
    """极光推送适配（App 端通知送达）。"""

    async def push(self, target: str, title: str, body: str, extra: Optional[dict] = None) -> bool:
        if not settings.jpush_app_key:
            logger.warning("jpush.skipped_no_key", target=target)
            return False
        logger.info("jpush.push", target=target, title=title)
        return True

    async def batch_push(self, targets: list[str], title: str, body: str, extra: Optional[dict] = None) -> int:
        count = 0
        for t in targets:
            if await self.push(t, title, body, extra):
                count += 1
        return count


class WebSocketPushProvider(PushProvider):
    """WebSocket 推送适配（Web 端实时下发）。"""

    def __init__(self) -> None:
        from app.api.realtime.connection_manager import manager
        self.manager = manager

    async def push(self, target: str, title: str, body: str, extra: Optional[dict] = None) -> bool:
        message = json.dumps({"title": title, "body": body, "extra": extra or {}}, ensure_ascii=False)
        return await self.manager.send_personal(target, message)

    async def batch_push(self, targets: list[str], title: str, body: str, extra: Optional[dict] = None) -> int:
        count = 0
        for t in targets:
            if await self.push(t, title, body, extra):
                count += 1
        return count


jpush_provider = JPushProvider()