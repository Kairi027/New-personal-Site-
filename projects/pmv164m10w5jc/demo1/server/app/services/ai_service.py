"""AI 智能体服务 - 会话管理、流式对话、降级。

MongoDB 可用时优先使用 MongoDB，否则降级到 SQLite。
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.core.exceptions import AIError
from app.core.logging import get_logger
from app.core.mongo import get_mongo
from app.adapters.ai_adapter import ai_provider
from app.models.ai_chat import AISession, AIMessage

logger = get_logger("ai_service")

SYSTEM_PROMPT = (
    "你是本地生活助手，可以帮用户解答社区活动、闲置交易、本地出行、天气等方面的问题。"
    "请用简体中文友好、简洁地回答。"
)


def _use_mongo() -> bool:
    return get_mongo() is not None


def _sessions_col():
    return get_mongo()["ai_sessions"]


def _messages_col():
    return get_mongo()["ai_messages"]


async def create_session(user_id: str, title: str = "新对话") -> dict:
    session_id = uuid.uuid4().hex
    if _use_mongo():
        await _sessions_col().insert_one({
            "session_id": session_id,
            "user_id": user_id,
            "title": title,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
    else:
        async with async_session_factory() as db:
            db.add(AISession(session_id=session_id, user_id=user_id, title=title))
            await db.commit()
    return {"session_id": session_id}


async def list_sessions(user_id: str) -> list[dict]:
    if _use_mongo():
        cursor = _sessions_col().find({"user_id": user_id}).sort("updated_at", -1)
        return [doc async for doc in cursor]
    else:
        async with async_session_factory() as db:
            result = await db.execute(
                select(AISession).where(AISession.user_id == user_id).order_by(AISession.updated_at.desc())
            )
            return [
                {"session_id": s.session_id, "user_id": s.user_id, "title": s.title,
                 "created_at": s.created_at, "updated_at": s.updated_at}
                for s in result.scalars().all()
            ]


async def get_history(session_id: str, user_id: str) -> list[dict]:
    if _use_mongo():
        cursor = _messages_col().find({"session_id": session_id}).sort("created_at", 1)
        return [doc async for doc in cursor]
    else:
        async with async_session_factory() as db:
            result = await db.execute(
                select(AIMessage).where(AIMessage.session_id == session_id).order_by(AIMessage.created_at.asc())
            )
            return [
                {"msg_id": m.msg_id, "session_id": m.session_id, "role": m.role,
                 "content": m.content, "created_at": m.created_at}
                for m in result.scalars().all()
            ]


async def chat(session_id: str, user_id: str, content: str) -> dict:
    messages = await _build_messages(session_id, content)
    result = await ai_provider.chat(messages)
    await _save_message(session_id, user_id, "user", content)
    await _save_message(session_id, user_id, "assistant", result.get("content", ""))
    return result


async def chat_stream(session_id: str, user_id: str, content: str):
    messages = await _build_messages(session_id, content)
    await _save_message(session_id, user_id, "user", content)

    full_response = []
    try:
        async for chunk in ai_provider.chat_stream(messages):
            full_response.append(chunk)
            yield chunk
    except Exception as e:
        logger.error("ai.stream_failed", error=str(e))
        yield "AI 服务暂时不可用，请稍后重试。"

    await _save_message(session_id, user_id, "assistant", "".join(full_response))


async def delete_session(session_id: str, user_id: str) -> dict:
    if _use_mongo():
        await _sessions_col().delete_one({"session_id": session_id, "user_id": user_id})
        await _messages_col().delete_many({"session_id": session_id})
    else:
        async with async_session_factory() as db:
            await db.execute(delete(AISession).where(AISession.session_id == session_id, AISession.user_id == user_id))
            await db.execute(delete(AIMessage).where(AIMessage.session_id == session_id))
            await db.commit()
    return {"deleted": True}


async def _build_messages(session_id: str, content: str) -> list[dict]:
    history = await get_history(session_id, "")
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history[-10:]:
        role = msg.get("role", "user")
        c = msg.get("content", "")
        if role and c:
            messages.append({"role": role, "content": c})
    messages.append({"role": "user", "content": content})
    return messages


async def _save_message(session_id: str, user_id: str, role: str, content: str) -> None:
    now = datetime.now(timezone.utc)
    if _use_mongo():
        await _messages_col().insert_one({
            "msg_id": uuid.uuid4().hex,
            "session_id": session_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "created_at": now,
        })
        await _sessions_col().update_one(
            {"session_id": session_id},
            {"$set": {"updated_at": now}},
        )
    else:
        async with async_session_factory() as db:
            db.add(AIMessage(
                msg_id=uuid.uuid4().hex,
                session_id=session_id,
                user_id=user_id,
                role=role,
                content=content,
            ))
            await db.commit()
