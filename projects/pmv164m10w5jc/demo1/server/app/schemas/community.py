"""社区文化 Pydantic 模型。"""

from datetime import datetime

from pydantic import BaseModel, Field


class PostCreate(BaseModel):
    section_id: str
    title: str = Field(..., min_length=1, max_length=50)
    content: str = Field(..., min_length=1, max_length=2000)
    image_urls: list[str] = Field(default_factory=list, max_length=9)


class PostList(BaseModel):
    post_id: str
    author_id: str
    author_name: str = ""
    title: str
    content: str
    image_urls: list[str] = []
    like_count: int = 0
    comment_count: int = 0
    liked: bool = False
    created_at: datetime


class PostDetail(PostList):
    section_id: str
    status: str


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    parent_id: str | None = Field(default=None, description="父评论ID，空=一级评论")
    reply_to_name: str | None = Field(default=None, description="被回复者昵称，仅二级回复有值")


class CommentOut(BaseModel):
    comment_id: str
    post_id: str
    author_id: str
    author_name: str = ""
    content: str
    parent_id: str | None = None
    replies: list["CommentOut"] = []
    created_at: datetime


class MessageSend(BaseModel):
    session_id: str
    content: str = Field(..., min_length=1, max_length=2000)
    msg_type: str = "text"


class SessionCreate(BaseModel):
    target_user_id: str