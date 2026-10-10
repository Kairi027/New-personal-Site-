"""订单超时调度器 - asyncio 后台任务 + 懒超时检查。

20 分钟未支付的订单自动取消，商品状态恢复为在售。
"""

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.core.logging import get_logger
from app.models.trade import Order, Product
from app.core.time_utils import now_utc_iso

logger = get_logger("order_scheduler")

ORDER_TIMEOUT_SECONDS = 1200
SCAN_INTERVAL_SECONDS = 60
SYSTEM_OPERATOR = "system_scheduler"


async def cancel_expired_orders(db: AsyncSession) -> int:
    """批量取消超时未支付订单，返回取消数量。"""
    threshold = datetime.now(timezone.utc) - timedelta(seconds=ORDER_TIMEOUT_SECONDS)
    result = await db.execute(
        select(Order).where(Order.status == "pending_pay", Order.created_at < threshold)
    )
    expired_orders = result.scalars().all()
    if not expired_orders:
        return 0
    now_iso = now_utc_iso()
    for order in expired_orders:
        order.status = "canceled"
        order.cancel_time = now_iso
        order.cancel_reason = "超时未支付自动取消"
        if order.stock_mode == "lock":
            await db.execute(
                update(Product)
                .where(Product.product_id == order.product_id, Product.locked_count > 0)
                .values(locked_count=Product.locked_count - 1)
            )
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
    logger.info("order.expired_canceled", count=len(expired_orders))
    return len(expired_orders)


async def lazy_check_timeout(db: AsyncSession, order_id: str | None = None) -> None:
    """懒超时检查：查询前补偿性取消超时订单。"""
    threshold = datetime.now(timezone.utc) - timedelta(seconds=ORDER_TIMEOUT_SECONDS)
    query = select(Order).where(Order.status == "pending_pay", Order.created_at < threshold)
    if order_id:
        query = query.where(Order.order_id == order_id)
    result = await db.execute(query)
    expired_orders = result.scalars().all()
    if not expired_orders:
        return
    now_iso = now_utc_iso()
    for order in expired_orders:
        order.status = "canceled"
        order.cancel_time = now_iso
        order.cancel_reason = "超时未支付自动取消"
        if order.stock_mode == "lock":
            await db.execute(
                update(Product)
                .where(Product.product_id == order.product_id, Product.locked_count > 0)
                .values(locked_count=Product.locked_count - 1)
            )
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
    logger.info("order.lazy_timeout_canceled", count=len(expired_orders), order_id=order_id)


async def _timeout_scheduler_loop() -> None:
    """后台定时任务循环：每 60 秒扫描一次超时订单。"""
    logger.info("order_scheduler.started", interval=SCAN_INTERVAL_SECONDS, timeout=ORDER_TIMEOUT_SECONDS)
    while True:
        try:
            async with async_session_factory() as session:
                try:
                    count = await cancel_expired_orders(session)
                    await session.commit()
                    if count > 0:
                        logger.info("order_scheduler.scan_done", canceled=count)
                except Exception:
                    await session.rollback()
                    raise
        except Exception as e:
            logger.error("order_scheduler.scan_failed", error=str(e))
        await asyncio.sleep(SCAN_INTERVAL_SECONDS)


_scheduler_task: asyncio.Task | None = None


def start_order_timeout_scheduler() -> None:
    """启动订单超时定时任务（幂等，重复调用不会创建多个任务）。"""
    global _scheduler_task
    if _scheduler_task is not None and not _scheduler_task.done():
        return
    _scheduler_task = asyncio.create_task(_timeout_scheduler_loop())


def stop_order_timeout_scheduler() -> None:
    """停止订单超时定时任务。"""
    global _scheduler_task
    if _scheduler_task is not None and not _scheduler_task.done():
        _scheduler_task.cancel()
    _scheduler_task = None