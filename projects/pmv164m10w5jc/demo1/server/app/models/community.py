"""社区文化 ORM 模型 - Post、Comment、Like、Section。"""

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.json_type import JSONType


class Section(Base, TimestampMixin):
    """社区板块。"""
    __tablename__ = "sections"
    section_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Post(Base, TimestampMixin, SoftDeleteMixin):
    """帖子。"""
    __tablename__ = "posts"
    post_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    author_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True)
    section_id: Mapped[str] = mapped_column(String(64), ForeignKey("sections.section_id"), index=True)
    title: Mapped[str] = mapped_column(String(50), comment="标题≤50")
    content: Mapped[str] = mapped_column(Text, comment="正文≤2000")
    image_urls: Mapped[list | None] = mapped_column(JSONType, nullable=True, comment="图片URL列表≤9")
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True, comment="pending/published/rejected/violated/draft")
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    last_edit_at: Mapped[str | None] = mapped_column(DateTime, nullable=True, comment="最后编辑时间")
    republish_count: Mapped[int] = mapped_column(Integer, default=0, comment="重发次数")

    __table_args__ = (Index("idx_section_created", "section_id", "created_at"),)


class Comment(Base, TimestampMixin, SoftDeleteMixin):
    """评论。"""
    __tablename__ = "comments"
    comment_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    post_id: Mapped[str] = mapped_column(String(64), ForeignKey("posts.post_id"), index=True)
    author_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True)
    content: Mapped[str] = mapped_column(Text, comment="评论内容")
    parent_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="父评论ID，空=一级评论")
    reply_to_name: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="被回复者昵称，仅二级回复有值")

    __table_args__ = (Index("idx_comment_post_parent", "post_id", "parent_id"),)


class Like(Base):
    """点赞 - 唯一键 user_id+post_id。"""
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_user_post"),)
    like_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True)
    post_id: Mapped[str] = mapped_column(String(64), ForeignKey("posts.post_id"), index=True)


class PostAuditLog(Base, TimestampMixin):
    """帖子审核流水。"""
    __tablename__ = "post_audit_logs"
    log_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    post_id: Mapped[str] = mapped_column(String(64), ForeignKey("posts.post_id"), index=True)
    admin_id: Mapped[str] = mapped_column(String(64), ForeignKey("admin_users.admin_id"), index=True)
    action: Mapped[str] = mapped_column(String(16), comment="approve/reject/takedown")
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)