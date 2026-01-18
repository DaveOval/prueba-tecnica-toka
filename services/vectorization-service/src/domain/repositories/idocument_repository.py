from abc import ABC, abstractmethod
from typing import Optional, List
from src.domain.entities.document import Document


class IDocumentRepository(ABC):
    @abstractmethod
    async def create(self, document: Document) -> Document:
        pass

    @abstractmethod
    async def get_by_id(self, document_id: str) -> Optional[Document]:
        pass

    @abstractmethod
    async def get_by_user_id(self, user_id: str) -> List[Document]:
        pass

    @abstractmethod
    async def update(self, document: Document) -> Document:
        pass

    @abstractmethod
    async def delete(self, document_id: str) -> bool:
        pass
