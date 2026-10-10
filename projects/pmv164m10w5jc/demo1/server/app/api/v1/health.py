"""服务可用性自检接口。"""

from fastapi import APIRouter
from app.core.config import settings
from app.core.responses import success

router = APIRouter(prefix="/health", tags=["系统"])


def _mask_key(key: str) -> str:
    if not key or len(key) <= 6:
        return "***" if key else ""
    return f"{key[:3]}***{key[-3:]}"


@router.get("/services", summary="第三方服务可用性自检")
async def check_services():
    return success({
        "map": {
            "configured": bool(settings.amap_api_key),
            "key_masked": _mask_key(settings.amap_api_key),
        },
        "weather": {
            "configured": bool(settings.qweather_api_key),
            "key_masked": _mask_key(settings.qweather_api_key),
        },
        "ai": {
            "configured": bool(settings.ai_api_key),
            "key_masked": _mask_key(settings.ai_api_key),
            "model": settings.ai_model,
        },
    })