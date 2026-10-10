"""闲置交易 API 路由。"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user, PageDep
from app.core.responses import success
from app.schemas.trade import OrderCreate, PayRequest, ProductCreate
from app.services import trade_service

router = APIRouter(prefix="/products", tags=["闲置交易"])


@router.post("", summary="发布商品")
async def create_product(data: ProductCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.create_product(db, user["user_id"], data)
    return success(result)


@router.get("/mine", summary="我发布的商品")
async def list_my_products(page: PageDep, include_deleted: bool = False, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.list_my_products(db, user["user_id"], page.page, page.page_size, include_deleted)
    return success(result)


@router.get("/trash", summary="回收站列表")
async def list_trash_products(page: PageDep, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.list_trash_products(db, user["user_id"], page.page, page.page_size)
    return success(result)


@router.get("", summary="商品检索")
async def search_products(page: PageDep, keyword: str = "", category_id: str = "", db: AsyncSession = Depends(get_db)):
    result = await trade_service.search_products(db, keyword, category_id, page.page, page.page_size)
    return success(result)


@router.get("/{product_id}", summary="商品详情")
async def get_product(product_id: str, user: dict = Depends(get_optional_user), db: AsyncSession = Depends(get_db)):
    uid = user["user_id"] if user else None
    result = await trade_service.get_product_detail(db, product_id, uid)
    return success(result)


@router.delete("/{product_id}", summary="废弃商品（软删除进回收站）")
async def delete_product(product_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.delete_product(db, user["user_id"], product_id)
    return success(result)


@router.delete("/{product_id}/purge", summary="彻底删除商品（回收站终态标记）")
async def purge_product(product_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.purge_product(db, user["user_id"], product_id)
    return success(result)


@router.put("/{product_id}/republish", summary="编辑重发商品")
async def republish_product(product_id: str, data: ProductCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.republish_product(db, user["user_id"], product_id, data.model_dump())
    return success(result)


@router.post("/{product_id}/off-shelf", summary="商户下架商品")
async def off_shelf_product(product_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.off_shelf_product(db, user["user_id"], product_id)
    return success(result)


@router.post("/{product_id}/on-shelf", summary="商户上架商品")
async def on_shelf_product(product_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.on_shelf_product(db, user["user_id"], product_id)
    return success(result)


order_router = APIRouter(prefix="/orders", tags=["订单"])


@order_router.get("", summary="我的订单列表")
async def list_orders(page: int = 1, page_size: int = 20, keyword: str = "", status: str = "", order_no: str = "", role: str = "", user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.list_orders(db, user["user_id"], page, page_size, keyword, status, order_no, role)
    return success(result)


@order_router.get("/{order_id}", summary="订单详情")
async def get_order(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.get_order_detail(db, order_id, user["user_id"])
    return success(result)


@order_router.post("", summary="下单")
async def create_order(data: OrderCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.create_order(db, user["user_id"], data.product_id)
    return success(result)


@order_router.post("/{order_id}/pay", summary="发起支付")
async def pay_order(order_id: str, data: PayRequest, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.pay_order(db, order_id, user["user_id"], data.channel)
    return success(result)


@order_router.post("/{order_id}/ship", summary="确认发货")
async def ship_order(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.ship_order(db, order_id, user["user_id"])
    return success(result)


@order_router.post("/{order_id}/receive", summary="确认收货")
async def receive_order(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.receive_order(db, order_id, user["user_id"])
    return success(result)


@order_router.post("/{order_id}/confirm", summary="确认收货")
async def confirm_order(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.receive_order(db, order_id, user["user_id"])
    return success(result)


@order_router.post("/{order_id}/refund", summary="申请退款（兼容）")
async def refund_order(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.refund_apply(db, order_id, user["user_id"])
    return success(result)


@order_router.post("/{order_id}/refund-apply", summary="买家申请退款")
async def refund_apply(order_id: str, data: dict = None, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    reason = (data or {}).get("reason", "")
    result = await trade_service.refund_apply(db, order_id, user["user_id"], reason)
    return success(result)


@order_router.post("/{order_id}/refund-agree", summary="卖家同意退款")
async def refund_agree(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.refund_agree(db, order_id, user["user_id"])
    return success(result)


@order_router.post("/{order_id}/refund-reject", summary="卖家拒绝退款")
async def refund_reject(order_id: str, data: dict = None, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    reason = (data or {}).get("reason", "")
    result = await trade_service.refund_reject(db, order_id, user["user_id"], reason)
    return success(result)


@order_router.get("/{order_id}/pay-channels", summary="可用支付渠道")
async def pay_channels(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.trade_service import _get_order, _check_product_on_sale
    order = await _get_order(db, order_id)
    if order.buyer_id != user["user_id"]:
        from app.core.exceptions import TradeError
        raise TradeError(301, "身份校验失败", http_status=403)
    if order.status != "pending_pay":
        from app.core.exceptions import TradeError
        raise TradeError(201, "订单状态非法", http_status=409)
    await _check_product_on_sale(db, order.product_id)
    channels = [
        {"channel": "wechat", "name": "微信支付", "icon": "wechat", "available": True, "disabled_reason": None},
        {"channel": "alipay", "name": "支付宝", "icon": "alipay", "available": True, "disabled_reason": None},
        {"channel": "apple_pay", "name": "Apple Pay", "icon": "apple", "available": True, "disabled_reason": None},
        {"channel": "google_pay", "name": "Google Pay", "icon": "google", "available": True, "disabled_reason": None},
    ]
    return success(channels)


@order_router.post("/{order_id}/notify", summary="支付回调（模拟）")
async def pay_notify(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.handle_pay_notify(db, order_id, f"mock_{order_id}")
    return success(result)


@order_router.post("/{order_id}/cancel", summary="取消订单（释放商品锁定）")
async def cancel_order(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await trade_service.cancel_expired_order(db, order_id)
    return success(result)