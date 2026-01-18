import time
from typing import Optional
from src.domain.entities.message import Message, MessageRole
from src.domain.entities.conversation import Conversation
from src.application.ports.illm_service import ILLMService
from src.application.ports.ivector_search import IVectorSearch
from src.application.ports.iembedding_service import IEmbeddingService
import uuid


class SendMessageUseCase:
    def __init__(
        self,
        llm_service: ILLMService,
        vector_search: IVectorSearch,
        embedding_service: IEmbeddingService,
        system_prompt: Optional[str] = None,
    ):
        self.llm_service = llm_service
        self.vector_search = vector_search
        self.embedding_service = embedding_service
        self.system_prompt = system_prompt

    async def execute(
        self,
        user_message: str,
        conversation_id: Optional[str],
        user_id: str,
        use_rag: bool = True,
    ) -> dict:
        start_time = time.time()

        # 1. Buscar contexto relevante (RAG)
        context_chunks = []
        if use_rag:
            query_embedding = await self.embedding_service.generate_embedding(
                user_message
            )
            context_chunks = await self.vector_search.search_similar(
                query_embedding, limit=3
            )

        # 2. Construir contexto para el LLM
        context_text = ""
        if context_chunks:
            context_text = "\n\n".join(
                [chunk.get("content", "") for chunk in context_chunks]
            )
            context_text = f"Contexto relevante:\n{context_text}\n\n"

        # 3. Preparar mensajes para el LLM
        messages = []
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})

        if context_text:
            messages.append(
                {
                    "role": "system",
                    "content": f"{context_text}Responde basándote en el contexto proporcionado.",
                }
            )

        messages.append({"role": "user", "content": user_message})

        # 4. Generar respuesta del LLM
        response = await self.llm_service.generate_response(messages)

        latency = int((time.time() - start_time) * 1000)  # en milisegundos

        # 5. Preparar respuesta
        assistant_message = {
            "message": response.get("content", ""),
            "conversationId": conversation_id or str(uuid.uuid4()),
            "tokens": {
                "input": response.get("tokens", {}).get("input", 0),
                "output": response.get("tokens", {}).get("output", 0),
                "total": response.get("tokens", {}).get("total", 0),
            },
            "latency": latency,
            "sources": [
                {
                    "documentId": chunk.get("document_id"),
                    "documentName": chunk.get("metadata", {}).get("document_name", ""),
                    "relevance": chunk.get("score", 0),
                    "excerpt": chunk.get("content", "")[:200],
                }
                for chunk in context_chunks
            ],
        }

        return assistant_message
