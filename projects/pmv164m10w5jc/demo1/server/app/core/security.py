"""JWT 签发与解析、密码哈希工具。

区分两类 token：
  - 用户端 token：有效期 7 天，可续期
  - 管理端 token：有效期 2 小时，不可续期
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
import bcrypt

from app.core.config import settings


# ===== 密码哈希 =====
def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(raw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ===== JWT =====
def _create_token(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra: Optional[dict[str, Any]] = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_user_token(user_id: str, extra: Optional[dict[str, Any]] = None) -> str:
    return _create_token(
        subject=user_id,
        token_type="user",
        expires_delta=timedelta(days=settings.jwt_user_token_expire_days),
        extra=extra,
    )


def create_admin_token(admin_id: str, extra: Optional[dict[str, Any]] = None) -> str:
    return _create_token(
        subject=admin_id,
        token_type="admin",
        expires_delta=timedelta(hours=settings.jwt_admin_token_expire_hours),
        extra=extra,
    )


def decode_token(token: str) -> dict[str, Any]:
    """解析 token，过期或非法抛 jwt 异常。"""
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])