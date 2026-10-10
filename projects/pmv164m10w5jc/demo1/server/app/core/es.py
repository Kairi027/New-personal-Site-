"""Elasticsearch 异步客户端 - 帖子/商品全文检索。

当 settings.es_enabled=False 时返回 None，调用方需做降级处理（如退化为 SQL LIKE）。
"""

from typing import Optional

from elasticsearch import AsyncElasticsearch

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("es")

_client: Optional[AsyncElasticsearch] = None

POST_INDEX = "posts"
GOODS_INDEX = "goods"

POST_MAPPING = {
    "mappings": {
        "properties": {
            "post_id": {"type": "keyword"},
            "title": {"type": "text", "analyzer": "ik_max_word"},
            "content": {"type": "text", "analyzer": "ik_max_word"},
            "author_id": {"type": "keyword"},
            "created_at": {"type": "date"},
        }
    }
}

GOODS_MAPPING = {
    "mappings": {
        "properties": {
            "goods_id": {"type": "keyword"},
            "title": {"type": "text", "analyzer": "ik_max_word"},
            "description": {"type": "text", "analyzer": "ik_max_word"},
            "price": {"type": "double"},
            "seller_id": {"type": "keyword"},
        }
    }
}


def init_es() -> Optional[AsyncElasticsearch]:
    global _client
    if not settings.es_enabled:
        return None
    if _client is None:
        _client = AsyncElasticsearch(settings.es_url)
    return _client


def get_es() -> Optional[AsyncElasticsearch]:
    if not settings.es_enabled:
        return None
    if _client is None:
        return init_es()
    return _client


async def ensure_indices() -> None:
    """初始化全文检索索引。"""
    es = get_es()
    if es is None:
        return
    for name, mapping in [(POST_INDEX, POST_MAPPING), (GOODS_INDEX, GOODS_MAPPING)]:
        try:
            exists = await es.indices.exists(index=name)
            if not exists:
                await es.indices.create(index=name, body=mapping)
                logger.info("es.index_created", index=name)
        except Exception as e:
            logger.warning("es.index_init_failed", index=name, error=str(e))


async def close_es() -> None:
    global _client
    if _client is not None:
        await _client.close()
        _client = None