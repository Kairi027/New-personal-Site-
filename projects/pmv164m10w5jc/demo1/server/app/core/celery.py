"""Celery 配置 - RabbitMQ broker，定义异步任务基类与重试策略。"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "local_life",
    broker=settings.rabbitmq_url,
    backend=f"redis://{settings.redis_host}:{settings.redis_port}/1",
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_retry_delay=60,
    task_max_retries=3,
)

# ===== Beat 定时任务调度 =====
celery_app.conf.beat_schedule = {
    "cancel-expired-orders": {
        "task": "app.tasks.order.cancel_expired_orders",
        "schedule": crontab(minute="*/5"),
    },
    "collect-weather-data": {
        "task": "app.tasks.weather.collect_weather",
        "schedule": crontab(minute="0", hour="*/1"),
    },
    "refresh-sensitive-dfa": {
        "task": "app.tasks.censor.refresh_dfa",
        "schedule": crontab(minute="*/10"),
    },
}