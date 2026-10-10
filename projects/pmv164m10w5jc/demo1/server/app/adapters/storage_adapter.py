"""文件存储适配层 - 抽象接口 + MinIO 实现 + 本地存储降级。"""

import abc
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("storage")


class StorageProvider(abc.ABC):
    """文件存储抽象接口。"""

    @abc.abstractmethod
    async def upload(self, data: bytes, key: str, content_type: str) -> str:
        """上传文件，返回访问 URL。"""

    @abc.abstractmethod
    async def get(self, key: str) -> bytes:
        """读取文件内容。"""

    @abc.abstractmethod
    async def delete(self, key: str) -> None:
        """删除文件。"""


class MinIOProvider(StorageProvider):
    """MinIO（S3 兼容）存储适配。"""

    def __init__(self) -> None:
        from minio import Minio

        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self.bucket = settings.minio_bucket
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except Exception as e:
            logger.error("minio.bucket_init_failed", error=str(e))

    async def upload(self, data: bytes, key: str, content_type: str) -> str:
        from io import BytesIO

        stream = BytesIO(data)
        self.client.put_object(
            self.bucket, key, stream, length=len(data), content_type=content_type
        )
        scheme = "https" if settings.minio_secure else "http"
        return f"{scheme}://{settings.minio_endpoint}/{self.bucket}/{key}"

    async def get(self, key: str) -> bytes:
        response = self.client.get_object(self.bucket, key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    async def delete(self, key: str) -> None:
        self.client.remove_object(self.bucket, key)


class LocalStorageProvider(StorageProvider):
    """本地文件系统存储降级。"""

    def __init__(self) -> None:
        self.base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "uploads")
        os.makedirs(self.base_dir, exist_ok=True)

    async def upload(self, data: bytes, key: str, content_type: str) -> str:
        file_path = os.path.join(self.base_dir, key)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(data)
        return f"/static/uploads/{key}"

    async def get(self, key: str) -> bytes:
        file_path = os.path.join(self.base_dir, key)
        with open(file_path, "rb") as f:
            return f.read()

    async def delete(self, key: str) -> None:
        file_path = os.path.join(self.base_dir, key)
        if os.path.exists(file_path):
            os.remove(file_path)


_provider: Optional[StorageProvider] = None


def get_storage() -> StorageProvider:
    global _provider
    if _provider is None:
        if settings.minio_enabled:
            _provider = MinIOProvider()
        else:
            _provider = LocalStorageProvider()
            logger.info("storage.local_fallback_active")
    return _provider


def generate_key(filename: str, prefix: str = "uploads") -> str:
    """生成按日期分目录的唯一存储 key。"""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    unique = uuid.uuid4().hex
    return f"{prefix}/{date_str}/{unique}.{ext}" if ext else f"{prefix}/{date_str}/{unique}"