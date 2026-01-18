from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
import uuid
import aiofiles
import glob
from datetime import datetime
from dotenv import load_dotenv

from src.infrastructure.messaging.kafka_event_publisher import KafkaEventPublisher
from src.infrastructure.messaging.kafka_event_consumer import KafkaEventConsumer
from src.infrastructure.services.openai_embedding_service import OpenAIEmbeddingService
from src.infrastructure.services.document_processor import DocumentProcessor
from src.infrastructure.vector_db.chroma_vector_repository import ChromaVectorRepository

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

# Inicializar colección (lazy - se crea cuando se necesita)
@app.on_event("startup")
async def startup():
    print("Application startup complete")

async def handle_document_uploaded(message: dict):
    """Maneja el evento de documento subido para procesarlo"""
    document_id = message.get("documentId")
    file_path = message.get("filePath")
    user_id = message.get("userId")
    file_name = message.get("fileName", "unknown")
    
    if not document_id or not file_path:
        print(f"Missing documentId or filePath in message: {message}")
        return
    
    try:
        print(f"Processing document {document_id}: {file_path}")
        
        # 1. Procesar archivo y obtener chunks de texto
        text_chunks = await document_processor.process_file(file_path)
        print(f"Document {document_id}: Extracted {len(text_chunks)} chunks")
        
        if not text_chunks:
            raise ValueError("No text chunks extracted from document")
        
        # 2. Generar embeddings para todos los chunks
        embeddings = await embedding_service.generate_embeddings_batch(text_chunks)
        print(f"Document {document_id}: Generated {len(embeddings)} embeddings")
        
        # 3. Crear entidades DocumentChunk
        from src.domain.entities.document_chunk import DocumentChunk
        document_chunks = []
        for idx, (text, embedding) in enumerate(zip(text_chunks, embeddings)):
            chunk = DocumentChunk(
                id=f"{document_id}_{idx}",
                document_id=document_id,
                chunk_index=idx,
                content=text,
                embedding=embedding,
                metadata={
                    "document_name": file_name,
                    "user_id": user_id,
                },
            )
            document_chunks.append(chunk)
        
        # 4. Guardar chunks en Chroma
        await vector_repository.upsert_chunks("documents", document_chunks)
        print(f"Document {document_id}: Saved {len(document_chunks)} chunks to Chroma")
        
        # 5. Publicar evento de completado
        await event_publisher.publish(
            "document.processed",
            {
                "documentId": document_id,
                "userId": user_id,
                "chunks": len(document_chunks),
                "status": "completed",
            },
        )
        
        print(f"Document {document_id} processed successfully!")
        
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        import traceback
        traceback.print_exc()
        
        # Publicar evento de error
        await event_publisher.publish(
            "document.processing.failed",
            {
                "documentId": document_id,
                "userId": user_id,
                "error": str(e),
            },
        )

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
    
    # Validar tipo de archivo (solo PDF)
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension != ".pdf":
        raise HTTPException(
            status_code=400, 
            detail=f"Only PDF files are allowed. Received: {file_extension}"
        )
    
    # Validar tamaño de archivo
    max_size_mb = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    max_size_bytes = max_size_mb * 1024 * 1024
    
    # Leer contenido para validar tamaño
    content = await file.read()
    file_size = len(content)
    
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {max_size_mb}MB. "
                   f"File size: {(file_size / 1024 / 1024):.2f}MB"
        )
    
    # Guardar archivo
    document_id = str(uuid.uuid4())
    file_path = os.path.join(upload_dir, f"{document_id}_{file.filename}")
    
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
    
    try:
        # Asegurar que la colección existe (lazy creation)
        try:
            await vector_repository.create_collection("documents", 1536)
        except:
            pass  # Ya existe o se creará automáticamente
        
        # Procesar directamente
        print(f"Processing document {document_id}: {file_path}")
        
        # 1. Procesar archivo y obtener chunks
        text_chunks = await document_processor.process_file(file_path)
        
        if not text_chunks:
            raise HTTPException(status_code=400, detail="No text could be extracted from document")
        
        # 2. Generar embeddings
        embeddings = await embedding_service.generate_embeddings_batch(text_chunks)
        
        # 3. Crear chunks
        from src.domain.entities.document_chunk import DocumentChunk
        document_chunks = []
        for idx, (text, embedding) in enumerate(zip(text_chunks, embeddings)):
            chunk = DocumentChunk(
                id=f"{document_id}_{idx}",
                document_id=document_id,
                chunk_index=idx,
                content=text,
                embedding=embedding,
                metadata={
                    "document_name": name or file.filename,
                    "user_id": user_id,
                    "description": description,
                },
            )
            document_chunks.append(chunk)
        
        # 4. Guardar en Chroma
        upsert_result = await vector_repository.upsert_chunks("documents", document_chunks)
        if not upsert_result:
            raise HTTPException(status_code=500, detail="Failed to save document chunks to vector database")
        
        # 5. Publicar evento (opcional)
        try:
            await event_publisher.publish(
                "document.processed",
                {
                    "documentId": document_id,
                    "userId": user_id,
                    "chunks": len(document_chunks),
                    "status": "completed",
                },
            )
        except:
            pass  # No crítico si falla
        
        return {
            "success": True,
            "data": {
                "documentId": document_id,
                "name": name or file.filename,
                "chunks": len(document_chunks),
                "status": "completed",
                "message": "Document processed and vectorized successfully",
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing document: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/documents")
async def get_documents():
    try:
        # Obtener todos los chunks de Chroma para agrupar por documento
        collection = vector_repository.client.get_collection(name="documents")
        
        # Obtener todos los chunks (sin filtro)
        all_chunks = collection.get(limit=10000)  # Límite alto para obtener todos
        
        # Agrupar por document_id
        documents_dict = {}
        
        if all_chunks.get('ids') and len(all_chunks['ids']) > 0:
            for i in range(len(all_chunks['ids'])):
                metadata = all_chunks['metadatas'][i] if all_chunks.get('metadatas') and len(all_chunks['metadatas']) > i else {}
                document_id = metadata.get("document_id")
                
                if not document_id:
                    continue
                
                if document_id not in documents_dict:
                    # Obtener información del archivo si existe
                    file_path = os.path.join(upload_dir, f"{document_id}_*")
                    matching_files = glob.glob(file_path)
                    file_size = 0
                    uploaded_at = None
                    
                    if matching_files:
                        actual_file = matching_files[0]
                        if os.path.exists(actual_file):
                            file_size = os.path.getsize(actual_file)
                            uploaded_at = os.path.getmtime(actual_file)
                    
                    documents_dict[document_id] = {
                        "id": document_id,
                        "name": metadata.get("document_name", "Sin nombre"),
                        "description": metadata.get("description", ""),
                        "chunks": 0,
                        "status": "completed",
                        "size": file_size,
                        "uploadedAt": uploaded_at,
                    }
                
                documents_dict[document_id]["chunks"] += 1
        
        # Convertir a lista y ordenar por fecha de subida (más recientes primero)
        documents_list = list(documents_dict.values())
        documents_list.sort(key=lambda x: x.get("uploadedAt", 0), reverse=True)
        
        # Convertir timestamps a ISO format
        for doc in documents_list:
            if doc.get("uploadedAt"):
                doc["uploadedAt"] = datetime.fromtimestamp(doc["uploadedAt"]).isoformat()
            else:
                doc["uploadedAt"] = datetime.utcnow().isoformat()
        
        return {"success": True, "data": documents_list}
    except Exception as e:
        print(f"Error getting documents: {e}")
        import traceback
        traceback.print_exc()
        # Si hay error, retornar lista vacía en lugar de fallar
        return {"success": True, "data": []}

@app.delete("/api/ai/documents/{document_id}")
async def delete_document(document_id: str):
    try:
        # Eliminar chunks del documento de Chroma
        await vector_repository.delete_document_chunks("documents", document_id)
        
        # Publicar evento de eliminación
        await event_publisher.publish(
            "document.deleted",
            {
                "documentId": document_id,
            },
        )
        
        return {"success": True, "message": "Document deleted"}
    except Exception as e:
        print(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "3003"))
    uvicorn.run(app, host="0.0.0.0", port=port)
