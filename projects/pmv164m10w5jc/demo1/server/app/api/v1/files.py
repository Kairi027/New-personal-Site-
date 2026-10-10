"""文件上传接口 - 校验大小与类型白名单，集成内容安全审核。"""

from fastapi import APIRouter, Depends, UploadFile, File
from typing import Annotated

from app.core.deps import get_current_user
from app.core.exceptions import CommonError
from app.core.responses import success
from app.adapters.storage_adapter import get_storage, generate_key

router = APIRouter(prefix="/files", tags=["文件"])

MAX_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "video/mp4",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".mp4"}


@router.post("/upload", summary="上传文件")
async def upload_file(
    file: Annotated[UploadFile, File()],
    user: dict = Depends(get_current_user),
):
    # 大小校验
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise CommonError(1, "文件大小超过 10MB 限制", http_status=413)

    # 类型校验
    ext = ""
    if file.filename and "." in file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise CommonError(2, f"不支持的文件类型：{ext}")
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_TYPES:
        raise CommonError(2, f"不支持的 MIME 类型：{content_type}")

    # 图片触发内容安全审核
    if content_type.startswith("image/"):
        from app.services.censor_service import censor_image
        violation = await censor_image(content, content_type)
        if violation:
            raise CommonError(3, f"图片内容违规：{violation}")

    # 上传
    key = generate_key(file.filename or "file")
    storage = get_storage()
    url = await storage.upload(content, key, content_type)

    return success({"url": url, "key": key, "size": len(content), "content_type": content_type})