"""管理后台 Pydantic 模型。"""

from datetime import datetime

from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    password: str = Field(..., min_length=1)


class AdminLoginResponse(BaseModel):
    token: str
    admin: dict


class AdminCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=20)
    real_name: str | None = None
    role_ids: list[str] = []


class RoleCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    description: str | None = None
    permission_ids: list[str] = []


class UserStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|frozen|closed)$")


class PostAuditRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|takedown)$")
    reason: str | None = None


class ProductAuditRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|takedown)$")
    reason: str | None = None


class RefundAuditRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    reason: str | None = None


class AnnouncementCreate(BaseModel):
    title: str = Field(..., max_length=128)
    content: str = Field(..., max_length=2000)
    scope: str = "all"
    target_user_ids: list[str] = []


class SensitiveWordCreate(BaseModel):
    word: str = Field(..., min_length=1, max_length=128)
    category: str | None = None


class SectionCreate(BaseModel):
    name: str = Field(..., max_length=64)
    description: str | None = None
    sort_order: int = 0


class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=64)
    parent_id: str | None = None