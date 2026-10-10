"""集成测试 - 跨模块端到端验证。"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


class TestHealthCheck:
    """系统健康检查集成测试。"""

    async def test_health(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    async def test_ping(self, client: AsyncClient):
        resp = await client.get("/api/v1/ping")
        assert resp.status_code == 200

    async def test_admin_ping(self, client: AsyncClient):
        resp = await client.get("/api/admin/v1/ping")
        assert resp.status_code == 200


class TestAuthFlow:
    """认证流程集成测试。"""

    async def test_login_without_token(self, client: AsyncClient):
        resp = await client.get("/api/v1/users/me")
        assert resp.status_code == 401

    async def test_register_validation(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "account": "invalid", "password": "123", "nickname": "t", "code": "123456"
        })
        assert resp.status_code == 400


class TestCommunityFlow:
    """社区模块集成测试。"""

    async def test_list_posts_without_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/posts", params={"section_id": "default", "page": 1, "page_size": 20})
        assert resp.status_code == 401


class TestTradeFlow:
    """交易模块集成测试。"""

    async def test_search_products(self, client: AsyncClient):
        resp = await client.get("/api/v1/products", params={"page": 1, "page_size": 20})
        assert resp.status_code == 200


class TestWeatherFlow:
    """天气模块集成测试。"""

    async def test_weather_now(self, client: AsyncClient):
        resp = await client.get("/api/v1/weather/now", params={"location": "101010100"})
        # 可能因天气服务未配置而返回503或200
        assert resp.status_code in (200, 503)