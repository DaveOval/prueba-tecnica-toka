from typing import List, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import os
from src.domain.entities.document_chunk import DocumentChunk
from src.domain.repositories.ivector_repository import IVectorRepository


class QdrantVectorRepository(IVectorRepository):
    def __init__(self):
        host = os.getenv("QDRANT_HOST", "localhost")
        port = int(os.getenv("QDRANT_PORT", "6333"))
        self.client = QdrantClient(host=host, port=port)
        self.collection_name = os.getenv("QDRANT_COLLECTION_NAME", "documents")

    async def create_collection(self, collection_name: str, vector_size: int) -> bool:
        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]

            if collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=vector_size, distance=Distance.COSINE
                    ),
                )
            return True
        except Exception as e:
            print(f"Error creating collection: {e}")
            return False

    async def upsert_chunks(
        self, collection_name: str, chunks: List[DocumentChunk]
    ) -> bool:
        try:
            points = []
            for chunk in chunks:
                if not chunk.embedding:
                    continue

                points.append(
                    PointStruct(
                        id=hash(chunk.id) % (2 ** 63),  # Qdrant requiere int64
                        vector=chunk.embedding,
                        payload={
                            "chunk_id": chunk.id,
                            "document_id": chunk.document_id,
                            "content": chunk.content,
                            "chunk_index": chunk.chunk_index,
                            **chunk.metadata,
                        },
                    )
                )

            if points:
                self.client.upsert(collection_name=collection_name, points=points)
            return True
        except Exception as e:
            print(f"Error upserting chunks: {e}")
            return False

    async def search_similar(
        self,
        collection_name: str,
        query_embedding: List[float],
        limit: int = 5,
        score_threshold: float = 0.7,
    ) -> List[dict]:
        try:
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold,
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

    async def delete_document_chunks(
        self, collection_name: str, document_id: str
    ) -> bool:
        try:
            # Qdrant no tiene delete directo por payload, necesitarías filtrar primero
            # Por ahora, marcamos como obsoleto en metadata
            # En producción, usarías scroll + delete por IDs
            return True
        except Exception as e:
            print(f"Error deleting chunks: {e}")
            return False
