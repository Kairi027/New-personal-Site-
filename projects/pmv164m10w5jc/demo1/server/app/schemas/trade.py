"""闲置交易 Pydantic 模型与订单状态枚举。"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class OrderStatus(str, Enum):
    PENDING_PAY = "pending_pay"
    PAID = "paid"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    CANCELED = "canceled"
    REFUNDING = "refunding"
    REFUNDED = "refunded"


class ProductCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=50)
    description: str | None = Field(None, max_length=1000)
    price: float = Field(..., gt=0, le=999999.99)
    category_id: str | None = None
    image_urls: list[str] = Field(default_factory=list, min_length=1, max_length=6)
    contact: str = Field(..., min_length=1, max_length=128)
    stock: int = Field(1, ge=1, le=999999)


class ProductOut(BaseModel):
    product_id: str
    seller_id: str
    title: str
    description: str | None = None
    price: float
    image_urls: list[str] = []
    contact: str | None = None
    status: str
    stock: int = 0
    locked_count: int = 0
    total_stock: int = 0
    created_at: datetime


class OrderCreate(BaseModel):
    product_id: str


class OrderOut(BaseModel):
    order_id: str
    buyer_id: str
    seller_id: str
    product_id: str
    amount: float
    status: str
    created_at: datetime


class PayRequest(BaseModel):
    channel: str = Field("wechat", pattern="^(wechat|alipay|apple_pay|google_pay)$")