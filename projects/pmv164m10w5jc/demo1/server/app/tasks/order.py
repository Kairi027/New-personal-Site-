"""订单异步任务 - 超时取消等。"""

from app.core.celery import celery_app
from app.core.logging import get_logger

logger = get_logger("tasks.order")


@celery_app.task(name="app.tasks.order.cancel_expired_orders", bind=True)
def cancel_expired_orders(self) -> None:
    """每 5 分钟扫描并取消超时未支付订单。"""
    logger.info("task.cancel_expired_orders.start")