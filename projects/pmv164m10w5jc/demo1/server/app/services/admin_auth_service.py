"""管理员认证服务 - 登录、RBAC 权限加载。"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AdminError, unauthorized
from app.core.logging import get_logger
from app.core.security import create_admin_token, hash_password, verify_password
from app.models.admin import AdminUser, Role, admin_user_role, role_permission, Permission

logger = get_logger("admin_auth_service")


async def login(db: AsyncSession, username: str, password: str, ip: str | None = None) -> dict:
    """管理员登录：校验凭证 + 加载 RBAC 权限 + 签发 JWT。"""
    admin = await db.scalar(select(AdminUser).where(AdminUser.username == username))
    if not admin or not verify_password(password, admin.password_hash):
        raise AdminError(1, "用户名或密码错误", http_status=401)
    if admin.status != "active":
        raise AdminError(2, "账号已禁用", http_status=403)

    # 加载角色与权限
    perms = await _load_permissions(db, admin.admin_id)
    is_super = await _is_super_admin(db, admin.admin_id)

    token = create_admin_token(
        admin.admin_id,
        extra={"username": admin.username, "perms": list(perms), "is_super": is_super},
    )

    admin.last_login_time = datetime.now(timezone.utc).isoformat()
    admin.last_login_ip = ip
    await db.flush()

    return {
        "token": token,
        "admin": {
            "admin_id": admin.admin_id,
            "username": admin.username,
            "real_name": admin.real_name,
            "permissions": list(perms),
            "is_super": is_super,
        },
    }


async def create_admin(db: AsyncSession, username: str, password: str, real_name: str | None = None, role_ids: list[str] | None = None) -> dict:
    """创建管理员账号。"""
    exists = await db.scalar(select(AdminUser).where(AdminUser.username == username))
    if exists:
        raise AdminError(3, "用户名已存在", http_status=409)

    admin = AdminUser(
        admin_id=uuid.uuid4().hex,
        username=username,
        password_hash=hash_password(password),
        real_name=real_name,
    )
    db.add(admin)
    await db.flush()

    if role_ids:
        for rid in role_ids:
            await db.execute(admin_user_role.insert().values(admin_id=admin.admin_id, role_id=rid))
    await db.flush()
    return {"admin_id": admin.admin_id}


async def _load_permissions(db: AsyncSession, admin_id: str) -> set[str]:
    """加载管理员权限码集合。"""
    result = await db.execute(
        select(Permission.code)
        .join(role_permission, Permission.permission_id == role_permission.c.permission_id)
        .join(admin_user_role, role_permission.c.role_id == admin_user_role.c.role_id)
        .where(admin_user_role.c.admin_id == admin_id)
    )
    return {row[0] for row in result.all()}


async def _is_super_admin(db: AsyncSession, admin_id: str) -> bool:
    result = await db.execute(
        select(Role.is_super)
        .join(admin_user_role, Role.role_id == admin_user_role.c.role_id)
        .where(admin_user_role.c.admin_id == admin_id)
    )
    return any(row[0] for row in result.all())