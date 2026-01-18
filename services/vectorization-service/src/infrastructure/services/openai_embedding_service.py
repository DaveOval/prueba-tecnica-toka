from typing import List
import os
from openai import AsyncOpenAI
from src.application.ports.iembedding_service import IEmbeddingService


class OpenAIEmbeddingService(IEmbeddingService):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        self.client = None
        # El cliente se inicializará lazy cuando se necesite

    def _ensure_client(self):
        """Inicializa el cliente si no está inicializado"""
        if not self.client:
            if not self.api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required")
            self.client = AsyncOpenAI(api_key=self.api_key)

    async def generate_embedding(self, text: str) -> List[float]:
        self._ensure_client()
        response = await self.client.embeddings.create(
            model=self.model,
            input=text,
        )
        return response.data[0].embedding

    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        self._ensure_client()
        response = await self.client.embeddings.create(
            model=self.model,
            input=texts,
        )
        return [item.embedding for item in response.data]
