"""闲置交易服务 - 商品发布、检索、下单、支付、发货、收货、退款。"""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import TradeError
from app.core.logging import get_logger
from app.core.time_utils import utc_iso, now_utc_iso
from app.models.trade import Order, Product, ProductAuditLog
from app.models.user import User
from app.schemas.trade import ProductCreate, OrderStatus

logger = get_logger("trade_service")

_STATUS_LABEL_MAP = {
    "pending": "已提交，待审核",
    "on_sale": "在售",
    "locked": "已锁定",
    "sold": "已售罄",
    "off_shelf": "已下架",
    "rejected": "未通过审核",
    "violated": "内容违规",
}


def _status_label(status: str) -> str:
    return _STATUS_LABEL_MAP.get(status, status)


async def _lock_stock(db: AsyncSession, product_id: str) -> bool:
    """锁定1个库存名额（下单时调用）：locked_count+=1，stock 不变。"""
    result = await db.execute(
        update(Product)
        .where(Product.product_id == product_id, Product.status == "on_sale", Product.stock > 0)
        .values(locked_count=Product.locked_count + 1)
    )
    return result.rowcount == 1


async def _unlock_stock(db: AsyncSession, product_id: str) -> bool:
    """释放1个锁定名额（取消时调用）：locked_count-=1，stock 不变。"""
    result = await db.execute(
        update(Product)
        .where(Product.product_id == product_id, Product.locked_count > 0)
        .values(locked_count=Product.locked_count - 1)
    )
    return result.rowcount == 1


async def _deduct_stock(db: AsyncSession, product_id: str) -> bool:
    """锁定转扣减（支付时调用）：stock-=1, locked_count-=1，售罄状态同步。"""
    result = await db.execute(
        update(Product)
        .where(Product.product_id == product_id, Product.locked_count > 0)
        .values(
            stock=Product.stock - 1,
            locked_count=Product.locked_count - 1,
            status=case(
                (Product.stock - 1 == 0, "sold"),
                else_=Product.status,
            ),
        )
    )
    return result.rowcount == 1


async def _restore_stock(db: AsyncSession, product_id: str) -> bool:
    """恢复库存（退款时调用）：stock+=1，sold→on_sale 状态恢复。"""
    result = await db.execute(
        update(Product)
        .where(Product.product_id == product_id)
        .values(
            stock=Product.stock + 1,
            status=case(
                (Product.status == "sold", "on_sale"),
                else_=Product.status,
            ),
        )
    )
    return result.rowcount == 1


async def _check_product_on_sale(db: AsyncSession, product_id: str) -> None:
    """支付前实时校验商品在售状态（禁止缓存）。"""
    product = await db.scalar(select(Product).where(Product.product_id == product_id))
    if not product:
        raise TradeError(103, "商品不存在", http_status=404)
    if product.status in ("off_shelf", "violated"):
        raise TradeError(201, "商品已下架", http_status=409)
    if product.status in ("pending", "rejected", "sold", "locked"):
        raise TradeError(201, "商品不可购买", http_status=409)


async def create_product(db: AsyncSession, seller_id: str, data: ProductCreate) -> dict:
    """发布商品：校验 + 敏感词过滤 + 持久化。"""
    from app.services.censor_service import censor_text

    violation = await censor_text(data.title + (data.description or "") + (data.contact or ""))
    if violation:
        raise TradeError(2, f"商品信息违规：{violation}", http_status=400)

    product = Product(
        product_id=uuid.uuid4().hex,
        seller_id=seller_id,
        category_id=data.category_id,
        title=data.title,
        description=data.description,
        price_cents=int(data.price * 100),
        image_urls=data.image_urls,
        contact=data.contact,
        status="pending",
        stock=data.stock,
        locked_count=0,
        total_stock=data.stock,
    )
    db.add(product)
    await db.flush()
    return {"product_id": product.product_id}


async def search_products(
    db: AsyncSession, keyword: str = "", category_id: str = "", page: int = 1, page_size: int = 20
) -> dict:
    """商品检索 - 走 ES 全文检索（降级走 MySQL like）。"""
    query = select(Product).where(Product.is_deleted == False, Product.status == "on_sale")
    if keyword:
        query = query.where(Product.title.contains(keyword))
    if category_id:
        query = query.where(Product.category_id == category_id)
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = [
        {
            "product_id": p.product_id,
            "seller_id": p.seller_id,
            "title": p.title,
            "description": p.description,
            "price": p.price_cents / 100,
            "image_urls": p.image_urls or [],
            "status": p.status,
            "stock": p.stock,
            "locked_count": p.locked_count or 0,
            "total_stock": p.total_stock or 0,
            "created_at": p.created_at,
        }
        for p in result.scalars().all()
    ]
    return {"items": items, "page": page, "page_size": page_size}


