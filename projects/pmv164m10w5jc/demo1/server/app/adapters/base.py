"""外部服务调用基类 - 统一封装超时、重试、熔断与降级策略。"""

import abc
from typing import Any, Optional

import httpx

from app.core.logging import get_logger

logger = get_logger("adapter")


class ExternalAdapter(abc.ABC):
    """外部服务适配基类，提供带重试的 HTTP 调用与降级容错。"""

    name: str = "external"
    timeout: float = 10.0
    max_retries: int = 2

    async def _request(
        self,
        method: str,
        url: str,
        *,
        params: Optional[dict] = None,
        json_body: Optional[dict] = None,
        headers: Optional[dict] = None,
    ) -> dict:
        last_error: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.request(
                        method, url, params=params, json=json_body, headers=headers
                    )
                    resp.raise_for_status()
                    return resp.json()
            except Exception as e:
                last_error = e
                logger.warning(
                    "adapter.retry",
                    name=self.name, attempt=attempt + 1, error=str(e),
                )
        logger.error("adapter.fallback", name=self.name, error=str(last_error))
        return await self.on_failure(last_error)

    async def on_failure(self, error: Optional[Exception]) -> dict:
        """降级策略：默认返回空字典，子类可覆盖。"""
        return {}