"""天气适配层 - 华风爱科天气API（标准版）：实时、预报、预警。"""

import abc
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.adapters.base import ExternalAdapter

logger = get_logger("adapter.weather")


class WeatherProvider(abc.ABC):
    """天气服务抽象接口。"""

    @abc.abstractmethod
    async def now(self, location: str) -> dict:
        """实时天气。location 为城市名或 Location Key。"""

    @abc.abstractmethod
    async def forecast(self, location: str, days: int = 7) -> dict:
        """多日预报。"""

    @abc.abstractmethod
    async def alert(self, location: str) -> list[dict]:
        """极端天气预警。"""


class HuafengWeatherProvider(WeatherProvider, ExternalAdapter):
    """华风爱科天气适配（标准版）。"""

    name = "huafeng_weather"
    base_url = "https://openapi.weathercn.com"
    timeout = 15.0
    max_retries = 2

    _location_cache: dict[str, str] = {}

    def _auth_params(self, **extra) -> dict:
        params = {"apikey": settings.qweather_api_key, "language": "zh-cn"}
        params.update(extra)
        return params

    async def _resolve_location_key(self, location: str) -> Optional[str]:
        if not location:
            return None
        if location.isdigit():
            return location
        cached = self._location_cache.get(location)
        if cached:
            return cached
        if not settings.qweather_api_key:
            return None
        params = self._auth_params(q=location, details="false")
        data = await self._request(
            "GET", f"{self.base_url}/locations/v1/cities/translate", params=params
        )
        if isinstance(data, list) and data:
            key = data[0].get("Key")
            if key:
                self._location_cache[location] = key
                return key
        return None

    async def now(self, location: str) -> dict:
        if not settings.qweather_api_key:
            return await self.on_failure(ValueError("no huafeng api key"))
        loc_key = await self._resolve_location_key(location)
        if not loc_key:
            return await self.on_failure(ValueError(f"cannot resolve location: {location}"))
        params = self._auth_params(details="true")
        data = await self._request(
            "GET", f"{self.base_url}/currentconditions/v1/{loc_key}.json", params=params
        )
        if not data or not isinstance(data, list) or not data[0]:
            return {}
        item = data[0]
        temp = item.get("Temperature", {}).get("Metric", {}).get("Value")
        feels = item.get("RealFeelTemperature", {}).get("Metric", {}).get("Value")
        wind = item.get("Wind", {})
        return {
            "now": {
                "temp": temp,
                "text": item.get("WeatherText", ""),
                "humidity": item.get("RelativeHumidity"),
                "windDir": wind.get("Direction", {}).get("Localized", ""),
                "windScale": item.get("LocalSource", {}).get("WindLevel"),
                "feelsLike": feels,
            }
        }

    async def forecast(self, location: str, days: int = 7) -> dict:
        if not settings.qweather_api_key:
            return await self.on_failure(ValueError("no huafeng api key"))
        loc_key = await self._resolve_location_key(location)
        if not loc_key:
            return await self.on_failure(ValueError(f"cannot resolve location: {location}"))
        n = min(max(days, 1), 10)
        if n <= 5:
            n_day = "5day"
        else:
            n_day = "10day"
        params = self._auth_params(details="true", metric="true")
        data = await self._request(
            "GET", f"{self.base_url}/forecasts/v1/daily/{n_day}/{loc_key}.json", params=params
        )
        if not data or not isinstance(data, dict):
            return {}
        forecasts = data.get("DailyForecasts", [])
        daily = []
        for d in forecasts[:days]:
            temp = d.get("Temperature", {})
            day = d.get("Day", {})
            daily.append({
                "fxDate": d.get("Date", "")[:10],
                "tempMax": temp.get("Maximum", {}).get("Value"),
                "tempMin": temp.get("Minimum", {}).get("Value"),
                "textDay": day.get("IconPhrase", ""),
            })
        return {"daily": daily}

    async def alert(self, location: str) -> list[dict]:
        if not settings.qweather_api_key:
            return []
        loc_key = await self._resolve_location_key(location)
        if not loc_key:
            return []
        params = self._auth_params()
        data = await self._request(
            "GET", f"{self.base_url}/alarms/v1/{loc_key}.json", params=params
        )
        if not data:
            return []
        return data if isinstance(data, list) else []


weather_provider = HuafengWeatherProvider()