async def get_product_detail(db: AsyncSession, product_id: str, current_user_id: str | None = None) -> dict:
    """商品详情。"""
    product = await db.scalar(select(Product).where(Product.product_id == product_id, Product.is_deleted == False))
    is_trashed = False
    if not product and current_user_id:
        product = await db.scalar(select(Product).where(Product.product_id == product_id, Product.is_deleted == True, Product.purge_mark == False, Product.seller_id == current_user_id))
        if product:
            is_trashed = True
    if not product:
        raise TradeError(101, "商品不存在", http_status=404)
    seller = await db.scalar(select(User).where(User.user_id == product.seller_id))
    is_owner = (current_user_id is not None and product.seller_id == current_user_id)
    order_button_visible = (product.status == "on_sale" and not is_owner)
    audit_log = await db.scalar(
        select(ProductAuditLog).where(
            ProductAuditLog.product_id == product.product_id,
            ProductAuditLog.action == "takedown",
        ).order_by(ProductAuditLog.created_at.desc())
    )
    return {
        "product_id": product.product_id,
        "seller_id": product.seller_id,
        "seller_name": seller.nickname if seller else "",
        "title": product.title,
        "description": product.description,
        "price": product.price_cents / 100,
        "price_cents": product.price_cents,
        "image_urls": product.image_urls or [],
        "contact": product.contact if product.status != "off_shelf" else None,
        "status": product.status,
        "status_label": _status_label(product.status),
        "is_owner": is_owner,
        "order_button_visible": order_button_visible,
        "stock": product.stock,
        "locked_count": product.locked_count or 0,
        "total_stock": product.total_stock or 0,
        "created_at": product.created_at,
        "takedown_reason": audit_log.reason if audit_log else "",
        "is_trashed": is_trashed,
    }


