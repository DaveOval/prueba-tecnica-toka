from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import uuid
from datetime import datetime
from jose import jwt, JWTError
from dotenv import load_dotenv

from src.infrastructure.services.openai_llm_service import OpenAILLMService
from src.infrastructure.services.openai_embedding_service import OpenAIEmbeddingService
from src.infrastructure.vector_db.chroma_vector_search import ChromaVectorSearch
from src.infrastructure.repositories.redis_prompt_repository import RedisPromptRepository
from src.infrastructure.repositories.mongo_evaluation_repository import MongoEvaluationRepository
from src.infrastructure.messaging.kafka_event_publisher import KafkaEventPublisher
from src.application.use_cases.send_message_use_case import SendMessageUseCase
from src.domain.entities.prompt_template import PromptTemplate
from src.infrastructure.config.logger import logger

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
vector_search = ChromaVectorSearch()
prompt_repository = RedisPromptRepository()
evaluation_repository = MongoEvaluationRepository()
event_publisher = KafkaEventPublisher()

# Función helper para calcular costo basado en tokens y modelo
def calculate_cost(tokens_input: int, tokens_output: int, model: str = "gpt-4o-mini") -> dict:
    """Calcula el costo en USD basado en los tokens y el modelo usado"""
    # Precios por 1M tokens (actualizados a enero 2024)
    pricing = {
        "gpt-4o-mini": {
            "input": 0.15 / 1_000_000,  # $0.15 por 1M tokens
            "output": 0.60 / 1_000_000,  # $0.60 por 1M tokens
        },
        "gpt-4o": {
            "input": 2.50 / 1_000_000,  # $2.50 por 1M tokens
            "output": 10.00 / 1_000_000,  # $10.00 por 1M tokens
        },
        "gpt-4-turbo": {
            "input": 10.00 / 1_000_000,  # $10.00 por 1M tokens
            "output": 30.00 / 1_000_000,  # $30.00 por 1M tokens
        },
    }
    
    model_pricing = pricing.get(model, pricing["gpt-4o-mini"])
    
    cost_input = tokens_input * model_pricing["input"]
    cost_output = tokens_output * model_pricing["output"]
    cost_total = cost_input + cost_output
    
    return {
        "input": round(cost_input, 6),
        "output": round(cost_output, 6),
        "total": round(cost_total, 6),
    }


