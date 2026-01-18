from abc import ABC, abstractmethod
from typing import List, Optional
from src.domain.entities.document_chunk import DocumentChunk


class IVectorRepository(ABC):
    @abstractmethod
    async def create_collection(self, collection_name: str, vector_size: int) -> bool:
        pass

    @abstractmethod
    async def upsert_chunks(
        self, collection_name: str, chunks: List[DocumentChunk]
    ) -> bool:
        pass

    @abstractmethod
    async def search_similar(
        self,
        collection_name: str,
        query_embedding: List[float],
        limit: int = 5,
        score_threshold: float = 0.7,
    ) -> List[dict]:
        pass

    @abstractmethod
    async def delete_document_chunks(
        self, collection_name: str, document_id: str
    ) -> bool:
        pass