async def list_my_products(
    db: AsyncSession, seller_id: str, page: int = 1, page_size: int = 20, include_deleted: bool = False
) -> dict:
    """我发布的商品列表（始终过滤已彻底删除的商品）。"""
    offset = (page - 1) * page_size
    filters = [Product.seller_id == seller_id, Product.purge_mark == False]
    if not include_deleted:
        filters.append(Product.is_deleted == False)
    query = (
        select(Product)
        .where(*filters)
        .order_by(Product.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    rows = result.scalars().all()
    items = []
    for p in rows:
        audit_log = await db.scalar(
            select(ProductAuditLog).where(
                ProductAuditLog.product_id == p.product_id,
                ProductAuditLog.action == "takedown",
            ).order_by(ProductAuditLog.created_at.desc())
        )
        items.append({
            "product_id": p.product_id,
            "title": p.title,
            "description": p.description,
            "price": p.price_cents / 100,
            "image_urls": p.image_urls or [],
            "contact": p.contact,
            "status": p.status,
            "status_label": _status_label(p.status),
            "stock": p.stock,
            "locked_count": p.locked_count or 0,
            "total_stock": p.total_stock or 0,
            "is_deleted": p.is_deleted,
            "created_at": p.created_at,
            "takedown_reason": audit_log.reason if audit_log else "",
        })
    total = await db.scalar(select(func.count()).select_from(Product).where(*filters))
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def delete_product(db: AsyncSession, seller_id: str, product_id: str) -> dict:
    """废弃商品（软删除+discard_time，进入回收站）。"""
    product = await db.scalar(select(Product).where(Product.product_id == product_id))
    if not product:
        raise TradeError(101, "商品不存在", http_status=404)
    if product.seller_id != seller_id:
        raise TradeError(301, "无权操作该商品", http_status=403)
    if product.purge_mark:
        raise TradeError(201, "商品已彻底删除，无法操作", http_status=409)
    product.is_deleted = True
    product.discard_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    await db.flush()
    return {"product_id": product_id, "discarded": True, "discard_time": product.discard_time}


async def list_trash_products(
    db: AsyncSession, seller_id: str, page: int = 1, page_size: int = 20
) -> dict:
    """回收站列表：已废弃且未彻底删除的商品。"""
    offset = (page - 1) * page_size
    filters = [Product.seller_id == seller_id, Product.is_deleted == True, Product.purge_mark == False]
    query = (
        select(Product)
        .where(*filters)
        .order_by(Product.discard_time.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    rows = result.scalars().all()
    items = []
    for p in rows:
        items.append({
            "product_id": p.product_id,
            "title": p.title,
            "description": p.description,
            "price": p.price_cents / 100,
            "image_urls": p.image_urls or [],
            "contact": p.contact,
            "status": p.status,
            "status_label": _status_label(p.status),
            "stock": p.stock,
            "locked_count": p.locked_count or 0,
            "total_stock": p.total_stock or 0,
            "discard_time": p.discard_time,
            "created_at": p.created_at,
        })
    total = await db.scalar(select(func.count()).select_from(Product).where(*filters))
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def purge_product(db: AsyncSession, seller_id: str, product_id: str) -> dict:
    """彻底删除商品（终态标记，不物理删除）。"""
    product = await db.scalar(select(Product).where(Product.product_id == product_id))
    if not product:
        raise TradeError(101, "商品不存在", http_status=404)
    if product.seller_id != seller_id:
        raise TradeError(301, "无权操作该商品", http_status=403)
    if not product.is_deleted:
        raise TradeError(201, "仅已废弃商品可彻底删除", http_status=404)
    if product.purge_mark:
        raise TradeError(201, "商品已彻底删除", http_status=409)
    product.purge_mark = True
    await db.flush()
    return {"product_id": product_id, "purged": True}


async def off_shelf_product(db: AsyncSession, seller_id: str, product_id: str) -> dict:
    """商户下架商品：on_sale → off_shelf。"""
    product = await db.scalar(select(Product).where(Product.product_id == product_id, Product.is_deleted == False))
    if not product:
        raise TradeError(101, "商品不存在", http_status=404)
    if product.seller_id != seller_id:
        raise TradeError(301, "无权操作该商品", http_status=403)
    if product.status != "on_sale":
        raise TradeError(201, "仅在售商品可下架", http_status=409)
    product.status = "off_shelf"
    await db.flush()
    return {"product_id": product_id, "status": "off_shelf"}


async def on_shelf_product(db: AsyncSession, seller_id: str, product_id: str) -> dict:
    """商户上架商品：off_shelf → on_sale（无需审核，需stock>0）。"""
    product = await db.scalar(select(Product).where(Product.product_id == product_id, Product.is_deleted == False))
    if not product:
        raise TradeError(101, "商品不存在", http_status=404)
    if product.seller_id != seller_id:
        raise TradeError(301, "无权操作该商品", http_status=403)
    if product.status == "violated":
        raise TradeError(206, "平台下架商品需编辑重发后经审核才能上架", http_status=409)
    if product.status == "rejected":
        raise TradeError(201, "商品未通过审核，请编辑重发后重新提交", http_status=409)
    if product.status != "off_shelf":
        raise TradeError(201, "仅已下架商品可上架", http_status=409)
    if product.stock <= 0:
        raise TradeError(202, "库存为0，无法上架", http_status=409)
    product.status = "on_sale"
    await db.flush()
    return {"product_id": product_id, "status": "on_sale"}


async def republish_product(db: AsyncSession, seller_id: str, product_id: str, data: dict) -> dict:
    """编辑后重新发布商品（废弃商品可编辑重发）。"""
    from app.services.censor_service import censor_text

    product = await db.scalar(select(Product).where(Product.product_id == product_id))
    if not product:
        raise TradeError(101, "商品不存在", http_status=404)
    if product.seller_id != seller_id:
        raise TradeError(301, "无权操作该商品", http_status=403)
    if product.purge_mark:
        raise TradeError(201, "商品已彻底删除，无法编辑", http_status=409)
    if product.status == "locked":
        raise TradeError(201, "商品已被锁定，无法编辑", http_status=409)
    if product.status == "pending" and not product.is_deleted:
        raise TradeError(201, "商品审核中，无法编辑", http_status=409)
    if (product.locked_count or 0) > 0:
        raise TradeError(201, "商品有进行中订单，无法编辑", http_status=409)
    if product.status == "violated":
        old_fields = {
            "title": product.title, "description": product.description,
            "price": product.price_cents, "image_urls": product.image_urls,
            "contact": product.contact, "stock": product.total_stock,
        }
        new_fields = {
            "title": data.get("title", ""), "description": data.get("description"),
            "price": int(data.get("price", 0) * 100), "image_urls": data.get("image_urls", []),
            "contact": data.get("contact"), "stock": data.get("stock", 1),
        }
        if old_fields == new_fields:
            raise TradeError(7, "请修改商品信息后重新提交", http_status=400)

    violation = await censor_text(
        data.get("title", "") + (data.get("description") or "") + (data.get("contact") or "")
    )
    if violation:
        raise TradeError(2, f"商品信息违规：{violation}", http_status=400)

    new_stock = data.get("stock", 1)
    product.title = data["title"]
    product.description = data.get("description")
    product.price_cents = int(data["price"] * 100)
    product.image_urls = data.get("image_urls", [])
    product.contact = data.get("contact")
    product.status = "pending"
    product.stock = new_stock
    product.locked_count = 0
    product.total_stock = new_stock
    product.is_deleted = False
    product.discard_time = None
    product.last_edit_at = datetime.now(timezone.utc)
    product.republish_count = (product.republish_count or 0) + 1
    await db.flush()
    return {"product_id": product_id, "status": "pending"}


async def create_order(db: AsyncSession, buyer_id: str, product_id: str) -> dict:
    """下单：自购校验 + 商品状态校验 + 库存锁定。"""
    product = await db.scalar(select(Product).where(Product.product_id == product_id, Product.is_deleted == False))
    if not product:
        raise TradeError(103, "商品不存在", http_status=404)
    if product.seller_id == buyer_id:
        raise TradeError(102, "不可购买自己的商品", http_status=400)
    if product.status != "on_sale":
        raise TradeError(101, "商品已被下单或下架", http_status=409)
    if product.stock <= 0:
        raise TradeError(101, "商品已售罄，无法下单", http_status=409)

    locked = await _lock_stock(db, product_id)
    if not locked:
        raise TradeError(101, "商品已售罄，无法下单", http_status=409)
    order = Order(
        order_id=uuid.uuid4().hex,
        buyer_id=buyer_id,
        seller_id=product.seller_id,
        product_id=product_id,
        amount_cents=product.price_cents,
        status=OrderStatus.PENDING_PAY.value,
        stock_mode="lock",
    )
    db.add(order)
    await db.flush()
    return {"order_id": order.order_id, "amount": order.amount_cents / 100, "created_at": utc_iso(order.created_at)}


async def pay_order(db: AsyncSession, order_id: str, buyer_id: str, channel: str = "wechat") -> dict:
    """发起支付。"""
    order = await _get_order(db, order_id)
    if order.buyer_id != buyer_id:
        raise TradeError(301, "身份校验失败", http_status=403)
    if order.status != OrderStatus.PENDING_PAY.value:
        raise TradeError(201, "订单状态非法，不可支付", http_status=409)
    await _check_product_on_sale(db, order.product_id)

    from app.adapters.payment_adapter import get_payment
    provider = get_payment(channel)
    result = await provider.create_pay(order_id, order.amount_cents, "闲置交易订单")
    order.pay_channel = channel
    await db.flush()
    return result


async def handle_pay_notify(db: AsyncSession, order_id: str, idempotent_key: str) -> dict:
    """支付回调：幂等 + 状态流转 + 锁定转扣减。"""
    order = await _get_order(db, order_id)
    if order.status != OrderStatus.PENDING_PAY.value:
        return {"result": "ignored", "status": order.status}
    order.status = OrderStatus.PAID.value
    order.pay_time = now_utc_iso()
    if order.stock_mode == "lock":
        await _deduct_stock(db, order.product_id)
    await db.flush()
    return {"result": "success", "status": order.status}


async def ship_order(db: AsyncSession, order_id: str, seller_id: str) -> dict:
    """卖家确认发货。"""
    order = await _get_order(db, order_id)
    if order.seller_id != seller_id:
        raise TradeError(301, "身份校验失败", http_status=403)
    if order.status != OrderStatus.PAID.value:
        raise TradeError(302, "订单状态非法，不可发货", http_status=409)
    order.status = OrderStatus.SHIPPED.value
    order.ship_time = now_utc_iso()
    await db.flush()
    return {"status": order.status}


async def receive_order(db: AsyncSession, order_id: str, buyer_id: str) -> dict:
    """买家确认收货 + 资金结算。"""
    order = await _get_order(db, order_id)
    if order.buyer_id != buyer_id:
        raise TradeError(301, "身份校验失败", http_status=403)
    if order.status != OrderStatus.SHIPPED.value:
        raise TradeError(302, "订单状态非法，不可确认收货", http_status=409)
    order.status = OrderStatus.COMPLETED.value
    order.complete_time = now_utc_iso()

    await db.flush()
    return {"status": order.status}


async def refund_order(db: AsyncSession, order_id: str, buyer_id: str) -> dict:
    """买家申请退款。"""
    order = await _get_order(db, order_id)
    if order.buyer_id != buyer_id:
        raise TradeError(301, "身份校验失败", http_status=403)
    if order.status not in (OrderStatus.PAID.value, OrderStatus.SHIPPED.value):
        raise TradeError(302, "订单状态非法，不可退款", http_status=409)
    order.status = OrderStatus.REFUNDING.value
    await db.flush()
    return {"status": order.status}


async def refund_apply(db: AsyncSession, order_id: str, buyer_id: str, reason: str = "") -> dict:
    """买家申请退款：paid/shipped → refunding。"""
    order = await _get_order(db, order_id)
    if order.buyer_id != buyer_id:
        raise TradeError(301, "身份校验失败", http_status=403)
    if order.status not in ("paid", "shipped"):
        raise TradeError(302, "订单状态非法，不可退款", http_status=409)
    order.pre_refund_status = order.status
    order.status = "refunding"
    order.refund_apply_time = now_utc_iso()
    order.refund_reason = reason
    await db.flush()
    return {"status": "refunding"}


async def refund_agree(db: AsyncSession, order_id: str, seller_id: str) -> dict:
    """卖家同意退款：refunding → refunded（2秒异步）。"""
    order = await _get_order(db, order_id)
    if order.seller_id != seller_id:
        raise TradeError(301, "身份校验失败", http_status=403)
    if order.status != "refunding":
        raise TradeError(302, "订单状态非法", http_status=409)
    order.refund_processing = True
    await db.flush()
    asyncio.create_task(_delayed_refund_complete(order_id))
    return {"status": "refunding", "message": "退款处理中"}


async def _delayed_refund_complete(order_id: str) -> None:
    """2秒后异步完成退款。"""
    await asyncio.sleep(2)
    from app.core.database import async_session_factory
    async with async_session_factory() as session:
        try:
            order = await session.scalar(select(Order).where(Order.order_id == order_id))
            if order and order.status == "refunding":
                order.status = "refunded"
                order.refund_time = now_utc_iso()
                order.refund_processing = False
                await _restore_stock(session, order.product_id)
                await session.commit()
        except Exception as e:
            await session.rollback()
            logger.exception("delayed refund complete failed: %s", e)


async def refund_reject(db: AsyncSession, order_id: str, seller_id: str, reason: str = "") -> dict:
    """卖家拒绝退款：refunding → 恢复原状态。"""
    order = await _get_order(db, order_id)
    if order.seller_id != seller_id:
        raise TradeError(301, "身份校验失败", http_status=403)
    if order.status != "refunding":
        raise TradeError(302, "订单状态非法", http_status=409)
    order.status = order.pre_refund_status or "paid"
    order.refund_reject_reason = reason
    order.refund_reject_time = now_utc_iso()
    order.refund_processing = False
    await db.flush()
    return {"status": order.status}


async def cancel_expired_order(db: AsyncSession, order_id: str) -> dict:
    """取消订单 + 释放库存（锁定模式释放锁定，扣减模式恢复库存）。"""
    order = await _get_order(db, order_id)
    if order.status != OrderStatus.PENDING_PAY.value:
        raise TradeError(201, "订单状态非法，不可取消", http_status=409)
    order.status = OrderStatus.CANCELED.value
    order.cancel_time = now_utc_iso()
    if order.stock_mode == "lock":
        await _unlock_stock(db, order.product_id)
    else:
        await db.execute(
            update(Product)
            .where(Product.product_id == order.product_id)
            .values(
                stock=Product.stock + 1,
                status=case((Product.status == "sold", "on_sale"), else_=Product.status)
            )
        )
    await db.flush()
    return {"status": order.status}


async def _get_order(db: AsyncSession, order_id: str) -> Order:
    order = await db.scalar(select(Order).where(Order.order_id == order_id))
    if not order:
        raise TradeError(103, "订单不存在", http_status=404)
    return order


_ORDER_STATUS_LABELS = {
    "pending_pay": "待支付", "paid": "已支付", "shipped": "已发货",
    "completed": "已完成", "canceled": "已取消", "refunding": "退款中", "refunded": "已退款",
}

_ORDER_STATUS_LABELS_SELLER = {
    "refunding": "待退款",
}


def _order_status_label(status: str, role: str = "buyer") -> str:
    if role == "seller" and status in _ORDER_STATUS_LABELS_SELLER:
        return _ORDER_STATUS_LABELS_SELLER[status]
    return _ORDER_STATUS_LABELS.get(status, status)

_BUYER_ACTIONS = {
    "pending_pay": ["cancel", "pay"], "paid": ["refund"], "shipped": ["confirm", "refund"],
}
_SELLER_ACTIONS = {
    "paid": ["ship"],
}


async def list_orders(db: AsyncSession, user_id: str, page: int = 1, page_size: int = 20,
                      keyword: str = "", status: str = "", order_no: str = "", role: str = "") -> dict:
    from app.services.order_scheduler import lazy_check_timeout
    await lazy_check_timeout(db)
    role_filter = (Order.buyer_id == user_id) | (Order.seller_id == user_id)
    if role == "buyer":
        role_filter = Order.buyer_id == user_id
    elif role == "seller":
        role_filter = Order.seller_id == user_id
    query = select(Order, Product.title, Product.image_urls, User.nickname).join(
        Product, Order.product_id == Product.product_id, isouter=True
    ).join(
        User, Order.seller_id == User.user_id, isouter=True
    ).where(role_filter)
    if status:
        query = query.where(Order.status == status)
    if order_no:
        query = query.where(Order.order_id == order_no)
    if keyword:
        query = query.where(Product.title.contains(keyword))
    total = await db.scalar(select(func.count()).select_from(Order).where(role_filter))
    result = await db.execute(query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    items = []
    for o, ptitle, pimg, sname in result.all():
        role = "buyer" if o.buyer_id == user_id else "seller"
        items.append({
            "order_id": o.order_id, "product_id": o.product_id, "product_title": ptitle or "",
            "product_image": (pimg or [None])[0] if pimg else None,
            "amount": o.amount_cents / 100, "status": o.status,
            "status_label": _order_status_label(o.status, role),
            "role": role, "counterpart_name": sname or "",
            "created_at": utc_iso(o.created_at),
        })
    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


async def get_order_detail(db: AsyncSession, order_id: str, user_id: str) -> dict:
    from app.services.order_scheduler import lazy_check_timeout
    await lazy_check_timeout(db, order_id)
    order = await _get_order(db, order_id)
    if order.buyer_id != user_id and order.seller_id != user_id:
        raise TradeError(301, "无权查看该订单", http_status=403)
    role = "buyer" if order.buyer_id == user_id else "seller"
    product = await db.scalar(select(Product).where(Product.product_id == order.product_id))
    buyer = await db.scalar(select(User).where(User.user_id == order.buyer_id))
    seller = await db.scalar(select(User).where(User.user_id == order.seller_id))
    actions = _BUYER_ACTIONS.get(order.status, []) if role == "buyer" else _SELLER_ACTIONS.get(order.status, [])
    counterpart_name = (seller.nickname if seller else "") if role == "buyer" else (buyer.nickname if buyer else "")
    pay_channel_labels = {"wechat": "微信支付", "alipay": "支付宝", "apple_pay": "Apple Pay", "google_pay": "Google Pay"}
    return {
        "order_id": order.order_id, "role": role, "actions": actions,
        "status": order.status, "status_label": _order_status_label(order.status, role),
        "counterpart_name": counterpart_name, "amount": order.amount_cents / 100,
        "product": {
            "product_id": order.product_id, "title": product.title if product else "",
            "image": (product.image_urls or [None])[0] if product and product.image_urls else None,
            "price": product.price_cents / 100 if product else 0,
        },
        "payment": {
            "pay_channel": order.pay_channel or "",
            "pay_channel_label": pay_channel_labels.get(order.pay_channel or "", "待支付"),
            "pay_time": order.pay_time or "",
        },
        "logistics": {
            "logistics_no": order.logistics_no or "", "logistics_company": order.logistics_company or "",
            "ship_time": order.ship_time or "", "complete_time": order.complete_time or "",
        },
        "cancel": {"cancel_time": order.cancel_time or "", "cancel_reason": order.cancel_reason or ""},
        "refund": {
            "refund_time": order.refund_time or "",
            "refund_reason": order.refund_reason or "",
            "refund_apply_time": order.refund_apply_time or "",
            "refund_reject_reason": order.refund_reject_reason or "",
            "refund_reject_time": order.refund_reject_time or "",
            "refund_processing": order.refund_processing,
        },
        "created_at": utc_iso(order.created_at),
    }