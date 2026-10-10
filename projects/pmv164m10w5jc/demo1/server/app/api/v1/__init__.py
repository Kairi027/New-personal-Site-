"""用户端 API v1 路由聚合。"""

from fastapi import APIRouter

from app.api.v1.ai import router as ai_router
from app.api.v1.auth import router as auth_router, user_router
from app.api.v1.community import msg_router, page_router, router as community_router, section_router
from app.api.v1.health import router as health_router
from app.api.v1.trade import order_router, router as trade_router
from app.api.v1.travel import router as travel_router
from app.api.v1.weather import router as weather_router

router = APIRouter()


@router.get("/ping", summary="连通性检测")
async def ping():
    return {"message": "pong"}


router.include_router(auth_router)
router.include_router(user_router)
router.include_router(community_router)
router.include_router(section_router)
router.include_router(msg_router)
router.include_router(page_router)
router.include_router(trade_router)
router.include_router(order_router)
router.include_router(travel_router)
router.include_router(weather_router)
router.include_router(ai_router)
router.include_router(health_router)
