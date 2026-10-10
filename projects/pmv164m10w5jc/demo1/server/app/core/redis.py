"""Redis 连接池 - aioredis。"""

from typing import Optional

import redis.asyncio as aioredis

from app.core.config import settings

_pool: Optional[aioredis.Redis] = None


def init_redis() -> aioredis.Redis:
    global _pool
    if _pool is None:
        _pool = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            max_connections=50,
        )
    return _pool


def get_redis_pool() -> aioredis.Redis:
    if _pool is None:
        return init_redis()
    return _pool


async def close_redis() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None