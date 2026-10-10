"""出行规划 API 路由。"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.responses import success
from app.schemas.travel import NaviStartRequest, RoutePlanRequest
from app.services import travel_service

router = APIRouter(prefix="/travel", tags=["出行规划"])


@router.post("/routes", summary="路线规划")
async def plan_route(data: RoutePlanRequest, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await travel_service.plan_route(db, user["user_id"], data)
    return success(result)


@router.get("/search", summary="地点检索")
async def search_places(keyword: str, location: str | None = None):
    result = await travel_service.search_places(keyword, location)
    return success(result)


@router.post("/navi/start", summary="开始导航")
async def start_navi(data: NaviStartRequest, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await travel_service.start_navi(db, user["user_id"], data.route_id)
    return success(result)


@router.post("/navi/stop", summary="结束导航")
async def stop_navi(session_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await travel_service.stop_navi(db, user["user_id"], session_id)
    return success(result)