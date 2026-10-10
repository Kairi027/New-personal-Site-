"""FastAPI 依赖注入：鉴权、RBAC、分页参数等。"""

from typing import Annotated, Optional

from fastapi import Depends, Header, Query, Request
from redis.asyncio import Redis

from app.core.config import settings
from app.core.exceptions import forbidden, unauthorized
from app.core.security import decode_token


# ===== Redis 连接（延迟初始化，由 main.py 注入） =====
_redis: Optional[Redis] = None


def set_redis(client: Redis) -> None:
    global _redis
    _redis = client


class MemoryRedisFallback:
    """Redis 不可用时的内存降级实现（仅支持本服务用到的命令）。"""
    _store: dict = {}
    _expiry: dict = {}

    async def get(self, key: str):
        return self._store.get(key)
    async def setex(self, key: str, seconds: int, value: str):
        self._store[key] = value
        self._expiry[key] = seconds
    async def exists(self, key: str) -> int:
        return 1 if key in self._store else 0
    async def delete(self, *keys: str) -> int:
        count = 0
        for k in keys:
            if k in self._store:
                del self._store[k]
                count += 1
        return count
    async def incr(self, key: str) -> int:
        val = int(self._store.get(key, 0)) + 1
        self._store[key] = str(val)
        return val
    async def ping(self) -> bool:
        return True


def get_redis() -> Redis:
    if _redis is None:
        return MemoryRedisFallback()  # type: ignore
    return _redis


# ===== 当前用户 =====
async def get_current_user(
    authorization: Annotated[Optional[str], Header()] = None,
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise unauthorized()
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_token(token)
    except Exception:
        raise unauthorized("登录已过期，请重新登录")
    if payload.get("type") != "user":
        raise unauthorized("令牌类型错误")
    # 检查黑名单
    redis = get_redis()
    if await redis.exists(f"token:blacklist:{token}"):
        raise unauthorized("登录态已失效")
    return {"user_id": payload["sub"], "token": token, "payload": payload}


async def get_optional_user(
    authorization: Annotated[Optional[str], Header()] = None,
) -> Optional[dict]:
    """可选认证：有有效 token 返回用户信息，无 token 或无效 token 返回 None。"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_token(token)
    except Exception:
        return None
    if payload.get("type") != "user":
        return None
    redis = get_redis()
    if await redis.exists(f"token:blacklist:{token}"):
        return None
    return {"user_id": payload["sub"], "token": token, "payload": payload}


# ===== 当前管理员 =====
async def get_current_admin(
    authorization: Annotated[Optional[str], Header()] = None,
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise unauthorized()
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_token(token)
    except Exception:
        raise unauthorized("管理端登录已过期")
    if payload.get("type") != "admin":
        raise unauthorized("令牌类型错误")
    redis = get_redis()
    if await redis.exists(f"token:blacklist:{token}"):
        raise unauthorized("登录态已失效")
    return {"admin_id": payload["sub"], "token": token, "payload": payload}


def require_permission(*permissions: str):
    """RBAC 权限装饰器，校验管理员是否持有指定权限码之一。"""

    async def checker(admin: dict = Depends(get_current_admin)) -> dict:
        admin_perms: set[str] = set(admin.get("payload", {}).get("perms", []))
        if not any(p in admin_perms for p in permissions):
            raise forbidden(f"缺少权限：{','.join(permissions)}")
        return admin

    return checker


# ===== 分页参数 =====
class PageParams:
    def __init__(self, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)):
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size


PageDep = Annotated[PageParams, Depends()]