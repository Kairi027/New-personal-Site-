"""统一响应信封 ApiResponse[T]。

格式：{ "code": 0, "message": "ok", "data": T, "trace_id": "xxx" }
- code == 0 表示成功
- code != 0 表示业务错误，data 为 null
"""

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = Field(default=0, description="0=成功，非0=业务错误码")
    message: str = Field(default="ok")
    data: Optional[T] = None
    trace_id: Optional[str] = None

    @classmethod
    def ok(cls, data: Any = None, message: str = "ok") -> "ApiResponse":
        return cls(code=0, message=message, data=data)

    @classmethod
    def fail(cls, code: int, message: str, data: Any = None) -> "ApiResponse":
        return cls(code=code, message=message, data=data)


class PageData(BaseModel, Generic[T]):
    """分页数据信封。"""

    items: list[T]
    total: int
    page: int
    page_size: int
    has_next: bool = False


def success(data: Any = None, message: str = "ok") -> dict:
    return {"code": 0, "message": message, "data": data}


def fail(code: int, message: str, data: Any = None) -> dict:
    return {"code": code, "message": message, "data": data}