"""统一异常体系 - 按模块划分错误码段。

错误码段规划：
  1xxxx 用户账户
  2xxxx 社区文化
  3xxxx 闲置交易
  4xxxx 出行规划
  5xxxx 天气助手
  6xxxx AI 智能体
  7xxxx 文件/公共
  9xxxx 管理后台
"""

from typing import Any, Optional


class BizError(Exception):
    """业务异常基类。"""

    def __init__(
        self,
        code: int,
        message: str,
        http_status: int = 400,
        details: Optional[Any] = None,
    ) -> None:
        self.code = code
        self.message = message
        self.http_status = http_status
        self.details = details
        super().__init__(message)


# ===== 1xxxx 用户账户 =====
class UserError(BizError):
    def __init__(self, code: int, message: str, **kw: Any) -> None:
        super().__init__(10000 + code, message, **kw)


# ===== 2xxxx 社区文化 =====
class CommunityError(BizError):
    def __init__(self, code: int, message: str, **kw: Any) -> None:
        super().__init__(20000 + code, message, **kw)


# ===== 3xxxx 闲置交易 =====
class TradeError(BizError):
    def __init__(self, code: int, message: str, **kw: Any) -> None:
        super().__init__(30000 + code, message, **kw)


# ===== 4xxxx 出行规划 =====
class TravelError(BizError):
    def __init__(self, code: int, message: str, **kw: Any) -> None:
        super().__init__(40000 + code, message, **kw)


# ===== 5xxxx 天气助手 =====
class WeatherError(BizError):
    def __init__(self, code: int, message: str, **kw: Any) -> None:
        super().__init__(50000 + code, message, **kw)


# ===== 6xxxx AI 智能体 =====
class AIError(BizError):
    def __init__(self, code: int, message: str, **kw: Any) -> None:
        super().__init__(60000 + code, message, **kw)


# ===== 7xxxx 文件/公共 =====
class CommonError(BizError):
    def __init__(self, code: int, message: str, **kw: Any) -> None:
        super().__init__(70000 + code, message, **kw)


# ===== 9xxxx 管理后台 =====
class AdminError(BizError):
    def __init__(self, code: int, message: str, **kw: Any) -> None:
        super().__init__(90000 + code, message, **kw)


# ===== 常用异常快捷构造 =====
def not_found(msg: str = "资源不存在") -> BizError:
    return BizError(40400, msg, http_status=404)


def unauthorized(msg: str = "未登录或登录已过期") -> BizError:
    return BizError(40100, msg, http_status=401)


def forbidden(msg: str = "无权限执行该操作") -> BizError:
    return BizError(40300, msg, http_status=403)


def rate_limited(msg: str = "请求过于频繁，请稍后再试") -> BizError:
    return BizError(42900, msg, http_status=429)


def internal_error(msg: str = "服务器内部错误") -> BizError:
    return BizError(50000, msg, http_status=500)