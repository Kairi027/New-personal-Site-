"""AI 适配层 - OpenAI 兼容接口（支持通义/DeepSeek/智谱可切换），SSE 流式响应。"""

import abc
from typing import Any, AsyncGenerator, Optional

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("ai_adapter")


class AIProvider(abc.ABC):
    """AI 服务抽象接口。"""

    @abc.abstractmethod
    async def chat(self, messages: list[dict], **kwargs: Any) -> dict:
        """同步对话。"""

    @abc.abstractmethod
    async def chat_stream(self, messages: list[dict], **kwargs: Any) -> AsyncGenerator[str, None]:
        """流式对话，逐 token 产出文本。"""


class OpenAICompatibleProvider(AIProvider):
    """OpenAI 兼容接口适配，支持通义/DeepSeek/智谱可切换。"""

    def __init__(self) -> None:
        self.api_base = settings.ai_api_base
        self.api_key = settings.ai_api_key
        self.model = settings.ai_model

    async def chat(self, messages: list[dict], **kwargs: Any) -> dict:
        if not self.api_key:
            return {"content": "AI 服务暂未配置，请联系管理员。"}
        payload = {"model": kwargs.get("model", self.model), "messages": messages, **kwargs}
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.api_base}/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            resp.raise_for_status()
            data = resp.json()
            return {"content": data["choices"][0]["message"]["content"]}

    async def chat_stream(self, messages: list[dict], **kwargs: Any) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "AI 服务暂未配置，请联系管理员。"
            return
        payload = {
            "model": kwargs.get("model", self.model),
            "messages": messages,
            "stream": True,
            **{k: v for k, v in kwargs.items() if k != "model"},
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{self.api_base}/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        chunk = line[6:]
                        if chunk == "[DONE]":
                            break
                        try:
                            import json
                            data = json.loads(chunk)
                            delta = data["choices"][0].get("delta", {}).get("content")
                            if delta:
                                yield delta
                        except Exception:
                            continue


ai_provider = OpenAICompatibleProvider()