"""管理后台 RBAC ORM 模型 - AdminUser、Role、Permission。"""

from sqlalchemy import Boolean, ForeignKey, String, Table, Column
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.models.json_type import JSONType

# 角色-权限 多对多关联表
role_permission = Table(
    "role_permission",
    Base.metadata,
    Column("role_id", String(64), ForeignKey("roles.role_id"), primary_key=True),
    Column("permission_id", String(64), ForeignKey("permissions.permission_id"), primary_key=True),
)

# 管理员-角色 多对多关联表
admin_user_role = Table(
    "admin_user_role",
    Base.metadata,
    Column("admin_id", String(64), ForeignKey("admin_users.admin_id"), primary_key=True),
    Column("role_id", String(64), ForeignKey("roles.role_id"), primary_key=True),
)


class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"
    permission_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, comment="权限码如 user:freeze")
    name: Mapped[str] = mapped_column(String(128))
    module: Mapped[str] = mapped_column(String(32), index=True, comment="所属模块")


class Role(Base, TimestampMixin):
    __tablename__ = "roles"
    role_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(256), nullable=True)
    is_super: Mapped[bool] = mapped_column(Boolean, default=False, comment="超级管理员角色")


class AdminUser(Base, TimestampMixin):
    __tablename__ = "admin_users"
    admin_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    real_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="active", index=True, comment="active/disabled")
    last_login_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    last_login_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Announcement(Base, TimestampMixin):
    """系统公告。"""
    __tablename__ = "announcements"
    announce_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(128))
    content: Mapped[str] = mapped_column(String(2000))
    scope: Mapped[str] = mapped_column(String(16), default="all", comment="all/targeted")
    target_user_ids: Mapped[list | None] = mapped_column(JSONType, default=None, comment="定向用户ID列表")
    status: Mapped[str] = mapped_column(String(16), default="published")


class SystemConfig(Base, TimestampMixin):
    """系统参数配置。"""
    __tablename__ = "system_configs"
    config_key: Mapped[str] = mapped_column(String(128), primary_key=True)
    config_value: Mapped[str] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(String(256), nullable=True)