"""审计日志模型。"""

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.models.json_type import JSONType


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    operator_id: Mapped[str] = mapped_column(String(64), index=True, comment="操作人ID")
    operator_type: Mapped[str] = mapped_column(String(16), comment="user/admin")
    action: Mapped[str] = mapped_column(String(64), index=True, comment="操作类型")
    target_type: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="操作对象类型")
    target_id: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="操作对象ID")
    content: Mapped[dict | None] = mapped_column(JSONType, nullable=True, comment="操作内容快照")
    ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)