"""地图适配层 - 高德地图：路线规划、地点检索、导航校准。"""

import abc
from typing import Any, Optional

from app.core.config import settings
from app.adapters.base import ExternalAdapter


class MapProvider(abc.ABC):
    """地图服务抽象接口。"""

    @abc.abstractmethod
    async def route_plan(
        self, origin: str, destination: str, mode: str = "driving"
    ) -> dict:
        """路线规划。mode: driving/walking/riding/transit"""

    @abc.abstractmethod
    async def place_search(self, keyword: str, city: Optional[str] = None) -> list[dict]:
        """地点检索。"""

    @abc.abstractmethod
    async def navi_calibrate(self, current_lng: float, current_lat: float, route_id: str) -> dict:
        """实时导航校准（偏航重算）。"""


class AmapProvider(MapProvider, ExternalAdapter):
    """高德地图适配。"""

    name = "amap"
    base_url = "https://restapi.amap.com/v3"
    base_url_v5 = "https://restapi.amap.com/v5"

    def _common_params(self) -> dict:
        return {"key": settings.amap_api_key}

    async def route_plan(self, origin: str, destination: str, mode: str = "driving") -> dict:
        if not settings.amap_api_key:
            return await self.on_failure(ValueError("no amap key"))
        url = f"{self.base_url}/direction/{mode}"
        params = {**self._common_params(), "origin": origin, "destination": destination}
        if mode == "transit":
            params["city"] = "全国"
        return await self._request("GET", url, params=params)

    async def place_search(self, keyword: str, city: Optional[str] = None) -> list[dict]:
        if not settings.amap_api_key:
            return []
        url = f"{self.base_url}/place/text"
        params = {**self._common_params(), "keywords": keyword}
        if city:
            params["city"] = city
        data = await self._request("GET", url, params=params)
        return data.get("pois", [])

    async def navi_calibrate(self, current_lng: float, current_lat: float, route_id: str) -> dict:
        return {"lng": current_lng, "lat": current_lat, "route_id": route_id, "off_route": False}


map_provider = AmapProvider()