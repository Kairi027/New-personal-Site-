"""用户认证与资料 API 路由。"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.responses import success
from app.schemas.user import (
    LoginRequest, RefreshRequest, RegisterRequest, SendCodeRequest, UserUpdate,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/send-code", summary="发送验证码")
async def send_code(req: SendCodeRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.send_code(db, req.account)
    return success(message="验证码已发送")


@router.post("/register", summary="注册")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.register(db, req.account, req.password, req.nickname)
    return success(result.model_dump())


@router.post("/login", summary="登录")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.login(db, req.account, req.password)
    return success(result.model_dump())


@router.post("/refresh", summary="刷新登录态")
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.refresh_token(db, req.refresh_token)
    return success(result.model_dump())


user_router = APIRouter(prefix="/users", tags=["用户资料"])


@user_router.get("/me", summary="获取我的资料")
async def get_me(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    profile = await auth_service.get_profile(db, user["user_id"])
    return success(profile.model_dump())


@user_router.put("/me", summary="更新我的资料")
async def update_me(
    data: UserUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await auth_service.update_profile(db, user["user_id"], data)
    return success(profile.model_dump())


@user_router.get("/{user_id}/profile", summary="获取用户主页")
async def get_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    profile = await auth_service.get_public_profile(db, user_id)
    return success(profile)