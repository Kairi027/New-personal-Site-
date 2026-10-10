"""闲置交易 ORM 模型 - Product、Order、Category、PayIdempotent、ProductAuditLog。"""

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SoftDeleteMixin, TimestampMixin
from app.models.json_type import JSONType


class Category(Base, TimestampMixin):
    __tablename__ = "categories"
    category_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    parent_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("categories.category_id"), nullable=True)


class Product(Base, TimestampMixin, SoftDeleteMixin):
    """商品 - 价格以分存储避免浮点误差。"""
    __tablename__ = "products"
    product_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    seller_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True)
    category_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("categories.category_id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_cents: Mapped[int] = mapped_column(Integer, comment="价格（分）")
    image_urls: Mapped[list | None] = mapped_column(JSONType, nullable=True)
    contact: Mapped[str | None] = mapped_column(String(128), nullable=True, comment="联系方式")
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True, comment="pending/on_sale/locked/sold/off_shelf/rejected/violated")
    stock: Mapped[int] = mapped_column(Integer, default=1, nullable=False, comment="实际库存（可用），下单不扣减，支付扣减，退款恢复")
    locked_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="锁定数量，下单+1，取消/支付-1")
    total_stock: Mapped[int] = mapped_column(Integer, default=1, nullable=False, comment="总库存，发布时设定，编辑重发可修改")
    last_edit_at: Mapped[str | None] = mapped_column(DateTime, nullable=True, comment="最后编辑时间")
    republish_count: Mapped[int] = mapped_column(Integer, default=0, comment="重发次数")
    discard_time: Mapped[str | None] = mapped_column(String(32), nullable=True, comment="废弃时间UTC")
    purge_mark: Mapped[bool] = mapped_column(Boolean, default=False, index=True, comment="彻底删除终态标记")

    __table_args__ = (Index("idx_status_category", "status", "category_id"),)


class ProductAuditLog(Base, TimestampMixin):
    """商品审核流水。"""
    __tablename__ = "product_audit_logs"
    log_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    product_id: Mapped[str] = mapped_column(String(64), ForeignKey("products.product_id"), index=True)
    admin_id: Mapped[str] = mapped_column(String(64), ForeignKey("admin_users.admin_id"), index=True)
    action: Mapped[str] = mapped_column(String(16), comment="approve/reject/takedown")
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)


class Order(Base, TimestampMixin):
    """订单 - 七态状态机。"""
    __tablename__ = "orders"
    order_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    buyer_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True)
    seller_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.user_id"), index=True)
    product_id: Mapped[str] = mapped_column(String(64), ForeignKey("products.product_id"), index=True)
    amount_cents: Mapped[int] = mapped_column(Integer, comment="订单金额（分）")
    status: Mapped[str] = mapped_column(
        String(16), default="pending_pay", index=True,
        comment="pending_pay/paid/shipped/completed/canceled/refunding/refunded",
    )
    pay_channel: Mapped[str | None] = mapped_column(String(16), nullable=True)
    pay_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ship_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    complete_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    cancel_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    refund_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    refund_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    refund_apply_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    refund_reject_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    refund_reject_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    pre_refund_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    refund_processing: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    stock_mode: Mapped[str | None] = mapped_column(String(8), nullable=True, comment="库存模式：lock（锁定模式，新订单）/ deduct（直接扣减，存量订单）")
    logistics_no: Mapped[str | None] = mapped_column(String(64), nullable=True)
    logistics_company: Mapped[str | None] = mapped_column(String(64), nullable=True)

    __table_args__ = (Index("idx_status_created", "status", "created_at"),)


class PayIdempotent(Base):
    """支付幂等键去重。"""
    __tablename__ = "pay_idempotent"
    __table_args__ = (UniqueConstraint("idempotent_key", name="uq_idempotent"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    idempotent_key: Mapped[str] = mapped_column(String(128))
    order_id: Mapped[str] = mapped_column(String(64), index=True)
    result: Mapped[str | None] = mapped_column(String(16), nullable=True)