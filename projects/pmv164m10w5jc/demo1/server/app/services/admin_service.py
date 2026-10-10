"""管理后台业务服务 - 用户管理、内容审核、商品审核、订单管理、统计、配置、审计。"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AdminError, not_found
from app.core.logging import get_logger
from app.models.admin import Announcement, SystemConfig
from app.models.community import Post, Comment, Section
from app.models.sensitive_word import SensitiveWord
from app.models.trade import Category, Order, Product, ProductAuditLog
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.trade import OrderStatus

logger = get_logger("admin_service")


# ===== 用户管理 =====
async def list_users(db: AsyncSession, page: int = 1, page_size: int = 20, keyword: str = "", status: str = "") -> dict:
    query = select(User)
    if keyword:
        query = query.where((User.account.contains(keyword)) | (User.nickname.contains(keyword)))
    if status:
        query = query.where(User.status == status)
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    items = [_user_dict(u) for u in result.scalars().all()]
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def get_user_detail(db: AsyncSession, user_id: str) -> dict:
    user = await _get_user(db, user_id)
    return _user_dict(user)


async def update_user_status(db: AsyncSession, user_id: str, status: str) -> dict:
    user = await _get_user(db, user_id)
    user.status = status
    await db.flush()
    return {"user_id": user_id, "status": status}


# ===== 内容审核 =====
async def list_posts(db: AsyncSession, page: int = 1, page_size: int = 20) -> dict:
    query = select(Post, User.nickname).join(User, Post.author_id == User.user_id).where(Post.is_deleted == False)
    total = await db.scalar(select(func.count()).select_from(Post).where(Post.is_deleted == False))
    result = await db.execute(query.order_by(Post.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    items = [{"post_id": p.post_id, "title": p.title, "author_name": n, "section_id": p.section_id, "status": p.status, "created_at": p.created_at} for p, n in result.all()]
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def list_pending_posts(db: AsyncSession, page: int = 1, page_size: int = 20) -> dict:
    query = select(Post, User.nickname).join(User, Post.author_id == User.user_id).where(Post.is_deleted == False, Post.status == "pending")
    total = await db.scalar(select(func.count()).select_from(Post).where(Post.is_deleted == False, Post.status == "pending"))
    result = await db.execute(query.order_by(Post.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    items = [{"post_id": p.post_id, "title": p.title, "content": p.content, "author_name": n, "section_id": p.section_id, "status": p.status, "created_at": p.created_at} for p, n in result.all()]
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def list_products(db: AsyncSession, page: int = 1, page_size: int = 20, status: str = "") -> dict:
    query = select(Product, User.nickname).join(User, Product.seller_id == User.user_id, isouter=True).where(Product.is_deleted == False, Product.purge_mark == False)
    count_query = select(func.count()).select_from(Product).where(Product.is_deleted == False, Product.purge_mark == False)
    if status == "on_sale":
        query = query.where(Product.status.in_(["on_sale", "locked"]))
        count_query = count_query.where(Product.status.in_(["on_sale", "locked"]))
    elif status:
        query = query.where(Product.status == status)
        count_query = count_query.where(Product.status == status)
    total = await db.scalar(count_query)
    result = await db.execute(query.order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    display_status_map = {"on_sale": "在售（未售罃）", "locked": "在售（未售罃）", "sold": "已售罃", "pending": "待审核", "rejected": "审核拒绝", "violated": "平台下架", "off_shelf": "商户下架"}
    items = [{"product_id": p.product_id, "title": p.title, "seller_name": n or "", "price": p.price_cents / 100, "status": p.status, "display_status": display_status_map.get(p.status, p.status), "stock": p.stock, "is_deleted": p.is_deleted, "created_at": p.created_at} for p, n in result.all()]
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def audit_post(db: AsyncSession, post_id: str, action: str, admin_id: str = "", reason: str | None = None) -> dict:
    post = await db.scalar(select(Post).where(Post.post_id == post_id))
    if not post:
        raise AdminError(1, "帖子不存在", http_status=404)
    # 前置状态校验
    if action in ("approve", "reject") and post.status != "pending":
        raise AdminError(6, "该帖子已审核", http_status=409)
    if action == "takedown" and post.status != "published":
        raise AdminError(6, "仅已发布帖子可下架", http_status=409)
    status_map = {"approve": "published", "reject": "rejected", "takedown": "violated"}
    new_status = status_map.get(action)
    if not new_status:
        raise AdminError(7, "无效的审核操作", http_status=400)
    post.status = new_status
    # 写入审核流水
    from app.models.community import PostAuditLog
    log = PostAuditLog(
        log_id=uuid.uuid4().hex,
        post_id=post_id,
        admin_id=admin_id,
        action=action,
        reason=reason,
    )
    db.add(log)
    await db.flush()
    return {"post_id": post_id, "status": new_status, "reason": reason}


async def delete_comment(db: AsyncSession, comment_id: str) -> dict:
    comment = await db.scalar(select(Comment).where(Comment.comment_id == comment_id))
    if not comment:
        raise AdminError(2, "评论不存在", http_status=404)
    comment.is_deleted = True
    await db.flush()
    return {"deleted": True}


# ===== 商品审核 =====
async def audit_product(db: AsyncSession, product_id: str, action: str, reason: str | None = None) -> dict:
    product = await db.scalar(select(Product).where(Product.product_id == product_id))
    if not product:
        raise AdminError(3, "商品不存在", http_status=404)
    if product.is_deleted:
        raise AdminError(6, "商品已废弃，无法审核", http_status=409)
    if product.purge_mark:
        raise AdminError(6, "商品已彻底删除，无法审核", http_status=409)
    if action in ("approve", "reject") and product.status != "pending":
        raise AdminError(6, "该商品已审核", http_status=409)
    if action == "takedown" and product.status not in ("on_sale", "locked"):
        raise AdminError(6, "仅在售商品可下架", http_status=409)
    status_map = {"approve": "on_sale", "reject": "rejected", "takedown": "violated"}
    new_status = status_map.get(action)
    if not new_status:
        raise AdminError(7, "无效的审核操作", http_status=400)
    product.status = new_status
    audit_log = ProductAuditLog(
        log_id=uuid.uuid4().hex,
        product_id=product_id,
        admin_id="",
        action=action,
        reason=reason,
    )
    db.add(audit_log)
    await db.flush()
    return {"product_id": product_id, "status": new_status, "reason": reason}


async def create_category(db: AsyncSession, name: str, parent_id: str | None = None) -> dict:
    cat = Category(category_id=uuid.uuid4().hex, name=name, parent_id=parent_id)
    db.add(cat)
    await db.flush()
    return {"category_id": cat.category_id}


# ===== 订单管理 =====
async def list_orders(db: AsyncSession, page: int = 1, page_size: int = 20, status: str = "") -> dict:
    from app.models.trade import Product
    query = select(Order, Product.title).outerjoin(Product, Order.product_id == Product.product_id)
    count_query = select(func.count()).select_from(Order)
    if status:
        query = query.where(Order.status == status)
        count_query = count_query.where(Order.status == status)
    total = await db.scalar(count_query)
    result = await db.execute(query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    items = []
    for o, ptitle in result.all():
        if not ptitle:
            logger.warning("order %s product %s title not found", o.order_id, o.product_id)
        items.append(_order_dict(o, ptitle or "未知商品"))
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def audit_refund(db: AsyncSession, order_id: str, action: str, reason: str | None = None) -> dict:
    order = await db.scalar(select(Order).where(Order.order_id == order_id))
    if not order:
        raise AdminError(4, "订单不存在", http_status=404)
    if order.status != OrderStatus.REFUNDING.value:
        raise AdminError(5, "订单非退款中状态", http_status=409)
    if action == "approve":
        order.status = OrderStatus.REFUNDED.value
        # 触发支付退款
        from app.adapters.payment_adapter import get_payment
        provider = get_payment(order.pay_channel or "wechat")
        await provider.refund(order_id, order.amount_cents, reason or "")
    else:
        order.status = OrderStatus.COMPLETED.value
    await db.flush()
    return {"order_id": order_id, "status": order.status}


# ===== 数据统计 =====
async def dashboard_stats(db: AsyncSession) -> dict:
    from app.core.time_utils import today_start_utc
    today_start = today_start_utc()
    user_count = await db.scalar(select(func.count()).select_from(User))
    post_count = await db.scalar(select(func.count()).select_from(Post).where(Post.is_deleted == False))
    product_count = await db.scalar(select(func.count()).select_from(Product).where(Product.is_deleted == False, Product.status == "on_sale"))
    order_count = await db.scalar(select(func.count()).select_from(Order))
    pending_post = await db.scalar(select(func.count()).select_from(Post).where(Post.status == "published"))
    pending_refund = await db.scalar(select(func.count()).select_from(Order).where(Order.status == OrderStatus.REFUNDING.value))
    today_post_count = await db.scalar(select(func.count()).select_from(Post).where(Post.status == "published", Post.is_deleted == False, Post.created_at >= today_start))
    today_user_count = await db.scalar(select(func.count()).select_from(User).where(User.created_at >= today_start))
    today_product_count = await db.scalar(select(func.count()).select_from(Product).where(Product.is_deleted == False, Product.status == "on_sale", Product.created_at >= today_start))
    today_order_count = await db.scalar(select(func.count()).select_from(Order).where(Order.created_at >= today_start))
    return {
        "user_count": user_count or 0,
        "post_count": post_count or 0,
        "product_count": product_count or 0,
        "order_count": order_count or 0,
        "pending_post": pending_post or 0,
        "pending_refund": pending_refund or 0,
        "today_post_count": today_post_count or 0,
        "today_user_count": today_user_count or 0,
        "today_product_count": today_product_count or 0,
        "today_order_count": today_order_count or 0,
    }


# ===== 运营配置 =====
async def list_sections(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Section).order_by(Section.sort_order))
    return [{"section_id": s.section_id, "name": s.name, "description": s.description, "sort_order": s.sort_order} for s in result.scalars().all()]


async def create_section(db: AsyncSession, name: str, description: str | None = None, sort_order: int = 0) -> dict:
    section = Section(section_id=uuid.uuid4().hex, name=name, description=description, sort_order=sort_order)
    db.add(section)
    await db.flush()
    return {"section_id": section.section_id}


async def list_sensitive_words(db: AsyncSession, page: int = 1, page_size: int = 50) -> dict:
    total = await db.scalar(select(func.count()).select_from(SensitiveWord).where(SensitiveWord.is_deleted == False))
    result = await db.execute(
        select(SensitiveWord).where(SensitiveWord.is_deleted == False).offset((page - 1) * page_size).limit(page_size)
    )
    items = [{"id": w.id, "word": w.word, "category": w.category} for w in result.scalars().all()]
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def add_sensitive_word(db: AsyncSession, word: str, category: str | None = None) -> dict:
    sw = SensitiveWord(word=word, category=category)
    db.add(sw)
    await db.flush()
    # 刷新 DFA
    from app.utils.sensitive_dfa import refresh_dfa_from_db
    await refresh_dfa_from_db()
    return {"id": sw.id}


async def get_configs(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(SystemConfig))
    return [{"key": c.config_key, "value": c.config_value, "description": c.description} for c in result.scalars().all()]


async def update_config(db: AsyncSession, key: str, value: str) -> dict:
    config = await db.scalar(select(SystemConfig).where(SystemConfig.config_key == key))
    if config:
        config.config_value = value
    else:
        db.add(SystemConfig(config_key=key, config_value=value))
    await db.flush()
    return {"key": key, "value": value}


# ===== 推送与审计 =====
async def create_announcement(db: AsyncSession, title: str, content: str, scope: str = "all", target_user_ids: list[str] | None = None) -> dict:
    ann = Announcement(
        announce_id=uuid.uuid4().hex,
        title=title,
        content=content,
        scope=scope,
        target_user_ids=target_user_ids,
    )
    db.add(ann)
    await db.flush()
    # 推送通知
    from app.services.push_service import push_to_user
    if scope == "all":
        pass  # TODO: 全量推送
    elif scope == "targeted" and target_user_ids:
        for uid in target_user_ids:
            await push_to_user(uid, title, content, extra={"scope": "announcement"})
    return {"announce_id": ann.announce_id}


async def list_audit_logs(db: AsyncSession, page: int = 1, page_size: int = 50, operator_id: str = "", action: str = "") -> dict:
    query = select(AuditLog)
    if operator_id:
        query = query.where(AuditLog.operator_id == operator_id)
    if action:
        query = query.where(AuditLog.action == action)
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    items = [
        {
            "id": log.id,
            "operator_id": log.operator_id,
            "operator_type": log.operator_type,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "content": log.content,
            "ip": log.ip,
            "trace_id": log.trace_id,
            "created_at": log.created_at,
        }
        for log in result.scalars().all()
    ]
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


# ===== 内部工具 =====
async def _get_user(db: AsyncSession, user_id: str) -> User:
    user = await db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise not_found("用户不存在")
    return user


def _user_dict(u: User) -> dict:
    return {
        "user_id": u.user_id,
        "account": u.account,
        "nickname": u.nickname,
        "avatar_url": u.avatar_url,
        "bio": u.bio,
        "status": u.status,
        "register_time": u.register_time,
        "created_at": u.created_at,
    }


def _order_dict(o: Order, product_title: str = "") -> dict:
    return {
        "order_id": o.order_id,
        "buyer_id": o.buyer_id,
        "seller_id": o.seller_id,
        "product_id": o.product_id,
        "product_title": product_title,
        "amount": o.amount_cents / 100,
        "status": o.status,
        "pay_channel": o.pay_channel,
        "created_at": o.created_at,
    }