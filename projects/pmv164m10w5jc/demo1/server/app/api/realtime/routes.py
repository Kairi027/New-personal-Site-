"""WebSocket 实时路由 - 私信聊天 / 导航。"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.api.realtime.connection_manager import manager
from app.core.logging import get_logger
from app.core.security import decode_token

logger = get_logger("ws.router")

router = APIRouter()


async def _authenticate(ws: WebSocket) -> str | None:
    """从 query 参数 token 中解析 user_id。"""
    token = ws.query_params.get("token")
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") == "user":
            return payload["sub"]
    except Exception:
        return None
    return None


@router.websocket("/ws/chat")
async def ws_chat(ws: WebSocket):
    user_id = await _authenticate(ws)
    if not user_id:
        await ws.close(code=4401)
        return
    await manager.connect(user_id, ws)
    try:
        while True:
            data = await ws.receive_json()
            target = data.get("to")
            body = data.get("body", "")
            if target:
                import json
                msg = json.dumps({"from": user_id, "body": body, "type": "chat"}, ensure_ascii=False)
                await manager.send_personal(target, msg)
    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)


@router.websocket("/ws/navi")
async def ws_navi(ws: WebSocket):
    user_id = await _authenticate(ws)
    if not user_id:
        await ws.close(code=4401)
        return
    await manager.connect(user_id, ws)
    try:
        while True:
            data = await ws.receive_json()
            logger.info("ws.navi.recv", user_id=user_id, action=data.get("action"))
    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)