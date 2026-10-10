"""支付适配层 - 微信支付 + 支付宝适配。"""

import abc
from typing import Any, Optional

from app.adapters.base import ExternalAdapter


class PaymentProvider(abc.ABC):
    """支付服务抽象接口。"""

    @abc.abstractmethod
    async def create_pay(self, order_id: str, amount: int, subject: str, **kwargs: Any) -> dict:
        """创建支付单。amount 单位：分"""

    @abc.abstractmethod
    async def refund(self, order_id: str, amount: int, reason: str = "") -> dict:
        """退款。"""

    @abc.abstractmethod
    async def verify_notify(self, data: dict) -> bool:
        """校验异步通知签名。"""


class WechatPayProvider(PaymentProvider, ExternalAdapter):
    """微信支付适配。"""

    name = "wechat_pay"

    async def create_pay(self, order_id: str, amount: int, subject: str, **kwargs: Any) -> dict:
        logger_msg = "wechat_pay.create_pay"
        from app.core.logging import get_logger
        get_logger("wechat_pay").info(logger_msg, order_id=order_id, amount=amount)
        return {"pay_url": f"wxpay://{order_id}", "prepay_id": f"prep_{order_id}"}

    async def refund(self, order_id: str, amount: int, reason: str = "") -> dict:
        return {"refund_id": f"refund_{order_id}", "status": "processing"}

    async def verify_notify(self, data: dict) -> bool:
        return bool(data.get("sign"))


class AlipayProvider(PaymentProvider, ExternalAdapter):
    """支付宝适配。"""

    name = "alipay"

    async def create_pay(self, order_id: str, amount: int, subject: str, **kwargs: Any) -> dict:
        return {"pay_url": f"alipay://{order_id}"}

    async def refund(self, order_id: str, amount: int, reason: str = "") -> dict:
        return {"refund_id": f"refund_{order_id}", "status": "processing"}

    async def verify_notify(self, data: dict) -> bool:
        return bool(data.get("sign"))


class ApplePayProvider(PaymentProvider, ExternalAdapter):
    """Apple Pay 适配。"""

    name = "apple_pay"

    async def create_pay(self, order_id: str, amount: int, subject: str, **kwargs: Any) -> dict:
        return {"merchant_id": "merchant.com.locallink", "payment_data": f"apple_{order_id}", "order_id": order_id}

    async def refund(self, order_id: str, amount: int, reason: str = "") -> dict:
        return {"refund_id": f"refund_{order_id}", "status": "processing"}

    async def verify_notify(self, data: dict) -> bool:
        return bool(data.get("sign"))


class GooglePayProvider(PaymentProvider, ExternalAdapter):
    """Google Pay 适配。"""

    name = "google_pay"

    async def create_pay(self, order_id: str, amount: int, subject: str, **kwargs: Any) -> dict:
        return {"gateway_merchant_id": "locallink_gpay", "payment_token": f"gpay_{order_id}", "order_id": order_id}

    async def refund(self, order_id: str, amount: int, reason: str = "") -> dict:
        return {"refund_id": f"refund_{order_id}", "status": "processing"}

    async def verify_notify(self, data: dict) -> bool:
        return bool(data.get("sign"))


wechat_pay = WechatPayProvider()
alipay = AlipayProvider()
apple_pay = ApplePayProvider()
google_pay = GooglePayProvider()


def get_payment(channel: str) -> PaymentProvider:
    """按渠道获取支付适配实例。"""
    providers = {"wechat": wechat_pay, "alipay": alipay, "apple_pay": apple_pay, "google_pay": google_pay}
    provider = providers.get(channel)
    if not provider:
        from app.core.exceptions import TradeError
        raise TradeError(400, "不支持的支付方式", http_status=400)
    return provider