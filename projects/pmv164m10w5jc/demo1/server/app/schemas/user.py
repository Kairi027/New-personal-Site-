"""用户相关 Pydantic 请求/响应模型。"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


# ===== 请求 =====
class SendCodeRequest(BaseModel):
    account: str = Field(..., description="手机号或邮箱")


class RegisterRequest(BaseModel):
    account: str = Field(..., min_length=5, max_length=64)
    password: str = Field(..., min_length=8, max_length=20)
    nickname: str = Field(..., min_length=2, max_length=32)


    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("密码需同时包含字母与数字")
        return v


class LoginRequest(BaseModel):
    account: str = Field(..., min_length=5, max_length=64)
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str


class UserUpdate(BaseModel):
    nickname: str | None = Field(None, min_length=2, max_length=32)
    avatar_url: str | None = Field(None, max_length=512)
    bio: str | None = Field(None, max_length=500)


# ===== 响应 =====
class UserProfile(BaseModel):
    user_id: str
    account: str
    nickname: str
    avatar_url: str | None = None
    bio: str | None = None
    status: str
    register_time: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserProfile


class PublicProfile(BaseModel):
    """他人主页公开信息。"""

    user_id: str
    nickname: str
    avatar_url: str | None = None
    bio: str | None = None
    post_count: int = 0
    like_count: int = 0