"""用户认证服务 - 注册、登录、验证码、资料管理。"""

import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_redis
from app.core.exceptions import UserError
from app.core.logging import get_logger
from app.core.security import create_user_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import LoginResponse, UserProfile, UserUpdate

logger = get_logger("auth_service")

PHONE_RE = re.compile(r"^1[3-9]\d{9}$")
EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")


def _validate_account(account: str) -> str:
    if PHONE_RE.match(account) or EMAIL_RE.match(account):
        return account
    raise UserError(1, "账号格式错误，需为手机号或邮箱", http_status=400)


async def send_code(db: AsyncSession, account: str) -> None:
    """下发验证码：限流 60s/账号，验证码缓存 5 分钟。"""
    _validate_account(account)
    redis = get_redis()
    throttle_key = f"code:throttle:{account}"
    if await redis.exists(throttle_key):
        raise UserError(2, "验证码发送过于频繁，请 60 秒后重试", http_status=429)
    code = str(uuid.uuid4().int % 900000 + 100000)
    await redis.setex(f"code:{account}", 300, code)
    await redis.setex(throttle_key, 60, "1")
    logger.info("auth.send_code", account=account)
    # TODO: 调用推送服务下发验证码


async def register(db: AsyncSession, account: str, password: str, nickname: str) -> LoginResponse:
    """注册：账号唯一 + 创建账户 + 签发 JWT。"""
    _validate_account(account)

    exists = await db.scalar(select(User).where(User.account == account))
    if exists:
        raise UserError(4, "账号已存在", http_status=409)

    nick_exists = await db.scalar(select(User).where(User.nickname == nickname))
    if nick_exists:
        raise UserError(5, "昵称已被占用", http_status=409)

    user = User(
        user_id=uuid.uuid4().hex,
        account=account,
        password_hash=hash_password(password),
        nickname=nickname,
        status="active",
        register_time=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    await db.flush()

    return await _build_login_response(user)


async def login(db: AsyncSession, account: str, password: str) -> LoginResponse:
    """登录：校验凭证 + 账号状态 + 签发 token。"""
    user = await db.scalar(select(User).where(User.account == account))
    if not user or not verify_password(password, user.password_hash):
        raise UserError(101, "账号或密码错误", http_status=401)
    if user.status == "frozen":
        raise UserError(102, "账号已冻结", http_status=403)
    if user.status == "closed":
        raise UserError(103, "账号已注销", http_status=403)
    return await _build_login_response(user)


async def refresh_token(db: AsyncSession, refresh: str) -> LoginResponse:
    """刷新登录态。"""
    from app.core.security import decode_token
    try:
        payload = decode_token(refresh)
    except Exception:
        raise UserError(104, "刷新令牌无效，请重新登录", http_status=401)
    if payload.get("type") != "user_refresh":
        raise UserError(104, "令牌类型错误", http_status=401)
    user = await db.scalar(select(User).where(User.user_id == payload["sub"]))
    if not user or user.status != "active":
        raise UserError(104, "账号不可用", http_status=401)
    return await _build_login_response(user)


async def get_profile(db: AsyncSession, user_id: str) -> UserProfile:
    user = await _get_user(db, user_id)
    return _to_profile(user)


async def update_profile(db: AsyncSession, user_id: str, data: UserUpdate) -> UserProfile:
    user = await _get_user(db, user_id)
    if data.nickname and data.nickname != user.nickname:
        nick_exists = await db.scalar(select(User).where(User.nickname == data.nickname))
        if nick_exists:
            raise UserError(301, "昵称已被占用", http_status=409)
        user.nickname = data.nickname
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.bio is not None:
        user.bio = data.bio
    await db.flush()
    return _to_profile(user)


async def get_public_profile(db: AsyncSession, user_id: str) -> dict:
    """获取他人主页公开信息 + 聚合统计。"""
    user = await _get_user(db, user_id)
    return {
        "user_id": user.user_id,
        "nickname": user.nickname,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "post_count": 0,
        "like_count": 0,
    }


async def freeze_account(db: AsyncSession, user_id: str) -> None:
    user = await _get_user(db, user_id)
    user.status = "frozen"
    await db.flush()


async def unfreeze_account(db: AsyncSession, user_id: str) -> None:
    user = await _get_user(db, user_id)
    user.status = "active"
    await db.flush()


async def close_account(db: AsyncSession, user_id: str) -> None:
    user = await _get_user(db, user_id)
    user.status = "closed"
    await db.flush()


# ===== 内部工具 =====
async def _get_user(db: AsyncSession, user_id: str) -> User:
    user = await db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise UserError(401, "用户不存在", http_status=404)
    return user


def _to_profile(user: User) -> UserProfile:
    return UserProfile(
        user_id=user.user_id,
        account=user.account,
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        bio=user.bio,
        status=user.status,
        register_time=user.register_time,
    )


async def _build_login_response(user: User) -> LoginResponse:
    access = create_user_token(user.user_id, extra={"nickname": user.nickname})
    refresh = create_user_token(user.user_id, extra={"type": "user_refresh"})
    return LoginResponse(
        access_token=access,
        refresh_token=refresh,
        user=_to_profile(user),
    )