from abc import ABC, abstractmethod
from typing import List
from src.domain.entities.document_chunk import DocumentChunk


class IDocumentProcessor(ABC):
    @abstractmethod
    async def process_file(self, file_path: str) -> List[str]:
        """Extrae texto del archivo y lo divide en chunks"""
        pass

    @abstractmethod
    async def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Divide el texto en chunks con overlap"""
        pass
