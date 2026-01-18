from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

from src.infrastructure.services.openai_llm_service import OpenAILLMService
from src.infrastructure.services.openai_embedding_service import OpenAIEmbeddingService
from src.infrastructure.vector_db.qdrant_vector_search import QdrantVectorSearch
from src.application.use_cases.send_message_use_case import SendMessageUseCase

load_dotenv()

app = FastAPI(title="AI Chat Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencies
llm_service = OpenAILLMService()
embedding_service = OpenAIEmbeddingService()
vector_search = QdrantVectorSearch()

# Request models
class ChatRequest(BaseModel):
    message: str
    conversationId: Optional[str] = None
    context: Optional[dict] = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/ai/chat")
async def chat(request: ChatRequest):
    # TODO: Validar autenticación JWT
    user_id = "temp-user-id"  # Obtener del token JWT

    system_prompt = os.getenv(
        "DEFAULT_SYSTEM_PROMPT",
        "Eres un asistente útil. Responde preguntas basándote en el contexto proporcionado.",
    )

    use_case = SendMessageUseCase(
        llm_service=llm_service,
        vector_search=vector_search,
        embedding_service=embedding_service,
        system_prompt=system_prompt,
    )

    try:
        response = await use_case.execute(
            user_message=request.message,
            conversation_id=request.conversationId,
            user_id=user_id,
            use_rag=True,
        )

        return {"success": True, "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/prompts")
async def get_prompts():
    # TODO: Implementar
    return {"success": True, "data": []}


@app.post("/api/ai/prompts")
async def create_prompt():
    # TODO: Implementar
    return {"success": True, "data": {}}


@app.get("/api/ai/metrics")
async def get_metrics():
    # TODO: Implementar métricas reales
    return {
        "success": True,
        "data": {
            "totalConversations": 0,
            "totalMessages": 0,
            "totalTokens": 0,
            "totalCost": 0,
            "averageLatency": 0,
            "documentsProcessed": 0,
        },
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "3004"))
    uvicorn.run(app, host="0.0.0.0", port=port)
