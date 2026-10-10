"""管理后台 API 路由 - 认证、用户管理、内容审核、商品审核、订单管理、统计、配置、推送、审计。"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_admin, PageDep, require_permission
from app.core.responses import success
from app.schemas.admin import (
    AdminCreateRequest, AdminLoginRequest, AnnouncementCreate, CategoryCreate,
    PostAuditRequest, ProductAuditRequest, RefundAuditRequest,
    SectionCreate, SensitiveWordCreate, UserStatusUpdate,
)
from app.services import admin_auth_service, admin_service
from app.services.audit_service import write_audit

router = APIRouter()


@router.get("/ping", summary="管理端连通性检测")
async def ping():
    return {"message": "pong"}


# ===== 认证 =====
@router.post("/auth/login", summary="管理员登录")
async def login(req: AdminLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip = request.client.host if request.client else None
    result = await admin_auth_service.login(db, req.username, req.password, ip)
    return success(result)


@router.post("/admins", summary="创建管理员")
async def create_admin(req: AdminCreateRequest, admin: dict = Depends(require_permission("admin:create")), db: AsyncSession = Depends(get_db)):
    result = await admin_auth_service.create_admin(db, req.username, req.password, req.real_name, req.role_ids)
    await write_audit(db, admin["admin_id"], "admin", "admin:create", target_id=result["admin_id"])
    return success(result)


# ===== 用户管理 =====
@router.get("/users", summary="用户列表")
async def list_users(page: PageDep, keyword: str = "", status: str = "", admin: dict = Depends(require_permission("user:read")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.list_users(db, page.page, page.page_size, keyword, status)
    return success(result)


@router.get("/users/{user_id}", summary="用户详情")
async def get_user(user_id: str, admin: dict = Depends(require_permission("user:read")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.get_user_detail(db, user_id)
    return success(result)


@router.put("/users/{user_id}/status", summary="冻结/解冻用户")
async def update_user_status(user_id: str, data: UserStatusUpdate, admin: dict = Depends(require_permission("user:freeze")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.update_user_status(db, user_id, data.status)
    await write_audit(db, admin["admin_id"], "admin", "user:status_update", target_type="user", target_id=user_id, content={"status": data.status})
    return success(result)


# ===== 内容审核 =====
@router.get("/posts", summary="帖子列表")
async def list_posts(page: PageDep, status: str = "", admin: dict = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    if status == "pending":
        result = await admin_service.list_pending_posts(db, page.page, page.page_size)
    else:
        result = await admin_service.list_posts(db, page.page, page.page_size)
    return success(result)


@router.get("/posts/pending", summary="待审核帖子列表")
async def list_pending_posts(page: PageDep, admin: dict = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await admin_service.list_pending_posts(db, page.page, page.page_size)
    return success(result)


@router.post("/posts/{post_id}/audit", summary="帖子审核")
async def audit_post(post_id: str, data: PostAuditRequest, admin: dict = Depends(require_permission("post:audit")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.audit_post(db, post_id, data.action, admin["admin_id"], data.reason)
    await write_audit(db, admin["admin_id"], "admin", "post:audit", target_type="post", target_id=post_id, content={"action": data.action})
    return success(result)


@router.delete("/comments/{comment_id}", summary="删除违规评论")
async def delete_comment(comment_id: str, admin: dict = Depends(require_permission("comment:delete")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.delete_comment(db, comment_id)
    await write_audit(db, admin["admin_id"], "admin", "comment:delete", target_id=comment_id)
    return success(result)


# ===== 商品审核 =====
@router.get("/products", summary="商品列表")
async def list_products(page: PageDep, status: str = "", admin: dict = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await admin_service.list_products(db, page.page, page.page_size, status)
    return success(result)


@router.post("/products/{product_id}/audit", summary="商品审核")
async def audit_product(product_id: str, data: ProductAuditRequest, admin: dict = Depends(require_permission("product:audit")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.audit_product(db, product_id, data.action, data.reason)
    await write_audit(db, admin["admin_id"], "admin", "product:audit", target_type="product", target_id=product_id)
    return success(result)


@router.post("/categories", summary="创建商品分类")
async def create_category(req: CategoryCreate, admin: dict = Depends(require_permission("category:manage")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.create_category(db, req.name, req.parent_id)
    return success(result)


# ===== 订单管理 =====
@router.get("/orders", summary="订单列表")
async def list_orders(page: PageDep, status: str = "", admin: dict = Depends(require_permission("order:read")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.list_orders(db, page.page, page.page_size, status)
    return success(result)


@router.post("/orders/{order_id}/refund/audit", summary="退款审核")
async def audit_refund(order_id: str, data: RefundAuditRequest, admin: dict = Depends(require_permission("order:refund_audit")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.audit_refund(db, order_id, data.action, data.reason)
    await write_audit(db, admin["admin_id"], "admin", "order:refund_audit", target_type="order", target_id=order_id, content={"action": data.action})
    return success(result)


# ===== 数据统计 =====
@router.get("/stats/dashboard", summary="工作台统计")
async def dashboard_stats(admin: dict = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await admin_service.dashboard_stats(db)
    return success(result)


# ===== 运营配置 =====
@router.get("/sections", summary="板块列表")
async def list_sections(admin: dict = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await admin_service.list_sections(db)
    return success(result)


@router.post("/sections", summary="创建板块")
async def create_section(req: SectionCreate, admin: dict = Depends(require_permission("section:manage")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.create_section(db, req.name, req.description, req.sort_order)
    return success(result)


@router.get("/sensitive-words", summary="敏感词列表")
async def list_sensitive_words(page: PageDep, admin: dict = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await admin_service.list_sensitive_words(db, page.page, page.page_size)
    return success(result)


@router.post("/sensitive-words", summary="添加敏感词")
async def add_sensitive_word(req: SensitiveWordCreate, admin: dict = Depends(require_permission("sensitive:manage")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.add_sensitive_word(db, req.word, req.category)
    return success(result)


@router.get("/configs", summary="系统配置")
async def get_configs(admin: dict = Depends(require_permission("config:read")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.get_configs(db)
    return success(result)


@router.put("/configs/{key}", summary="更新配置")
async def update_config(key: str, value: str, admin: dict = Depends(require_permission("config:write")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.update_config(db, key, value)
    await write_audit(db, admin["admin_id"], "admin", "config:update", target_id=key)
    return success(result)


# ===== 推送与审计 =====
@router.post("/announcements", summary="发布公告")
async def create_announcement(req: AnnouncementCreate, admin: dict = Depends(require_permission("announcement:publish")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.create_announcement(db, req.title, req.content, req.scope, req.target_user_ids)
    await write_audit(db, admin["admin_id"], "admin", "announcement:publish", target_id=result["announce_id"])
    return success(result)


@router.get("/audit-logs", summary="审计日志")
async def list_audit_logs(page: PageDep, operator_id: str = "", action: str = "", admin: dict = Depends(require_permission("audit:read")), db: AsyncSession = Depends(get_db)):
    result = await admin_service.list_audit_logs(db, page.page, page.page_size, operator_id, action)
    return success(result)
