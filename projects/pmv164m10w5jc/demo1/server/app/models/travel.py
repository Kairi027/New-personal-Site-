"""出行规划 ORM 模型 - TravelRoute、NaviSession。"""

from sqlalchemy import ForeignKey, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.models.json_type import JSONType


class TravelRoute(Base, TimestampMixin):
    """路线规划记录。"""
    __tablename__ = "travel_routes"
    route_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True)
    origin_lng: Mapped[float] = mapped_column(Float)
    origin_lat: Mapped[float] = mapped_column(Float)
    dest_lng: Mapped[float] = mapped_column(Float)
    dest_lat: Mapped[float] = mapped_column(Float)
    mode: Mapped[str] = mapped_column(String(16), comment="walking/riding/driving/transit")
    distance: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="距离（米）")
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="时长（秒）")
    steps: Mapped[list | None] = mapped_column(JSONType, nullable=True, comment="转向指引序列")


class NaviSession(Base, TimestampMixin):
    """导航会话 - 状态机：待开始→导航中→重规划中→导航终止。"""
    __tablename__ = "navi_sessions"
    session_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True)
    route_id: Mapped[str] = mapped_column(String(64), ForeignKey("travel_routes.route_id"))
    status: Mapped[str] = mapped_column(
        String(16), default="pending", index=True,
        comment="pending/navigating/replanning/terminated",
    )
    current_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_lat: Mapped[float | None] = mapped_column(Float, nullable=True)

    __table_args__ = (Index("idx_user_status", "user_id", "status"),)