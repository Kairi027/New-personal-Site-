"""敏感词库 ORM 模型。"""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class SensitiveWord(Base, TimestampMixin):
    __tablename__ = "sensitive_words"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    word: Mapped[str] = mapped_column(String(128), unique=True, index=True, comment="敏感词")
    category: Mapped[str | None] = mapped_column(String(32), nullable=True, comment="分类")
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, index=True)