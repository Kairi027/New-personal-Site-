"""私信 ORM 模型 - 会话与消息（SQLite 降级存储）。"""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.models.json_type import JSONType


class MessageSession(Base, TimestampMixin):
    __tablename__ = "message_sessions"
    session_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    participants: Mapped[list] = mapped_column(JSONType, index=True, comment="参与者user_id列表")
    last_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    clear_map: Mapped[dict | None] = mapped_column(JSONType, nullable=True, comment="本端清空时间点{user_id: UTC时间字符串}")


class Message(Base, TimestampMixin):
    __tablename__ = "messages"
    msg_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    sender_id: Mapped[str] = mapped_column(String(64), index=True)
    content: Mapped[str] = mapped_column(Text)
    msg_type: Mapped[str] = mapped_column(String(16), default="text")