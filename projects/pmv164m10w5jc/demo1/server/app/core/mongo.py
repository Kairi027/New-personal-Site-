"""MongoDB 异步客户端 - Motor，承载 AI 会话与私信高频写入。

当 settings.mongo_enabled=False 时返回 None，调用方需做降级处理。
"""

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def init_mongo() -> Optional[AsyncIOMotorDatabase]:
    global _client, _db
    if not settings.mongo_enabled:
        return None
    if _db is None:
        _client = AsyncIOMotorClient(settings.mongo_url)
        _db = _client[settings.mongo_database]
    return _db


def get_mongo() -> Optional[AsyncIOMotorDatabase]:
    if not settings.mongo_enabled:
        return None
    if _db is None:
        return init_mongo()
    return _db


async def close_mongo() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None