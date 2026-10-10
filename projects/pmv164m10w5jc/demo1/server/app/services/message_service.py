"""私信会话服务 - MongoDB 优先，SQLite 降级。"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.core.exceptions import CommunityError
from app.core.mongo import get_mongo
from app.core.logging import get_logger
from app.models.chat import MessageSession, Message
from app.models.user import User

logger = get_logger("message_service")


def _use_mongo() -> bool:
    return get_mongo() is not None


def _sessions_col():
    return get_mongo()["message_sessions"]


def _messages_col():
    return get_mongo()["messages"]


async def _get_target_name(db: AsyncSession, target_user_id: str) -> str:
    """查询对方用户名，失败返回'未知用户'。"""
    user = await db.scalar(select(User).where(User.user_id == target_user_id))
    if user and user.nickname:
        return user.nickname
    logger.warning("message.target_user_not_found", target_user_id=target_user_id)
    return "未知用户"


async def create_session(user_a: str, user_b: str) -> dict:
    if user_a == user_b:
        raise CommunityError(101, "不能与自己发起私聊", http_status=400)
    participants = sorted([user_a, user_b])
    if _use_mongo():
        existing = await _sessions_col().find_one({"participants": participants})
        if existing:
            return {"session_id": existing["session_id"], "created": False}
        session_id = uuid.uuid4().hex
        await _sessions_col().insert_one({
            "session_id": session_id,
            "participants": participants,
            "created_at": datetime.now(timezone.utc),
            "last_message": None,
            "last_time": None,
        })
        return {"session_id": session_id, "created": True}
    else:
        async with async_session_factory() as db:
            result = await db.execute(
                select(MessageSession).where(MessageSession.participants == participants)
            )
            existing = result.scalar_one_or_none()
            if existing:
                return {"session_id": existing.session_id, "created": False}
            session_id = uuid.uuid4().hex
            db.add(MessageSession(
                session_id=session_id,
                participants=participants,
            ))
            await db.commit()
            return {"session_id": session_id, "created": True}


async def list_sessions(user_id: str) -> list[dict]:
    if _use_mongo():
        cursor = _sessions_col().find({"participants": user_id}).sort("last_time", -1)
        return [doc async for doc in cursor]
    else:
        async with async_session_factory() as db:
            result = await db.execute(
                select(MessageSession).where(MessageSession.participants.contains(user_id)).order_by(MessageSession.updated_at.desc())
            )
            sessions = result.scalars().all()
            items = []
            for s in sessions:
                target_user_id = s.participants[0] if s.participants[1] == user_id else s.participants[1]
                target_name = await _get_target_name(db, target_user_id)
                items.append({
                    "session_id": s.session_id,
                    "participants": s.participants,
                    "target_user_id": target_user_id,
                    "target_name": target_name,
                    "last_message": s.last_message,
                    "last_time": s.last_time,
                    "created_at": s.created_at,
                })
            return items


async def get_messages(session_id: str, user_id: str, page: int = 1, page_size: int = 50) -> dict:
    if _use_mongo():
        skip = (page - 1) * page_size
        cursor = (
            _messages_col()
            .find({"session_id": session_id})
            .sort("created_at", -1)
            .skip(skip)
            .limit(page_size)
        )
        items = [doc async for doc in cursor]
        items.reverse()
        return {"items": items, "page": page, "page_size": page_size}
    else:
        async with async_session_factory() as db:
            sess = await db.scalar(select(MessageSession).where(MessageSession.session_id == session_id))
            if not sess:
                raise CommunityError(201, "会话不存在", http_status=404)
            if user_id not in sess.participants:
                raise CommunityError(301, "无权查看该会话", http_status=403)
            if len(sess.participants) != 2:
                logger.error("message.session_participants_abnormal", session_id=session_id, participants=sess.participants)
                raise CommunityError(500, "会话数据异常，请联系管理员", http_status=500)

            target_user_id = sess.participants[0] if sess.participants[1] == user_id else sess.participants[1]
            target_name = await _get_target_name(db, target_user_id)

            clear_map = sess.clear_map or {}
            clear_at = clear_map.get(user_id)

            query = select(Message).where(Message.session_id == session_id)
            if clear_at:
                query = query.where(Message.created_at > clear_at)
            query = query.order_by(Message.created_at.desc())

            total_result = await db.execute(select(Message).where(Message.session_id == session_id))
            total_count = len(total_result.scalars().all())

            offset = (page - 1) * page_size
            result = await db.execute(query.offset(offset).limit(page_size))
            items = [
                {"msg_id": m.msg_id, "session_id": m.session_id, "sender_id": m.sender_id,
                 "content": m.content, "msg_type": m.msg_type, "created_at": m.created_at}
                for m in result.scalars().all()
            ]
            items.reverse()
            return {
                "items": items,
                "page": page,
                "page_size": page_size,
                "clear_at": clear_at,
                "session": {
                    "session_id": session_id,
                    "participants": sess.participants,
                    "target_user_id": target_user_id,
                    "target_name": target_name,
                },
            }


async def clear_session_messages(session_id: str, user_id: str) -> dict:
    """本端清空聊天记录：设置 clear_map[user_id] 为当前 UTC 时间。"""
    clear_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    if _use_mongo():
        await _sessions_col().update_one(
            {"session_id": session_id},
            {"$set": {f"clear_map.{user_id}": clear_at}},
        )
        logger.info("message.cleared", session_id=session_id, operator_id=user_id, clear_at=clear_at)
        return {"session_id": session_id, "clear_at": clear_at}
    else:
        async with async_session_factory() as db:
            sess = await db.scalar(select(MessageSession).where(MessageSession.session_id == session_id))
            if not sess:
                raise CommunityError(201, "会话不存在", http_status=404)
            if user_id not in sess.participants:
                raise CommunityError(301, "无权操作该会话", http_status=403)
            clear_map = sess.clear_map or {}
            clear_map[user_id] = clear_at
            sess.clear_map = clear_map
            await db.commit()
            logger.info("message.cleared", session_id=session_id, operator_id=user_id, clear_at=clear_at)
            return {"session_id": session_id, "clear_at": clear_at}


async def send_message(session_id: str, sender_id: str, content: str, msg_type: str = "text") -> dict:
    now = datetime.now(timezone.utc)
    now_str = now.isoformat()
    msg_id = uuid.uuid4().hex
    if _use_mongo():
        msg = {
            "msg_id": msg_id,
            "session_id": session_id,
            "sender_id": sender_id,
            "content": content,
            "msg_type": msg_type,
            "created_at": now,
        }
        await _messages_col().insert_one(msg)
        await _sessions_col().update_one(
            {"session_id": session_id},
            {"$set": {"last_message": content, "last_time": now}},
        )
        return {"msg_id": msg_id, "created_at": now_str}
    else:
        async with async_session_factory() as db:
            db.add(Message(
                msg_id=msg_id,
                session_id=session_id,
                sender_id=sender_id,
                content=content,
                msg_type=msg_type,
            ))
            sess = await db.scalar(select(MessageSession).where(MessageSession.session_id == session_id))
            if sess:
                sess.last_message = content
                sess.last_time = now_str
            await db.commit()
            return {"msg_id": msg_id, "created_at": now_str}
