"""社区文化服务 - 发帖、评论、点赞、私信。"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import CommunityError, not_found
from app.core.logging import get_logger
from app.models.community import Comment, Like, Post, Section
from app.models.user import User
from app.schemas.community import PostCreate, CommentCreate

logger = get_logger("community_service")


async def create_post(db: AsyncSession, author_id: str, data: PostCreate) -> dict:
    """发帖：敏感词过滤 + 内容审核 + 持久化。"""
    from app.services.censor_service import censor_text

    # 板块校验
    section = await db.scalar(select(Section).where(Section.section_id == data.section_id))
    if not section:
        raise CommunityError(101, "板块不存在", http_status=404)

    # 敏感词过滤
    violation = await censor_text(data.title + data.content)
    if violation:
        raise CommunityError(2, f"内容违规：{violation}", http_status=400)

    post = Post(
        post_id=uuid.uuid4().hex,
        author_id=author_id,
        section_id=data.section_id,
        title=data.title,
        content=data.content,
        image_urls=data.image_urls,
        status="pending",
    )
    db.add(post)
    await db.flush()
    return {"post_id": post.post_id, "status": post.status}


async def list_posts(
    db: AsyncSession, section_id: str | None, user_id: str | None, page: int = 1, page_size: int = 20
) -> dict:
    """帖子列表分页查询，聚合当前用户点赞状态（游客 user_id=None，section_id=None 查全部）。"""
    offset = (page - 1) * page_size
    base_filters = [Post.is_deleted == False, Post.status == "published"]
    if section_id:
        base_filters.insert(0, Post.section_id == section_id)
    query = (
        select(Post, User.nickname)
        .join(User, Post.author_id == User.user_id)
        .where(*base_filters)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    items = []
    for post, nickname in result.all():
        liked = False
        if user_id:
            liked = await db.scalar(
                select(Like).where(Like.user_id == user_id, Like.post_id == post.post_id)
            ) is not None
        items.append({
            "post_id": post.post_id,
            "author_id": post.author_id,
            "author_name": nickname,
            "section_id": post.section_id,
            "title": post.title,
            "content": post.content,
            "image_urls": post.image_urls or [],
            "like_count": post.like_count,
            "comment_count": post.comment_count,
            "liked": liked,
            "created_at": post.created_at,
        })
    total = await db.scalar(
        select(func.count()).select_from(Post).where(*base_filters)
    )
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def get_post_detail(db: AsyncSession, post_id: str, user_id: str | None) -> dict:
    post = await db.scalar(select(Post).where(Post.post_id == post_id, Post.is_deleted == False))
    if not post:
        raise CommunityError(201, "帖子不存在", http_status=404)
    author = await db.scalar(select(User).where(User.user_id == post.author_id))
    liked = False
    if user_id:
        liked = await db.scalar(
            select(Like).where(Like.user_id == user_id, Like.post_id == post_id)
        ) is not None
    return {
        "post_id": post.post_id,
        "author_id": post.author_id,
        "author_name": author.nickname if author else "",
        "section_id": post.section_id,
        "title": post.title,
        "content": post.content,
        "image_urls": post.image_urls or [],
        "like_count": post.like_count,
        "comment_count": post.comment_count,
        "liked": liked,
        "status": post.status,
        "created_at": post.created_at,
    }


async def create_comment(db: AsyncSession, post_id: str, author_id: str, data: CommentCreate) -> dict:
    from app.services.censor_service import censor_text

    post = await db.scalar(select(Post).where(Post.post_id == post_id, Post.is_deleted == False))
    if not post:
        raise CommunityError(201, "帖子不存在", http_status=404)
    if post.status != "published":
        raise CommunityError(202, "该帖子不可评论", http_status=400)

    violation = await censor_text(data.content)
    if violation:
        raise CommunityError(3, f"评论违规：{violation}", http_status=400)

    comment = Comment(
        comment_id=uuid.uuid4().hex,
        post_id=post_id,
        author_id=author_id,
        content=data.content,
        parent_id=None,
    )
    db.add(comment)
    await db.execute(
        update(Post).where(Post.post_id == post_id).values(comment_count=Post.comment_count + 1)
    )
    await db.flush()
    return {"comment_id": comment.comment_id, "parent_id": None}


async def list_comments(db: AsyncSession, post_id: str, page: int = 1, page_size: int = 50) -> dict:
    """评论列表 - 仅一级评论，按时间倒序。"""
    offset = (page - 1) * page_size
    total = await db.scalar(
        select(func.count()).select_from(Comment).where(
            Comment.post_id == post_id, Comment.is_deleted == False, Comment.parent_id.is_(None)
        )
    )
    result = await db.execute(
        select(Comment, User.nickname)
        .join(User, Comment.author_id == User.user_id)
        .where(Comment.post_id == post_id, Comment.is_deleted == False, Comment.parent_id.is_(None))
        .order_by(Comment.created_at.desc(), Comment.comment_id.asc())
        .offset(offset)
        .limit(page_size)
    )
    items = [
        {
            "comment_id": c.comment_id,
            "author_id": c.author_id,
            "author_name": nickname or "未知用户",
            "content": c.content,
            "parent_id": None,
            "created_at": c.created_at,
        }
        for c, nickname in result.all()
    ]
    return {"items": items, "total": total or 0}


async def delete_comment(db: AsyncSession, post_id: str, comment_id: str, user_id: str) -> dict:
    """删除评论（作者本人删除）。"""
    comment = await db.scalar(select(Comment).where(Comment.comment_id == comment_id))
    if not comment:
        raise CommunityError(203, "该评论不存在", http_status=404)
    if comment.author_id != user_id:
        raise CommunityError(301, "无权操作该评论", http_status=403)
    if comment.is_deleted:
        return {"comment_id": comment_id, "deleted": True}
    comment.is_deleted = True
    await db.execute(
        update(Post).where(Post.post_id == post_id).values(comment_count=Post.comment_count - 1)
    )
    await db.flush()
    return {"comment_id": comment_id, "deleted": True}


async def toggle_like(db: AsyncSession, post_id: str, user_id: str) -> dict:
    """点赞/取消点赞，唯一性校验。"""
    post = await db.scalar(select(Post).where(Post.post_id == post_id))
    if not post:
        raise CommunityError(201, "帖子不存在", http_status=404)

    existing = await db.scalar(select(Like).where(Like.user_id == user_id, Like.post_id == post_id))
    if existing:
        await db.delete(existing)
        await db.execute(
            update(Post).where(Post.post_id == post_id).values(like_count=Post.like_count - 1)
        )
        await db.flush()
        return {"liked": False, "like_count": post.like_count - 1}
    else:
        like = Like(like_id=uuid.uuid4().hex, user_id=user_id, post_id=post_id)
        db.add(like)
        await db.execute(
            update(Post).where(Post.post_id == post_id).values(like_count=Post.like_count + 1)
        )
        await db.flush()
        return {"liked": True, "like_count": post.like_count + 1}


async def get_my_page(db: AsyncSession, user_id: str) -> dict:
    """我的主页聚合：资料 + 发帖数 + 获赞数 + 评论数。"""
    from app.services.auth_service import get_profile

    profile = await get_profile(db, user_id)
    post_count = await db.scalar(
        select(func.count()).select_from(Post).where(
            Post.author_id == user_id, Post.is_deleted == False
        )
    )
    like_total = await db.scalar(
        select(func.coalesce(func.sum(Post.like_count), 0)).where(
            Post.author_id == user_id, Post.is_deleted == False
        )
    )
    comment_total = await db.scalar(
        select(func.coalesce(func.sum(Post.comment_count), 0)).where(
            Post.author_id == user_id, Post.is_deleted == False
        )
    )
    return {
        "profile": profile.model_dump(),
        "post_count": post_count or 0,
        "like_count": like_total or 0,
        "comment_count": comment_total or 0,
    }


_AUDIT_LABEL_MAP = {
    "pending": "审核中",
    "published": "",
    "rejected": "审核不通过，请查改内容后发布",
    "violated": "内容违规，请查改内容后发布",
    "draft": "草稿",
}


def _audit_label(status: str) -> str:
    return _AUDIT_LABEL_MAP.get(status, "")


async def list_my_posts(db: AsyncSession, author_id: str, page: int = 1, page_size: int = 20) -> dict:
    """我的帖子列表（含审核标识）。"""
    offset = (page - 1) * page_size
    query = (
        select(Post)
        .where(Post.author_id == author_id, Post.is_deleted == False)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    items = [
        {
            "post_id": p.post_id,
            "title": p.title,
            "content": p.content,
            "section_id": p.section_id,
            "status": p.status,
            "audit_label": _audit_label(p.status),
            "like_count": p.like_count,
            "comment_count": p.comment_count,
            "created_at": p.created_at,
        }
        for p in result.scalars().all()
    ]
    total = await db.scalar(
        select(func.count()).select_from(Post).where(
            Post.author_id == author_id, Post.is_deleted == False
        )
    )
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def delete_post(db: AsyncSession, author_id: str, post_id: str) -> dict:
    """删除帖子（软删除）。"""
    post = await db.scalar(select(Post).where(Post.post_id == post_id))
    if not post:
        raise CommunityError(201, "帖子不存在", http_status=404)
    if post.author_id != author_id:
        raise CommunityError(301, "无权操作该帖子", http_status=403)
    post.is_deleted = True
    await db.flush()
    return {"post_id": post_id, "deleted": True}


async def republish_post(db: AsyncSession, author_id: str, post_id: str, data: dict) -> dict:
    """编辑后重新发布帖子。"""
    from app.services.censor_service import censor_text

    post = await db.scalar(select(Post).where(Post.post_id == post_id))
    if not post:
        raise CommunityError(201, "帖子不存在", http_status=404)
    if post.author_id != author_id:
        raise CommunityError(301, "无权操作该帖子", http_status=403)
    if data.get("section_id") and data["section_id"] != post.section_id:
        raise CommunityError(101, "不允许跨板块重发", http_status=400)

    violation = await censor_text(data["title"] + data["content"])
    if violation:
        raise CommunityError(2, f"内容违规：{violation}", http_status=400)

    post.title = data["title"]
    post.content = data["content"]
    post.image_urls = data.get("image_urls", [])
    post.status = "pending"
    post.is_deleted = False
    post.last_edit_at = datetime.now(timezone.utc)
    post.republish_count = (post.republish_count or 0) + 1
    await db.flush()
    return {"post_id": post_id, "status": "pending"}