# Función de dependencia para obtener user_id del JWT
async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extrae el user_id del token JWT del header Authorization"""
    if not authorization or not authorization.startswith("Bearer "):
        # Si no hay token, retornar un ID temporal (para desarrollo)
        # En producción debería lanzar HTTPException(401)
        return "temp-user-id"
    
    try:
        token = authorization.split(" ")[1]
        jwt_secret = os.getenv("JWT_ACCESS_SECRET", "access-secret")
        
        # Decodificar el token
        decoded = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        user_id = decoded.get("userId")
        
        if not user_id:
            return "temp-user-id"
        
        return user_id
    except JWTError as e:
        # Token inválido o expirado - en producción debería lanzar HTTPException(401)
        logger.warning("Error decoding JWT", error=str(e))
        return "temp-user-id"
    except Exception as e:
        logger.warning("Error decoding JWT", error=str(e))
        return "temp-user-id"

# Request models
class ChatRequest(BaseModel):
    message: str
    conversationId: Optional[str] = None
    context: Optional[dict] = None
    promptTemplateId: Optional[str] = None
    
    class Config:
        # Permitir tanto camelCase como snake_case
        allow_population_by_field_name = True


class CreatePromptRequest(BaseModel):
    name: str
    description: str
    systemPrompt: str
    userPromptTemplate: Optional[str] = None
    parameters: Optional[List[Dict]] = None


class UpdatePromptRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    systemPrompt: Optional[str] = None
    userPromptTemplate: Optional[str] = None
    parameters: Optional[List[Dict]] = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/ai/rag/status")
async def rag_status():
    """Endpoint de diagnóstico para verificar el estado del RAG"""
    try:
        # Intentar obtener la colección
        collection = vector_search.client.get_collection(name=vector_search.collection_name)
        count = collection.count()
        
        # Intentar una búsqueda de prueba
        test_embedding = [0.0] * 1536  # Dummy embedding para prueba
        test_results = collection.query(
            query_embeddings=[test_embedding],
            n_results=1,
        )
        
        return {
            "success": True,
            "data": {
                "chroma_connected": True,
                "collection_name": vector_search.collection_name,
                "document_count": count,
                "chroma_host": os.getenv("CHROMA_HOST", "localhost"),
                "chroma_port": os.getenv("CHROMA_PORT", "8000"),
                "embedding_model": os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
                "has_documents": count > 0,
                "test_query_works": True,
            }
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return {
            "success": False,
            "error": str(e),
            "error_details": error_details,
            "data": {
                "chroma_connected": False,
                "collection_name": vector_search.collection_name,
                "document_count": 0,
                "has_documents": False,
            }
        }


@app.post("/api/ai/chat")
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_user_id),
):

    # Obtener el prompt del template si se especifica, sino usar el default
    system_prompt = os.getenv(
        "DEFAULT_SYSTEM_PROMPT",
        "Eres un asistente útil. Responde preguntas basándote en el contexto proporcionado.",
    )
    user_prompt_template = None
    
    if request.promptTemplateId:
        logger.info("Using prompt template", prompt_template_id=request.promptTemplateId)
        try:
            prompt_template = await prompt_repository.get_by_id(request.promptTemplateId)
            if prompt_template:
                system_prompt = prompt_template.system_prompt
                user_prompt_template = prompt_template.user_prompt_template
                logger.info("Loaded prompt template", 
                    prompt_name=prompt_template.name,
                    system_prompt_length=len(system_prompt),
                    has_user_template=user_prompt_template is not None,
                    user_template_length=len(user_prompt_template) if user_prompt_template else 0
                )
            else:
                logger.warning("Prompt template not found in Redis", prompt_template_id=request.promptTemplateId)
                try:
                    all_prompts = await prompt_repository.get_all()
                    logger.info("Available prompts in Redis", prompt_count=len(all_prompts))
                except Exception as e:
                    logger.error("Error listing prompts", error=str(e))
        except Exception as e:
            logger.error("Error loading prompt template", prompt_template_id=request.promptTemplateId, error=str(e), exc_info=True)
    else:
        logger.info("No prompt template ID provided, using default system prompt")

    use_case = SendMessageUseCase(
        llm_service=llm_service,
        vector_search=vector_search,
        embedding_service=embedding_service,
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
    )

    try:
        response = await use_case.execute(
            user_message=request.message,
            conversation_id=request.conversationId,
            user_id=user_id,
            use_rag=True,
        )

        # Guardar evaluación de la conversación
        try:
            tokens = response.get("tokens", {})
            model = os.getenv("LLM_MODEL", "gpt-4o-mini")
            cost = calculate_cost(
                tokens_input=tokens.get("input", 0),
                tokens_output=tokens.get("output", 0),
                model=model,
            )
            
            await evaluation_repository.create(
                conversation_id=response.get("conversationId", ""),
                prompt_template_id=request.promptTemplateId,
                metrics={
                    "latency": response.get("latency", 0),
                    "tokens": tokens,
                    "cost": cost,
                },
                quality=None,  # TODO: Implementar evaluación de calidad
            )
        except Exception as e:
            logger.warning("Error saving evaluation", error=str(e))
            # No fallar la petición si falla guardar la evaluación

        return {"success": True, "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/prompts")
async def get_prompts():
    try:
        prompts = await prompt_repository.get_all()
        return {
            "success": True,
            "data": [prompt.to_dict() for prompt in prompts]
        }
    except Exception as e:
        logger.error("Error getting prompts", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/prompts")
async def create_prompt(
    request: CreatePromptRequest,
    user_id: str = Depends(get_user_id),
):
    try:
        prompt = PromptTemplate(
            id=str(uuid.uuid4()),
            name=request.name,
            description=request.description,
            system_prompt=request.systemPrompt,
            user_prompt_template=request.userPromptTemplate,
            parameters=request.parameters or [],
        )
        
        created_prompt = await prompt_repository.create(prompt)
        
        # Publicar evento de auditoría: Prompt creado
        try:
            await event_publisher.publish(
                "audit.event",
                {
                    "userId": user_id,
                    "action": "CREATE",
                    "entityType": "PROMPT",
                    "entityId": created_prompt.id,
                    "details": {
                        "name": created_prompt.name,
                        "description": created_prompt.description,
                    },
                },
            )
        except:
            pass  # No crítico si falla
        
        return {
            "success": True,
            "data": created_prompt.to_dict()
        }
    except Exception as e:
        logger.error("Error creating prompt", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/prompts/{prompt_id}")
async def get_prompt(prompt_id: str):
    try:
        prompt = await prompt_repository.get_by_id(prompt_id)
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        return {
            "success": True,
            "data": prompt.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting prompt", prompt_id=prompt_id, error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/ai/prompts/{prompt_id}")
async def update_prompt(
    prompt_id: str,
    request: UpdatePromptRequest,
    user_id: str = Depends(get_user_id),
):
    try:
        prompt = await prompt_repository.get_by_id(prompt_id)
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        # Actualizar solo los campos proporcionados
        if request.name is not None:
            prompt.name = request.name
        if request.description is not None:
            prompt.description = request.description
        if request.systemPrompt is not None:
            prompt.system_prompt = request.systemPrompt
        if request.userPromptTemplate is not None:
            prompt.user_prompt_template = request.userPromptTemplate
        if request.parameters is not None:
            prompt.parameters = request.parameters
        
        updated_prompt = await prompt_repository.update(prompt)
        
        # Publicar evento de auditoría: Prompt actualizado
        try:
            await event_publisher.publish(
                "audit.event",
                {
                    "userId": user_id,
                    "action": "UPDATE",
                    "entityType": "PROMPT",
                    "entityId": prompt_id,
                    "details": {
                        "name": updated_prompt.name,
                        "description": updated_prompt.description,
                    },
                },
            )
        except:
            pass  # No crítico si falla
        
        return {
            "success": True,
            "data": updated_prompt.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating prompt", prompt_id=prompt_id, error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/ai/prompts/{prompt_id}")
async def delete_prompt(
    prompt_id: str,
    user_id: str = Depends(get_user_id),
):
    try:
        # Obtener información del prompt antes de eliminarlo para auditoría
        prompt = await prompt_repository.get_by_id(prompt_id)
        prompt_name = prompt.name if prompt else "unknown"
        
        deleted = await prompt_repository.delete(prompt_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        # Publicar evento de auditoría: Prompt eliminado
        try:
            await event_publisher.publish(
                "audit.event",
                {
                    "userId": user_id,
                    "action": "DELETE",
                    "entityType": "PROMPT",
                    "entityId": prompt_id,
                    "details": {
                        "name": prompt_name,
                    },
                },
            )
        except:
            pass  # No crítico si falla
        
        return {
            "success": True,
            "message": "Prompt deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting prompt", prompt_id=prompt_id, error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/evaluations")
async def get_evaluations(
    limit: Optional[int] = Query(None, description="Número máximo de evaluaciones a retornar"),
    offset: Optional[int] = Query(None, description="Número de evaluaciones a saltar"),
):
    """Obtiene las evaluaciones de las conversaciones con paginación"""
    try:
        evaluations, total = await evaluation_repository.get_all(limit=limit, offset=offset)
        
        # Convertir datetime a string ISO para JSON
        formatted_evaluations = []
        for eval in evaluations:
            formatted_eval = {
                "conversationId": eval["conversationId"],
                "promptTemplateId": eval.get("promptTemplateId"),
                "metrics": eval["metrics"],
                "quality": eval.get("quality"),
                "timestamp": eval["timestamp"].isoformat() if isinstance(eval["timestamp"], datetime) else eval["timestamp"],
            }
            formatted_evaluations.append(formatted_eval)
        
        return {
            "success": True,
            "data": formatted_evaluations,
            "total": total,
        }
    except Exception as e:
        logger.error("Error getting evaluations", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/metrics")
async def get_metrics():
    """Obtiene métricas agregadas del servicio"""
    try:
        # Obtener todas las evaluaciones para calcular métricas
        evaluations, total = await evaluation_repository.get_all(limit=1000)
        
        total_conversations = len(set(eval["conversationId"] for eval in evaluations))
        total_messages = len(evaluations)
        total_tokens = sum(eval["metrics"].get("tokens", {}).get("total", 0) for eval in evaluations)
        total_cost = sum(eval["metrics"].get("cost", {}).get("total", 0) for eval in evaluations)
        
        latencies = [eval["metrics"].get("latency", 0) for eval in evaluations if eval["metrics"].get("latency", 0) > 0]
        average_latency = sum(latencies) / len(latencies) if latencies else 0
        
        # Obtener conteo de documentos desde ChromaDB
        try:
            collection = vector_search.client.get_collection(name=vector_search.collection_name)
            documents_processed = collection.count()
        except:
            documents_processed = 0
        
        return {
            "success": True,
            "data": {
                "totalConversations": total_conversations,
                "totalMessages": total_messages,
                "totalTokens": total_tokens,
                "totalCost": total_cost,
                "averageLatency": average_latency,
                "documentsProcessed": documents_processed,
            },
        }
    except Exception as e:
        logger.error("Error getting metrics", error=str(e), exc_info=True)
        # Retornar valores por defecto si hay error
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


@app.on_event("shutdown")
async def shutdown():
    await event_publisher.disconnect()
    await evaluation_repository.close()


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "3004"))
    uvicorn.run(app, host="0.0.0.0", port=port)
