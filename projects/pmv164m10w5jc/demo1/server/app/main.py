"""FastAPI 应用入口。

挂载 CORS、异常处理、路由前缀、健康检查、追踪中间件。
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.admin import router as admin_router
from app.api.v1 import router as v1_router
from app.api.v1.files import router as files_router
from app.api.realtime.routes import router as realtime_router
from app.core.config import settings
from app.core.deps import set_redis
from app.core.exceptions import BizError, internal_error
from app.core.logging import clear_context, get_logger, setup_logging
from app.core.tracing import TraceMiddleware, get_trace_id

setup_logging()
logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # 启动：初始化 Redis（可选）
    redis_client = None
    if settings.redis_enabled:
        try:
            redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
            await redis_client.ping()
            set_redis(redis_client)
            app.state.redis = redis_client
            logger.info("redis.connected")
        except Exception as e:
            logger.warning("redis.connect_failed", error=str(e))
            redis_client = None
    else:
        logger.info("redis.disabled, using memory fallback")
    # 自动建表 + 种子数据（SQLite 开发环境）
    if settings.use_sqlite:
        from app.core.database import init_db, run_migrations
        await init_db()
        await run_migrations()
        logger.info("sqlite.tables_created")
        from app.seed import seed
        try:
            await seed()
        except Exception as e:
            logger.warning("seed.failed", error=str(e))
    # 第三方服务密钥校验
    if not settings.amap_api_key:
        logger.warning("map.key_missing, map service will degrade to 503")
    if not settings.qweather_api_key:
        logger.warning("weather.key_missing, weather service will degrade to 503")
    if not settings.ai_api_key:
        logger.warning("ai.key_missing, ai service will return fallback prompt")
    # 启动订单超时定时任务
    from app.services.order_scheduler import start_order_timeout_scheduler
    start_order_timeout_scheduler()
    logger.info("app.start", env=settings.app_env, port=settings.app_port)
    yield
    # 关闭：停止定时任务 + 释放连接
    from app.services.order_scheduler import stop_order_timeout_scheduler
    stop_order_timeout_scheduler()
    if redis_client is not None:
        await redis_client.close()
    logger.info("app.stop")
    clear_context()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if settings.app_debug else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.app_debug else None,
    lifespan=lifespan,
)

# ===== 中间件 =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.app_debug else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TraceMiddleware)


# ===== 全局异常处理 =====
@app.exception_handler(BizError)
async def biz_error_handler(request: Request, exc: BizError) -> JSONResponse:
    trace_id = get_trace_id(request)
    logger.warning("biz.error", code=exc.code, message=exc.message, path=request.url.path)
    return JSONResponse(
        status_code=exc.http_status,
        content={"code": exc.code, "message": exc.message, "data": exc.details, "trace_id": trace_id},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    trace_id = get_trace_id(request)
    logger.exception("unhandled.error", path=request.url.path, error=str(exc))
    err = internal_error()
    return JSONResponse(
        status_code=500,
        content={"code": err.code, "message": err.message, "data": None, "trace_id": trace_id},
    )


# ===== 健康检查 =====
@app.get("/health", tags=["系统"])
async def health():
    return {"status": "ok"}


@app.get("/ready", tags=["系统"])
async def ready(request: Request):
    redis_client = getattr(request.app.state, "redis", None)
    if redis_client is None:
        return {"status": "ready", "redis": "disabled", "mode": "standalone"}
    try:
        await redis_client.ping()
        return {"status": "ready", "redis": "ok"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "not_ready", "redis": str(e)})


# ===== 路由挂载 =====
app.include_router(v1_router, prefix="/api/v1", tags=["用户端"])
app.include_router(files_router, prefix="/api/v1", tags=["文件"])
app.include_router(admin_router, prefix="/api/admin/v1", tags=["管理端"])
app.include_router(realtime_router, tags=["实时通信"])

# ===== 静态文件（本地上传降级） =====
import os
_static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.isdir(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static")