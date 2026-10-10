"""AI 智能体 API 路由 - 含 SSE 流式对话。"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.deps import get_current_user
from app.core.responses import success
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI智能体"])


class ChatRequest(BaseModel):
    session_id: str
    content: str = Field(..., min_length=1)


class SessionCreateRequest(BaseModel):
    title: str = "新对话"


@router.post("/sessions", summary="创建会话")
async def create_session(data: SessionCreateRequest, user: dict = Depends(get_current_user)):
    result = await ai_service.create_session(user["user_id"], data.title)
    return success(result)


@router.get("/sessions", summary="会话列表")
async def list_sessions(user: dict = Depends(get_current_user)):
    result = await ai_service.list_sessions(user["user_id"])
    return success(result)


@router.get("/sessions/{session_id}/messages", summary="历史消息")
async def get_history(session_id: str, user: dict = Depends(get_current_user)):
    result = await ai_service.get_history(session_id, user["user_id"])
    return success(result)


@router.delete("/sessions/{session_id}", summary="删除会话")
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    result = await ai_service.delete_session(session_id, user["user_id"])
    return success(result)


@router.post("/chat", summary="同步对话")
async def chat(data: ChatRequest, user: dict = Depends(get_current_user)):
    result = await ai_service.chat(data.session_id, user["user_id"], data.content)
    return success(result)


@router.post("/chat/stream", summary="流式对话(SSE)")
async def chat_stream(data: ChatRequest, user: dict = Depends(get_current_user)):
    async def event_generator():
        async for chunk in ai_service.chat_stream(data.session_id, user["user_id"], data.content):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")