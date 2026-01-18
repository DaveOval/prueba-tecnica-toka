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
            print(f"[RAG] Generating embedding for query: {user_message[:100]}...")
            try:
                query_embedding = await self.embedding_service.generate_embedding(
                    user_message
                )
                print(f"[RAG] Embedding generated, length: {len(query_embedding)}")
            except Exception as e:
                print(f"[RAG] Error generating embedding: {e}")
                import traceback
                traceback.print_exc()
                raise
            
            try:
                print(f"[RAG] Searching for similar chunks...")
                context_chunks = await self.vector_search.search_similar(
                    query_embedding, limit=5  # Aumentar a 5 chunks para mejor contexto
                )
                print(f"[RAG] Found {len(context_chunks)} context chunks")
                if context_chunks:
                    for idx, chunk in enumerate(context_chunks):
                        print(f"[RAG] Chunk {idx+1}: score={chunk.get('score', 0):.3f}, doc={chunk.get('metadata', {}).get('document_name', 'unknown')}")
                else:
                    print(f"[RAG] WARNING: No context chunks found! RAG will not work properly.")
            except Exception as e:
                print(f"[RAG] Error searching similar: {e}")
                import traceback
                traceback.print_exc()
                # Continuar sin contexto en lugar de fallar
                context_chunks = []

        # 2. Construir contexto para el LLM con mejor formato
        context_text = ""
        if context_chunks:
            # Formatear contexto con información de documentos
            context_parts = []
            for idx, chunk in enumerate(context_chunks, 1):
                doc_name = chunk.get("metadata", {}).get("document_name", "Documento desconocido")
                content = chunk.get("content", "")
                score = chunk.get("score", 0)
                context_parts.append(
                    f"[Fuente {idx} - {doc_name} (Relevancia: {score:.2%})]:\n{content}"
                )
            
            context_text = "\n\n".join(context_parts)
            context_text = f"""INFORMACIÓN RELEVANTE DE LOS DOCUMENTOS:

{context_text}

INSTRUCCIONES:
- Responde la pregunta del usuario basándote ÚNICAMENTE en la información proporcionada arriba.
- Si la información no está en los documentos, di claramente que no tienes esa información en los documentos disponibles.
- Cita las fuentes cuando uses información específica de los documentos (ej: "Según el documento [nombre del documento]...").
- Sé preciso y conciso en tu respuesta.
- Si la pregunta requiere información que no está en los documentos, indica claramente que no tienes esa información.

"""
        else:
            # Si no hay contexto, informar al LLM
            print(f"[RAG] WARNING: No context chunks found. RAG will not be used.")
            context_text = """IMPORTANTE: No se encontró información relevante en los documentos vectorizados del sistema para responder esta consulta.

INSTRUCCIONES:
- Debes indicar claramente al usuario que no tienes información sobre esto en los documentos disponibles.
- Puedes ofrecer información general si es apropiado, pero siempre aclara que no proviene de los documentos del sistema.
- Ejemplo de respuesta: "No tengo información sobre [tema] en los documentos disponibles en el sistema. Sin embargo, puedo proporcionarte información general..."
"""

        # 3. Preparar mensajes para el LLM
        messages = []
        
        # System prompt base
        base_system_prompt = self.system_prompt or "Eres un asistente útil que responde preguntas basándote en el contexto proporcionado."
        
        # Si hay contexto RAG, agregarlo al system prompt
        if context_text:
            system_prompt_with_context = f"""{base_system_prompt}

{context_text}"""
            messages.append({"role": "system", "content": system_prompt_with_context})
        else:
            messages.append({"role": "system", "content": base_system_prompt})

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
