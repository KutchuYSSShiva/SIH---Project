from pydantic import BaseModel, Field
from typing import Any

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    conversation: list[ChatMessage] = []
    language: str = "en"
    latitude: float | None = None
    longitude: float | None = None
    location_name: str | None = None
    session_id: str | None = None

class ChatResponse(BaseModel):
    text: str
    language: str
    location: dict[str, Any]
    metrics: dict[str, Any]
    advisory: str
    safety_sources: list[str] = []
    source: str
    satellite: dict[str, str]
    imd: dict[str, str]
