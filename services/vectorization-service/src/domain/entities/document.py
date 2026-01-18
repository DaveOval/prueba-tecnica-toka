from datetime import datetime
from typing import Optional
from enum import Enum


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document:
    def __init__(
        self,
        id: str,
        name: str,
        user_id: str,
        status: DocumentStatus,
        chunks: int = 0,
        file_path: Optional[str] = None,
        description: Optional[str] = None,
        size: int = 0,
        error_message: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.name = name
        self.user_id = user_id
        self.status = status
        self.chunks = chunks
        self.file_path = file_path
        self.description = description
        self.size = size
        self.error_message = error_message
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "user_id": self.user_id,
            "status": self.status.value,
            "chunks": self.chunks,
            "description": self.description,
            "size": self.size,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
