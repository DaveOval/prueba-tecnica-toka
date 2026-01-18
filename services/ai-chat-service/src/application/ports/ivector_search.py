from abc import ABC, abstractmethod
from typing import List, Dict


class IVectorSearch(ABC):
    @abstractmethod
    async def search_similar(
        self, query_embedding: List[float], limit: int = 5
    ) -> List[Dict]:
        """Busca documentos similares usando embeddings"""
        pass
