"""统一内容审核服务 - 先 DFA 本地过滤，再按需调用云端内容安全。"""

from typing import Optional

from app.core.logging import get_logger
from app.adapters.censor_adapter import aliyun_provider
from app.utils.sensitive_dfa import dfa

logger = get_logger("censor_service")


async def censor_text(text: str) -> Optional[str]:
    """文本审核：先 DFA，再云端。返回违规原因或 None。"""
    if not text:
        return None
    hit = dfa.find_first(text)
    if hit:
        logger.warning("censor.dfa.hit", word=hit)
        return f"包含敏感词：{hit}"
    violation = await aliyun_provider.check_text(text)
    if violation:
        logger.warning("censor.cloud.hit", reason=violation)
        return violation
    return None


async def censor_image(data: bytes, content_type: str) -> Optional[str]:
    """图片审核：调用云端内容安全。"""
    violation = await aliyun_provider.check_image(data, content_type)
    if violation:
        logger.warning("censor.image.hit", reason=violation)
    return violation


def mask_text(text: str) -> str:
    """对文本中的敏感词进行掩码替换。"""
    return dfa.mask(text)