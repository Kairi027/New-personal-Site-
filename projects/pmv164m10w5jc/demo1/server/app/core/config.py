"""统一配置加载模块 - 基于 Pydantic Settings，支持环境变量与 .env 文件注入。"""

from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ===== 应用 =====
    app_env: str = "dev"
    app_debug: bool = True
    app_name: str = "local-life-server"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_timezone: str = "Asia/Shanghai"

    # ===== JWT =====
    jwt_secret_key: str = Field(default="change-me", min_length=8)
    jwt_algorithm: str = "HS256"
    jwt_user_token_expire_days: int = 7
    jwt_admin_token_expire_hours: int = 2

    # ===== MySQL =====
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = "root123"
    mysql_database: str = "local_life"
    mysql_pool_size: int = 10
    mysql_max_overflow: int = 20

    # ===== Redis =====
    redis_host: str = "127.0.0.1"
    redis_port: int = 6379
    redis_password: str = ""
    redis_db: int = 0

    # ===== MongoDB =====
    mongo_host: str = "127.0.0.1"
    mongo_port: int = 27017
    mongo_user: str = ""
    mongo_password: str = ""
    mongo_database: str = "local_life"

    # ===== Elasticsearch =====
    es_host: str = "127.0.0.1"
    es_port: int = 9200
    es_user: str = ""
    es_password: str = ""

    # ===== MinIO =====
    minio_endpoint: str = "127.0.0.1:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "local-life"
    minio_secure: bool = False

    # ===== RabbitMQ =====
    rabbitmq_host: str = "127.0.0.1"
    rabbitmq_port: int = 5672
    rabbitmq_user: str = "guest"
    rabbitmq_password: str = "guest"

    # ===== 第三方服务 =====
    amap_api_key: str = ""
    qweather_api_key: str = ""
    ai_api_base: str = "https://api.openai.com/v1"
    ai_api_key: str = ""
    ai_model: str = "gpt-3.5-turbo"
    jpush_app_key: str = ""
    jpush_master_secret: str = ""
    aliyun_censor_access_key: str = ""
    aliyun_censor_access_secret: str = ""

    # ===== 限流 =====
    rate_limit_global: str = "100/minute"
    rate_limit_login: str = "5/minute"

    # ===== 中间件开关（本地开发可关闭非必须中间件） =====
    use_sqlite: bool = True
    redis_enabled: bool = False
    mongo_enabled: bool = False
    es_enabled: bool = False
    minio_enabled: bool = False
    celery_enabled: bool = False

    # ===== 派生属性 =====
    @property
    def mysql_dsn(self) -> str:
        if self.use_sqlite:
            return "sqlite+aiosqlite:///./local_life.db"
        return (
            f"mysql+aiomysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}?charset=utf8mb4"
        )

    @property
    def redis_url(self) -> str:
        pwd = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{pwd}{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def mongo_url(self) -> str:
        auth = ""
        if self.mongo_user and self.mongo_password:
            auth = f"{self.mongo_user}:{self.mongo_password}@"
        return f"mongodb://{auth}{self.mongo_host}:{self.mongo_port}"

    @property
    def es_url(self) -> str:
        return f"http://{self.es_host}:{self.es_port}"

    @property
    def rabbitmq_url(self) -> str:
        return (
            f"amqp://{self.rabbitmq_user}:{self.rabbitmq_password}"
            f"@{self.rabbitmq_host}:{self.rabbitmq_port}//"
        )

    @property
    def is_prod(self) -> bool:
        return self.app_env == "prod"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()