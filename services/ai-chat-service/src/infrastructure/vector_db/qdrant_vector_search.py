from typing import List, Dict
import os
from qdrant_client import QdrantClient
from src.application.ports.ivector_search import IVectorSearch


class QdrantVectorSearch(IVectorSearch):
    def __init__(self):
        host = os.getenv("QDRANT_HOST", "localhost")
        port = int(os.getenv("QDRANT_PORT", "6333"))
        self.client = QdrantClient(host=host, port=port)
        self.collection_name = os.getenv("QDRANT_COLLECTION_NAME", "documents")

    async def search_similar(
        self, query_embedding: List[float], limit: int = 5
    ) -> List[Dict]:
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=0.7,
            )

            return [
                {
                    "id": str(result.id),
                    "score": result.score,
                    "content": result.payload.get("content", ""),
                    "document_id": result.payload.get("document_id"),
                    "chunk_index": result.payload.get("chunk_index"),
                    "metadata": {
                        k: v
                        for k, v in result.payload.items()
                        if k not in ["content", "document_id", "chunk_index"]
                    },
                }
                for result in results
            ]
        except Exception as e:
            print(f"Error searching similar: {e}")
            return []
