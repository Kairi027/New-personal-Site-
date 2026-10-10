"""分布式追踪 - 基于 OpenTelemetry，全链路 traceId 透传。"""

from typing import Optional

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import bind_context, clear_context, get_logger

logger = get_logger("tracing")


class TraceMiddleware(BaseHTTPMiddleware):
    """从请求头提取或生成 trace_id，注入响应头与日志上下文。"""

    async def dispatch(self, request: Request, call_next):
        trace_id = request.headers.get("X-Trace-Id")
        if not trace_id:
            import uuid

            trace_id = uuid.uuid4().hex
        request.state.trace_id = trace_id
        bind_context(trace_id=trace_id)
        try:
            response = await call_next(request)
        finally:
            clear_context()
        response.headers["X-Trace-Id"] = trace_id
        return response


def get_trace_id(request: Request) -> str:
    return getattr(request.state, "trace_id", "")