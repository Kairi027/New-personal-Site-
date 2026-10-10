"""内容审核定时任务 - 刷新敏感词 DFA。"""

from app.core.celery import celery_app
from app.core.logging import get_logger

logger = get_logger("tasks.censor")


@celery_app.task(name="app.tasks.censor.refresh_dfa", bind=True)
def refresh_dfa(self) -> None:
    """每 10 分钟从数据库刷新敏感词 DFA。"""
    logger.info("task.refresh_dfa.start")