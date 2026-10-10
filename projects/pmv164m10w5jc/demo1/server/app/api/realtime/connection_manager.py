"""WebSocket 连接管理器 - 管理在线用户的 WebSocket 连接。"""

from typing import Any

from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger("ws")


class ConnectionManager:
    """管理用户 WebSocket 连接，支持按 user_id 维度多端在线。"""

    def __init__(self) -> None:
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.active.setdefault(user_id, []).append(ws)
        logger.info("ws.connect", user_id=user_id, count=len(self.active[user_id]))

    def disconnect(self, user_id: str, ws: WebSocket) -> None:
        conns = self.active.get(user_id)
        if conns:
            if ws in conns:
                conns.remove(ws)
            if not conns:
                del self.active[user_id]
            logger.info("ws.disconnect", user_id=user_id, remaining=len(conns))

    async def send_personal(self, user_id: str, message: str) -> bool:
        conns = self.active.get(user_id, [])
        delivered = 0
        for ws in conns:
            try:
                await ws.send_text(message)
                delivered += 1
            except Exception as e:
                logger.warning("ws.send_failed", user_id=user_id, error=str(e))
        return delivered > 0

    async def broadcast(self, message: str) -> None:
        for user_id, conns in self.active.items():
            for ws in conns:
                try:
                    await ws.send_text(message)
                except Exception:
                    pass

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active and len(self.active[user_id]) > 0


manager = ConnectionManager()