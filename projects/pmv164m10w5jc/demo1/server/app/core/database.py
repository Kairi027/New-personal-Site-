"""数据库连接管理 - SQLAlchemy 异步引擎 + 会话工厂。

支持 SQLite（开发环境，零安装）和 MySQL（生产环境）。
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# SQLite 不支持连接池参数
if settings.use_sqlite:
    engine = create_async_engine(
        settings.mysql_dsn,
        echo=settings.app_debug and not settings.is_prod,
    )
else:
    engine = create_async_engine(
        settings.mysql_dsn,
        pool_size=settings.mysql_pool_size,
        max_overflow=settings.mysql_max_overflow,
        pool_pre_ping=True,
        echo=settings.app_debug and not settings.is_prod,
    )

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依赖：注入异步数据库会话。"""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """自动建表（开发环境用，SQLite 场景下调用）。"""
    from app.models.base import Base
    import app.models  # noqa: F401 确保所有模型已注册
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def run_migrations() -> None:
    """增量迁移：为存量表补充新字段（幂等执行）。"""
    from sqlalchemy import text
    async with engine.begin() as conn:
        for stmt in [
            "ALTER TABLE products ADD COLUMN locked_count INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE products ADD COLUMN total_stock INTEGER NOT NULL DEFAULT 1",
            "ALTER TABLE orders ADD COLUMN stock_mode VARCHAR(8)",
            "ALTER TABLE message_sessions ADD COLUMN clear_map TEXT",
            "ALTER TABLE products ADD COLUMN discard_time VARCHAR(32)",
            "ALTER TABLE products ADD COLUMN purge_mark BOOLEAN DEFAULT 0",
            "ALTER TABLE comments ADD COLUMN parent_id VARCHAR(64)",
            "ALTER TABLE comments ADD COLUMN reply_to_name VARCHAR(64)",
        ]:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass
        # 存量商品 total_stock 初始化为原 stock
        await conn.execute(text(
            "UPDATE products SET total_stock = stock WHERE total_stock = 1 AND stock > 1"
        ))
