from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
import uuid
import aiofiles
from dotenv import load_dotenv

from src.infrastructure.messaging.kafka_event_publisher import KafkaEventPublisher
from src.infrastructure.messaging.kafka_event_consumer import KafkaEventConsumer
from src.infrastructure.services.openai_embedding_service import OpenAIEmbeddingService
from src.infrastructure.services.document_processor import DocumentProcessor
from src.infrastructure.vector_db.chroma_vector_repository import ChromaVectorRepository
from src.application.use_cases.upload_document_use_case import UploadDocumentUseCase
from src.application.use_cases.process_document_use_case import ProcessDocumentUseCase

load_dotenv()

app = FastAPI(title="Vectorization Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencies
upload_dir = os.getenv("UPLOAD_DIR", "/app/uploads")
os.makedirs(upload_dir, exist_ok=True)

event_publisher = KafkaEventPublisher()
event_consumer = KafkaEventConsumer("vectorization-service-group")
embedding_service = OpenAIEmbeddingService()
document_processor = DocumentProcessor()
vector_repository = ChromaVectorRepository()

# Inicializar colección
@app.on_event("startup")
async def startup():
    await event_publisher.connect()
    # Crear colección si no existe (vector size para text-embedding-3-small es 1536)
    await vector_repository.create_collection("documents", 1536)
    
    # Suscribirse a eventos de documentos subidos
    await event_consumer.subscribe("document.uploaded", handle_document_uploaded)

async def handle_document_uploaded(message: dict):
    """Maneja el evento de documento subido para procesarlo"""
    document_id = message.get("documentId")
    if document_id:
        # Aquí procesarías el documento
        # Por ahora solo un placeholder
        print(f"Processing document: {document_id}")

@app.on_event("shutdown")
async def shutdown():
    await event_publisher.disconnect()
    await event_consumer.stop()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/ai/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    name: Optional[str] = None,
    description: Optional[str] = None,
):
    # TODO: Validar autenticación JWT
    user_id = "temp-user-id"  # Obtener del token JWT
    
    # Guardar archivo
    file_id = str(uuid.uuid4())
    file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")
    
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    # Crear caso de uso
    upload_use_case = UploadDocumentUseCase(
        document_repository=None,  # TODO: Implementar repositorio PostgreSQL
        event_publisher=event_publisher,
        upload_dir=upload_dir,
    )
    
    document = await upload_use_case.execute(
        user_id=user_id,
        file_name=name or file.filename,
        file_path=file_path,
        description=description,
    )
    
    return {
        "success": True,
        "data": {
            "documentId": document.id,
            "name": document.name,
            "status": document.status.value,
            "message": "Document uploaded, processing will start shortly",
        },
    }

@app.get("/api/ai/documents")
async def get_documents():
    # TODO: Implementar
    return {"success": True, "data": []}

@app.delete("/api/ai/documents/{document_id}")
async def delete_document(document_id: str):
    # TODO: Implementar
    return {"success": True, "message": "Document deleted"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "3003"))
    uvicorn.run(app, host="0.0.0.0", port=port)
