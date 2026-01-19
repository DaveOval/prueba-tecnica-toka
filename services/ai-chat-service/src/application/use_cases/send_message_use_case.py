import time
from typing import Optional
from src.domain.entities.message import Message, MessageRole
from src.domain.entities.conversation import Conversation
from src.application.ports.illm_service import ILLMService
from src.application.ports.ivector_search import IVectorSearch
from src.application.ports.iembedding_service import IEmbeddingService
from src.infrastructure.config.logger import logger
import uuid


class SendMessageUseCase:
    def __init__(
        self,
        llm_service: ILLMService,
        vector_search: IVectorSearch,
        embedding_service: IEmbeddingService,
        system_prompt: Optional[str] = None,
        user_prompt_template: Optional[str] = None,
    ):
        self.llm_service = llm_service
        self.vector_search = vector_search
        self.embedding_service = embedding_service
        self.system_prompt = system_prompt
        self.user_prompt_template = user_prompt_template

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
            # Detectar consultas genéricas que no requieren búsqueda en documentos
            generic_queries = [
                "hola", "hi", "hello", "hey", "buenos días", "buenas tardes", "buenas noches",
                "como estas", "como estás", "qué tal", "que tal", "cómo te llamas", "como te llamas",
                "quien eres", "quién eres", "que eres", "qué eres", "ayuda", "help"
            ]
            
            message_lower = user_message.lower().strip()
            message_words = message_lower.split()
            
            # Si el mensaje es muy corto (menos de 3 palabras) y contiene solo saludos genéricos, no buscar
            is_generic = (
                len(message_words) <= 3 and 
                any(generic in message_lower for generic in generic_queries)
            ) or (
                len(message_words) <= 2  # Mensajes muy cortos probablemente son saludos
            )
            
            if is_generic:
                logger.info("Generic query detected, skipping document search", message_preview=user_message[:50])
                context_chunks = []
            else:
                logger.info("Generating embedding for query", message_preview=user_message[:100])
                try:
                    query_embedding = await self.embedding_service.generate_embedding(
                        user_message
                    )
                    logger.info("Embedding generated", embedding_length=len(query_embedding))
                except Exception as e:
                    logger.error("Error generating embedding", error=str(e), exc_info=True)
                    raise
                
                try:
                    logger.info("Searching for similar chunks")
                    context_chunks = await self.vector_search.search_similar(
                        query_embedding, limit=5  # Aumentar a 5 chunks para mejor contexto
                    )
                    logger.info("Found context chunks", chunks_count=len(context_chunks))
                    if context_chunks:
                        for idx, chunk in enumerate(context_chunks):
                            logger.debug("Context chunk found",
                                chunk_index=idx+1,
                                score=chunk.get('score', 0),
                                document_name=chunk.get('metadata', {}).get('document_name', 'unknown')
                            )
                    else:
                        logger.warning("No context chunks found, RAG will not work properly")
                except Exception as e:
                    logger.error("Error searching similar", error=str(e), exc_info=True)
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
            logger.warning("No context chunks found, RAG will not be used")
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
        
        logger.debug("Using system prompt", system_prompt_length=len(base_system_prompt))
        if self.user_prompt_template:
            logger.debug("Using user prompt template", user_template_length=len(self.user_prompt_template))
        
        # Si hay contexto RAG, agregarlo al system prompt
        if context_text:
            system_prompt_with_context = f"""{base_system_prompt}

{context_text}"""
            messages.append({"role": "system", "content": system_prompt_with_context})
            logger.debug("System prompt with RAG context", total_length=len(system_prompt_with_context))
        else:
            messages.append({"role": "system", "content": base_system_prompt})
            logger.debug("System prompt without RAG context")

        # Aplicar user prompt template si existe
        if self.user_prompt_template:
            # Si hay un template, reemplazar {message} o usar el mensaje directamente
            formatted_user_message = self.user_prompt_template.replace("{message}", user_message)
            if formatted_user_message == self.user_prompt_template:
                # Si no hay placeholder, concatenar
                formatted_user_message = f"{self.user_prompt_template}\n\n{user_message}"
            messages.append({"role": "user", "content": formatted_user_message})
            logger.debug("Using user prompt template", formatted_length=len(formatted_user_message))
        else:
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
                    "excerpt": chunk.get("content", "")[:150],  # Reducir excerpt a 150 caracteres
                }
                for chunk in context_chunks
                if chunk.get("score", 0) >= 0.5  # Solo incluir fuentes con relevancia >= 50%
            ],
        }

        return assistant_message
