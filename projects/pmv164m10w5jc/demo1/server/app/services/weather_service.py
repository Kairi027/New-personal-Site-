"""天气助手服务 - 实时天气、多日预报、极端天气预警。"""

from app.core.deps import get_redis
from app.core.exceptions import WeatherError
from app.core.logging import get_logger
from app.adapters.weather_adapter import weather_provider

logger = get_logger("weather_service")


async def get_now(location: str) -> dict:
    """实时天气（Redis 缓存 10 分钟）。"""
    redis = get_redis()
    cache_key = f"weather:now:{location}"
    cached = await redis.get(cache_key)
    if cached:
        import json
        return json.loads(cached)
    data = await weather_provider.now(location)
    if not data:
        raise WeatherError(1, "天气服务不可用", http_status=503)
    import json
    await redis.setex(cache_key, 600, json.dumps(data, ensure_ascii=False))
    return data


async def get_forecast(location: str, days: int = 7) -> dict:
    """多日预报（缓存 30 分钟）。"""
    redis = get_redis()
    cache_key = f"weather:forecast:{location}:{days}"
    cached = await redis.get(cache_key)
    if cached:
        import json
        return json.loads(cached)
    data = await weather_provider.forecast(location, days)
    if not data:
        raise WeatherError(1, "天气服务不可用", http_status=503)
    import json
    await redis.setex(cache_key, 1800, json.dumps(data, ensure_ascii=False))
    return data


async def get_alerts(location: str) -> list[dict]:
    """极端天气预警。"""
    return await weather_provider.alert(location)