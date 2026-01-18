from datetime import datetime
from typing import Optional
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message:
    def __init__(
        self,
        id: str,
        role: MessageRole,
        content: str,
        conversation_id: str,
        tokens: Optional[dict] = None,
        latency: Optional[int] = None,
        sources: Optional[list] = None,
        created_at: Optional[datetime] = None,
    ):
        self.id = id
        self.role = role
        self.content = content
        self.conversation_id = conversation_id
        self.tokens = tokens
        self.latency = latency
        self.sources = sources
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role.value,
            "content": self.content,
            "conversation_id": self.conversation_id,
            "tokens": self.tokens,
            "latency": self.latency,
            "sources": self.sources,
            "timestamp": self.created_at.isoformat(),
        }
