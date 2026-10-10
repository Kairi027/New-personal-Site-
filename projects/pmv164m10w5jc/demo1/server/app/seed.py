"""种子数据初始化 - 创建管理员、板块、示例帖子/商品等。

运行: python -m app.seed
"""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import async_session_factory, init_db
from app.core.security import hash_password
from app.models.admin import AdminUser, Permission, Role, admin_user_role, role_permission
from app.models.community import Post, Section
from app.models.trade import Category, Product
from app.models.user import User

PERMISSIONS = [
    "user:read", "user:freeze",
    "post:audit", "comment:delete",
    "product:audit", "category:manage",
    "order:read", "order:refund_audit",
    "section:manage", "sensitive:manage",
    "config:read", "config:write",
    "announcement:publish", "audit:read",
    "admin:create",
]


async def seed() -> None:
    await init_db()

    async with async_session_factory() as db:
        # 1. 管理员
        admin = await db.scalar(select(AdminUser).where(AdminUser.username == "admin"))
        if not admin:
            admin = AdminUser(
                admin_id=uuid.uuid4().hex,
                username="admin",
                password_hash=hash_password("admin123456"),
                real_name="超级管理员",
            )
            db.add(admin)
            await db.flush()
            print("[seed] 管理员已创建: admin / admin123456")
        else:
            print("[seed] 管理员已存在")

        # 2. 权限 + 超级角色
        perm_ids = {}
        for code in PERMISSIONS:
            perm = await db.scalar(select(Permission).where(Permission.code == code))
            if not perm:
                perm = Permission(permission_id=uuid.uuid4().hex, code=code, name=code, module="system")
                db.add(perm)
                await db.flush()
            perm_ids[code] = perm.permission_id

        role = await db.scalar(select(Role).where(Role.name == "超级管理员"))
        if not role:
            role = Role(role_id=uuid.uuid4().hex, name="超级管理员", is_super=True)
            db.add(role)
            await db.flush()
            for pid in perm_ids.values():
                await db.execute(role_permission.insert().values(role_id=role.role_id, permission_id=pid))
            await db.execute(admin_user_role.insert().values(admin_id=admin.admin_id, role_id=role.role_id))
            await db.flush()
            print("[seed] 超级管理员角色已创建")
        else:
            print("[seed] 角色已存在")

        # 3. 社区板块
        sections_data = [
            ("default", "综合广场", "默认综合板块", 0),
            ("life", "生活日常", "生活分享", 1),
            ("food", "美食探店", "美食推荐", 2),
            ("secondhand", "二手闲置", "闲置物品", 3),
        ]
        section_map = {}
        for sid, name, desc, order in sections_data:
            sec = await db.scalar(select(Section).where(Section.section_id == sid))
            if not sec:
                sec = Section(section_id=sid, name=name, description=desc, sort_order=order)
                db.add(sec)
                await db.flush()
            section_map[sid] = sec
        print("[seed] 社区板块已就绪")

        # 4. 普通用户
        user = await db.scalar(select(User).where(User.account == "demo@example.com"))
        if not user:
            user = User(
                user_id=uuid.uuid4().hex,
                account="demo@example.com",
                password_hash=hash_password("demo123456"),
                nickname="演示用户",
                status="active",
                register_time=datetime.now(timezone.utc).isoformat(),
            )
            db.add(user)
            await db.flush()
            print("[seed] 演示用户已创建: demo@example.com / demo123456")
        else:
            print("[seed] 演示用户已存在")

        # 4.1 第二个用户（卖家2，让demo用户能买到商品）
        seller2 = await db.scalar(select(User).where(User.account == "seller2@example.com"))
        if not seller2:
            seller2 = User(
                user_id=uuid.uuid4().hex,
                account="seller2@example.com",
                password_hash=hash_password("seller123456"),
                nickname="好物小铺",
                status="active",
                register_time=datetime.now(timezone.utc).isoformat(),
            )
            db.add(seller2)
            await db.flush()
            print("[seed] 卖家2已创建: seller2@example.com / seller123456")
        else:
            print("[seed] 卖家2已存在")

        # 5. 示例帖子
        posts_data = [
            ("default", "欢迎来到本地生活社区！", "这里是本地生活综合服务系统，大家可以在这里分享生活、交流经验、发布闲置物品。"),
            ("life", "今天天气真好", "阳光明媚，适合出门散步，推荐大家去附近的公园走走。"),
            ("food", "推荐一家好吃的面馆", "在小区门口新开了一家面馆，牛肉面特别好吃，分量足价格实惠，推荐大家去试试。"),
            ("secondhand", "闲置自行车转让", "九成新山地自行车，买了半年没怎么骑，现在转让，有意向的私信联系。"),
        ]
        for sid, title, content in posts_data:
            existing = await db.scalar(select(Post).where(Post.title == title))
            if not existing:
                post = Post(
                    post_id=uuid.uuid4().hex,
                    author_id=user.user_id,
                    section_id=sid,
                    title=title,
                    content=content,
                    status="published",
                )
                db.add(post)
                await db.flush()
        print("[seed] 示例帖子已就绪")

        # 6. 商品分类
        categories_data = [
            ("electronics", "电子产品", None),
            ("daily", "生活用品", None),
            ("clothing", "服装鞋包", None),
        ]
        cat_map = {}
        for cid, name, parent in categories_data:
            cat = await db.scalar(select(Category).where(Category.category_id == cid))
            if not cat:
                cat = Category(category_id=cid, name=name)
                db.add(cat)
                await db.flush()
            cat_map[cid] = cat
        print("[seed] 商品分类已就绪")

        # 7. 示例商品
        products_data = [
            ("electronics", "二手iPad Air", "九成新iPad Air，64G WiFi版，带保护壳和贴膜，无划痕。", 120000, user.user_id, "微信: demo_user"),
            ("daily", "电热水壶", "美的电热水壶，1.7L大容量，使用一年，功能正常。", 3500, user.user_id, "微信: demo_user"),
            ("clothing", "运动鞋", "Nike跑步鞋42码，穿过两次，几乎全新。", 8900, user.user_id, "微信: demo_user"),
            ("electronics", "二手Kindle", "Kindle Paperwhite 5代，8成新，带原装皮套。", 4500, seller2.user_id, "QQ: 123456"),
            ("daily", "便携咖啡机", "Wacaco迷你手压咖啡机，用过几次，出远门带上很方便。", 6800, seller2.user_id, "手机: 13800138000"),
        ]
        for cid, title, desc, price_cents, seller_id, contact in products_data:
            existing = await db.scalar(select(Product).where(Product.title == title))
            if not existing:
                product = Product(
                    product_id=uuid.uuid4().hex,
                    seller_id=seller_id,
                    category_id=cid,
                    title=title,
                    description=desc,
                    price_cents=price_cents,
                    status="on_sale" if seller_id == seller2.user_id else "pending",
                    contact=contact,
                    stock=1,
                    locked_count=0,
                    total_stock=1,
                )
                db.add(product)
                await db.flush()
        print("[seed] 示例商品已就绪")

        await db.commit()
        print("[seed] 种子数据初始化完成!")


if __name__ == "__main__":
    asyncio.run(seed())