from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
import uuid
import aiofiles
import glob
from jose import jwt, JWTError
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
        print(f"Error decoding JWT: {e}")
        return "temp-user-id"
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        return "temp-user-id"

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
        
        # 6. Publicar evento de auditoría: Documento procesado/vectorizado
        try:
            await event_publisher.publish(
                "audit.event",
                {
                    "userId": user_id,
                    "action": "UPDATE",
                    "entityType": "DOCUMENT",
                    "entityId": document_id,
                    "details": {
                        "fileName": file_name,
                        "chunks": len(document_chunks),
                        "status": "completed",
                        "message": "Document processed and vectorized successfully"
                    },
                },
            )
        except:
            pass  # No crítico si falla
        
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
        
        # Publicar evento de auditoría: Error al procesar documento
        try:
            await event_publisher.publish(
                "audit.event",
                {
                    "userId": user_id,
                    "action": "UPDATE",
                    "entityType": "DOCUMENT",
                    "entityId": document_id,
                    "details": {
                        "fileName": file_name,
                        "status": "failed",
                        "error": str(e),
                    },
                },
            )
        except:
            pass  # No crítico si falla

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
    user_id: str = Depends(get_user_id),
):
    
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
    
    # Publicar evento de auditoría: Documento subido
    try:
        await event_publisher.publish(
            "audit.event",
            {
                "userId": user_id,
                "action": "CREATE",
                "entityType": "DOCUMENT",
                "entityId": document_id,
                "details": {
                    "fileName": name or file.filename,
                    "fileSize": file_size,
                    "description": description,
                    "status": "uploaded"
                },
            },
        )
    except:
        pass  # No crítico si falla
    
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
        
        # 5. Publicar evento de procesamiento (opcional)
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
        
        # 6. Publicar evento de auditoría: Documento procesado/vectorizado
        try:
            await event_publisher.publish(
                "audit.event",
                {
                    "userId": user_id,
                    "action": "UPDATE",
                    "entityType": "DOCUMENT",
                    "entityId": document_id,
                    "details": {
                        "fileName": name or file.filename,
                        "chunks": len(document_chunks),
                        "status": "completed",
                        "message": "Document processed and vectorized successfully"
                    },
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
        
        # Publicar evento de auditoría: Error al procesar documento
        try:
            await event_publisher.publish(
                "audit.event",
                {
                    "userId": user_id,
                    "action": "UPDATE",
                    "entityType": "DOCUMENT",
                    "entityId": document_id,
                    "details": {
                        "fileName": name or file.filename if 'name' in locals() else file.filename if 'file' in locals() else "unknown",
                        "status": "failed",
                        "error": str(e),
                    },
                },
            )
        except:
            pass  # No crítico si falla
        
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/documents")
async def get_documents():
    try:
        # Intentar obtener la colección, si no existe retornar lista vacía
        try:
            collection = vector_repository.client.get_collection(name="documents")
        except Exception as e:
            # Si la colección no existe, retornar lista vacía
            if "does not exist" in str(e) or "NotFoundError" in str(type(e).__name__):
                return {"success": True, "data": []}
            raise
        
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
async def delete_document(
    document_id: str,
    user_id: str = Depends(get_user_id),
):
    
    try:
        # Obtener información del documento antes de eliminarlo para auditoría
        document_name = "unknown"
        try:
            collection = vector_repository.client.get_collection(name="documents")
            chunks_info = collection.get(
                where={"document_id": document_id},
                limit=1
            )
            if chunks_info.get('metadatas') and len(chunks_info['metadatas']) > 0:
                document_name = chunks_info['metadatas'][0].get("document_name", "unknown")
        except Exception as e:
            # Si la colección no existe, el documento tampoco existe
            if "does not exist" in str(e) or "NotFoundError" in str(type(e).__name__):
                raise HTTPException(status_code=404, detail="Document not found")
            raise
        
        # Eliminar chunks del documento de Chroma
        await vector_repository.delete_document_chunks("documents", document_id)
        
        # Publicar evento de eliminación
        try:
            await event_publisher.publish(
                "document.deleted",
                {
                    "documentId": document_id,
                },
            )
        except:
            pass  # No crítico si falla
        
        # Publicar evento de auditoría: Documento eliminado
        try:
            await event_publisher.publish(
                "audit.event",
                {
                    "userId": user_id,
                    "action": "DELETE",
                    "entityType": "DOCUMENT",
                    "entityId": document_id,
                    "details": {
                        "fileName": document_name,
                        "status": "deleted"
                    },
                },
            )
        except:
            pass  # No crítico si falla
        
        return {"success": True, "message": "Document deleted"}
    except Exception as e:
        print(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "3003"))
    uvicorn.run(app, host="0.0.0.0", port=port)
