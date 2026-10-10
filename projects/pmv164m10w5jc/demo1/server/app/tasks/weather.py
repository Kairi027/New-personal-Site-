"""天气数据采集定时任务。"""

from app.core.celery import celery_app
from app.core.logging import get_logger

logger = get_logger("tasks.weather")


@celery_app.task(name="app.tasks.weather.collect_weather", bind=True)
def collect_weather(self) -> None:
    """每小时采集主要城市天气数据。"""
    logger.info("task.collect_weather.start")