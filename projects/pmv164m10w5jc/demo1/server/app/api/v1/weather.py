"""天气 API 路由。"""

from fastapi import APIRouter

from app.core.responses import success
from app.services import weather_service
from app.data.all_cities import ALL_CITIES, HOT_CITIES, group_by_province, search_cities as _search_all_cities

router = APIRouter(prefix="/weather", tags=["天气"])


@router.get("/now", summary="实时天气")
async def get_now(city: str = "", location: str = ""):
    loc = city or location
    result = await weather_service.get_now(loc)
    return success(result)


@router.get("/forecast", summary="多日预报")
async def get_forecast(city: str = "", location: str = "", days: int = 7):
    loc = city or location
    result = await weather_service.get_forecast(loc, days)
    return success(result)


@router.get("/alerts", summary="极端天气预警")
async def get_alerts(city: str = "", location: str = ""):
    loc = city or location
    result = await weather_service.get_alerts(loc)
    return success(result)


@router.get("/cities", summary="城市搜索（全国）")
async def search_cities(keyword: str = ""):
    results = _search_all_cities(keyword) if keyword else ALL_CITIES[:20]
    return success(results)


@router.get("/hot-cities", summary="热门城市")
async def hot_cities():
    return success(HOT_CITIES)


@router.get("/all-cities", summary="全国城市列表")
async def all_cities(province: str = ""):
    grouped = group_by_province()
    if province:
        cities = grouped.get(province, [])
    else:
        cities = ALL_CITIES
    return success({"cities": cities, "grouped": grouped})
