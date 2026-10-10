"""社区文化与私信 API 路由。"""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user, PageDep
from app.core.responses import success
from app.schemas.community import CommentCreate, MessageSend, PostCreate, SessionCreate
from app.services import community_service, message_service

router = APIRouter(prefix="/posts", tags=["社区"])
section_router = APIRouter(prefix="/sections", tags=["社区"])


@section_router.get("", summary="板块列表")
async def list_sections(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models.community import Section
    result = await db.execute(select(Section).order_by(Section.sort_order))
    items = [{"section_id": s.section_id, "name": s.name, "description": s.description} for s in result.scalars().all()]
    return success(items)


@router.post("", summary="发布帖子")
async def create_post(data: PostCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await community_service.create_post(db, user["user_id"], data)
    return success(result)


@router.get("/my", summary="我的帖子列表")
async def list_my_posts(page: PageDep, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await community_service.list_my_posts(db, user["user_id"], page.page, page.page_size)
    return success(result)


@router.get("", summary="帖子列表")
async def list_posts(page: PageDep, section_id: str = "", user: Optional[dict] = Depends(get_optional_user), db: AsyncSession = Depends(get_db)):
    uid = user["user_id"] if user else None
    result = await community_service.list_posts(db, section_id or None, uid, page.page, page.page_size)
    return success(result)


@router.get("/{post_id}", summary="帖子详情")
async def get_post(post_id: str, user: Optional[dict] = Depends(get_optional_user), db: AsyncSession = Depends(get_db)):
    uid = user["user_id"] if user else None
    result = await community_service.get_post_detail(db, post_id, uid)
    return success(result)


@router.post("/{post_id}/comments", summary="发表评论")
async def create_comment(post_id: str, data: CommentCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await community_service.create_comment(db, post_id, user["user_id"], data)
    return success(result)


@router.get("/{post_id}/comments", summary="评论列表")
async def list_comments(post_id: str, page: int = 1, page_size: int = 50, db: AsyncSession = Depends(get_db)):
    result = await community_service.list_comments(db, post_id, page, page_size)
    return success(result)


@router.delete("/{post_id}/comments/{comment_id}", summary="删除评论")
async def delete_comment(post_id: str, comment_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await community_service.delete_comment(db, post_id, comment_id, user["user_id"])
    return success(result)


@router.post("/{post_id}/like", summary="点赞")
async def like_post(post_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await community_service.toggle_like(db, post_id, user["user_id"])
    return success(result)


@router.delete("/{post_id}/like", summary="取消点赞")
async def unlike_post(post_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await community_service.toggle_like(db, post_id, user["user_id"])
    return success(result)


@router.delete("/{post_id}", summary="删除帖子")
async def delete_post(post_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await community_service.delete_post(db, user["user_id"], post_id)
    return success(result)


@router.put("/{post_id}/republish", summary="编辑重发帖子")
async def republish_post(post_id: str, data: PostCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await community_service.republish_post(db, user["user_id"], post_id, data.model_dump())
    return success(result)


# ===== 私信 =====
msg_router = APIRouter(prefix="/messages", tags=["私信"])


@msg_router.post("/sessions", summary="建立会话")
async def create_session(data: SessionCreate, user: dict = Depends(get_current_user)):
    result = await message_service.create_session(user["user_id"], data.target_user_id)
    return success(result)


@msg_router.get("/sessions", summary="会话列表")
async def list_sessions(user: dict = Depends(get_current_user)):
    result = await message_service.list_sessions(user["user_id"])
    return success(result)


@msg_router.get("/sessions/{session_id}", summary="历史消息")
async def get_messages(session_id: str, page: int = 1, page_size: int = 50, user: dict = Depends(get_current_user)):
    result = await message_service.get_messages(session_id, user["user_id"], page, page_size)
    return success(result)


@msg_router.post("/send", summary="发送消息")
async def send_message(data: MessageSend, user: dict = Depends(get_current_user)):
    result = await message_service.send_message(data.session_id, user["user_id"], data.content, data.msg_type)
    # 尝试在线推送
    from app.services.push_service import push_to_user
    await push_to_user(user["user_id"], "私信", data.content, extra={"scope": "chat", "session_id": data.session_id})
    return success(result)


@msg_router.post("/sessions/{session_id}/clear", summary="清空聊天记录（本端）")
async def clear_session(session_id: str, user: dict = Depends(get_current_user)):
    result = await message_service.clear_session_messages(session_id, user["user_id"])
    return success(result)


# ===== 我的主页 =====
page_router = APIRouter(prefix="/my", tags=["我的主页"])


@page_router.get("/page", summary="我的主页")
async def my_page(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await community_service.get_my_page(db, user["user_id"])
    return success(result)