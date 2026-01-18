from datetime import datetime
from typing import Optional, List


class DocumentChunk:
    def __init__(
        self,
        id: str,
        document_id: str,
        chunk_index: int,
        content: str,
        embedding: Optional[List[float]] = None,
        metadata: Optional[dict] = None,
        created_at: Optional[datetime] = None,
    ):
        self.id = id
        self.document_id = document_id
        self.chunk_index = chunk_index
        self.content = content
        self.embedding = embedding
        self.metadata = metadata or {}
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_index": self.chunk_index,
            "content": self.content,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
        }
