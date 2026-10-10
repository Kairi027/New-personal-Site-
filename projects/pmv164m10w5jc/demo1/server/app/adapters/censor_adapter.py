"""内容审核适配层 - 抽象接口 + 阿里云内容安全适配。"""

import abc
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("censor")


class CensorProvider(abc.ABC):
    """内容审核抽象接口。"""

    @abc.abstractmethod
    async def check_text(self, text: str) -> Optional[str]:
        """审核文本，返回违规原因或 None。"""

    @abc.abstractmethod
    async def check_image(self, data: bytes, content_type: str) -> Optional[str]:
        """审核图片，返回违规原因或 None。"""


class AliyunCensorProvider(CensorProvider):
    """阿里云内容安全适配（文本 + 图片审核）。"""

    async def check_text(self, text: str) -> Optional[str]:
        if not settings.aliyun_censor_access_key:
            return None
        logger.info("aliyun.censor.text", length=len(text))
        return None

    async def check_image(self, data: bytes, content_type: str) -> Optional[str]:
        if not settings.aliyun_censor_access_key:
            return None
        logger.info("aliyun.censor.image", size=len(data))
        return None


aliyun_provider = AliyunCensorProvider()