"""出行规划服务 - 路线规划、地点检索、GPS 导航会话管理。"""

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_redis
from app.core.exceptions import TravelError
from app.core.logging import get_logger
from app.models.travel import NaviSession, TravelRoute
from app.schemas.travel import GeoPoint, RoutePlanRequest, TravelMode

logger = get_logger("travel_service")


async def plan_route(db: AsyncSession, user_id: str, req: RoutePlanRequest) -> dict:
    """路线规划：校验起终点 + 调用高德地图。"""
    if _points_equal(req.origin, req.destination):
        raise TravelError(1, "起点与终点相同", http_status=400)

    from app.adapters.map_adapter import map_provider
    origin_str = f"{req.origin.lng},{req.origin.lat}"
    dest_str = f"{req.destination.lng},{req.destination.lat}"
    data = await map_provider.route_plan(origin_str, dest_str, req.mode.value)
    if not data:
        raise TravelError(3, "地图服务不可用，请稍后重试", http_status=503)

    route = TravelRoute(
        route_id=uuid.uuid4().hex,
        user_id=user_id,
        origin_lng=req.origin.lng,
        origin_lat=req.origin.lat,
        dest_lng=req.destination.lng,
        dest_lat=req.destination.lat,
        mode=req.mode.value,
        distance=data.get("distance"),
        duration=data.get("duration"),
        steps=data.get("steps", []),
    )
    db.add(route)
    await db.flush()
    return {
        "route_id": route.route_id,
        "distance": route.distance or 0,
        "duration": route.duration or 0,
        "steps": route.steps or [],
    }


async def search_places(keyword: str, location: str | None = None) -> list[dict]:
    """地点检索。"""
    from app.adapters.map_adapter import map_provider
    places = await map_provider.place_search(keyword, location)
    return [
        {"name": p.get("name", ""), "address": p.get("address", ""), "lng": 0, "lat": 0}
        for p in places
    ]


async def start_navi(db: AsyncSession, user_id: str, route_id: str) -> dict:
    """开始导航会话。"""
    route = await db.scalar(select(TravelRoute).where(TravelRoute.route_id == route_id))
    if not route:
        raise TravelError(2, "路线不存在", http_status=404)

    session = NaviSession(
        session_id=uuid.uuid4().hex,
        user_id=user_id,
        route_id=route_id,
        status="navigating",
    )
    db.add(session)
    await db.flush()
    return {"session_id": session.session_id, "status": session.status}


async def stop_navi(db: AsyncSession, user_id: str, session_id: str) -> dict:
    """结束导航。"""
    session = await db.scalar(select(NaviSession).where(
        NaviSession.session_id == session_id, NaviSession.user_id == user_id
    ))
    if not session:
        raise TravelError(2, "导航会话不存在", http_status=404)
    session.status = "terminated"
    await db.flush()
    return {"status": session.status}


async def handle_gps_report(user_id: str, session_id: str, lng: float, lat: float) -> dict:
    """处理 GPS 上报：Redis 实时位置缓存 + 偏航检测。"""
    redis = get_redis()
    await redis.setex(f"gps:{session_id}", 2, f"{lng},{lat}")

    # 偏航检测（简化）
    from app.adapters.map_adapter import map_provider
    calibrate = await map_provider.navi_calibrate(lng, lat, session_id)
    off_route = calibrate.get("off_route", False)

    return {
        "lng": lng,
        "lat": lat,
        "off_route": off_route,
        "instruction": "请在前方路口右转" if not off_route else "已偏航，正在重新规划路线...",
    }


def _points_equal(a: GeoPoint, b: GeoPoint) -> bool:
    return abs(a.lng - b.lng) < 1e-6 and abs(a.lat - b.lat) < 1e-6