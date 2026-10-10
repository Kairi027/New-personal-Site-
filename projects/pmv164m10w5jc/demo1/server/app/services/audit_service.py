"""审计日志写入服务。"""

import functools
from typing import Any, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.audit_log import AuditLog

logger = get_logger("audit")


async def write_audit(
    db: AsyncSession,
    operator_id: str,
    operator_type: str,
    action: str,
    *,
    target_type: str | None = None,
    target_id: str | None = None,
    content: dict | None = None,
    ip: str | None = None,
    trace_id: str | None = None,
) -> None:
    log = AuditLog(
        operator_id=operator_id,
        operator_type=operator_type,
        action=action,
        target_type=target_type,
        target_id=target_id,
        content=content,
        ip=ip,
        trace_id=trace_id,
    )
    db.add(log)
    await db.flush()


def audit_log(action: str, target_type: str | None = None):
    """装饰器：在管理操作完成后自动写审计日志。

    被装饰函数需接受 db: AsyncSession 与 admin: dict 参数，并返回可选的 target_id。
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            db: AsyncSession = kwargs.get("db") or args[0]
            admin: dict = kwargs.get("admin") or args[1]
            result = await func(*args, **kwargs)
            target_id = str(result) if result is not None else None
            await write_audit(
                db=db,
                operator_id=admin["admin_id"],
                operator_type="admin",
                action=action,
                target_type=target_type,
                target_id=target_id,
            )
            return result

        return wrapper

    return decorator