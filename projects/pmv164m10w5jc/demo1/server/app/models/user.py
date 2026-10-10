"""用户 ORM 模型。"""

from sqlalchemy import Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True, comment="用户ID（UUID）")
    account: Mapped[str] = mapped_column(String(64), unique=True, index=True, comment="账号（手机号/邮箱）")
    password_hash: Mapped[str] = mapped_column(String(128), comment="bcrypt 密码哈希")
    nickname: Mapped[str] = mapped_column(String(64), unique=True, index=True, comment="昵称")
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True, comment="头像URL")
    bio: Mapped[str | None] = mapped_column(Text, nullable=True, comment="个人简介")
    status: Mapped[str] = mapped_column(
        String(16), default="active", index=True, comment="active/frozen/closed"
    )
    register_time: Mapped[str | None] = mapped_column(String(32), nullable=True, comment="注册时间")

    __table_args__ = (
        Index("idx_status_account", "status", "account"),
    )