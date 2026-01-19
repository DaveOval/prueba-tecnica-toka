from typing import List, Optional
import os
import chromadb
from chromadb.config import Settings
from src.domain.entities.document_chunk import DocumentChunk
from src.domain.repositories.ivector_repository import IVectorRepository
from src.infrastructure.config.logger import logger
from src.infrastructure.config.logger import logger


class ChromaVectorRepository(IVectorRepository):
    def __init__(self):
        host = os.getenv("CHROMA_HOST", "localhost")
        port = int(os.getenv("CHROMA_PORT", "8000"))
        self.client = chromadb.HttpClient(
            host=host,
            port=port,
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection_name = os.getenv("CHROMA_COLLECTION_NAME", "documents")

    async def create_collection(self, collection_name: str, vector_size: int) -> bool:
        try:
            # Intentar obtener la colección existente primero
            try:
                collection = self.client.get_collection(name=collection_name)
                return True
            except Exception as get_error:
                # Si falla con error '_type', la colección está corrupta, eliminarla
                if "'_type'" in str(get_error) or "_type" in str(get_error):
                    logger.warning("Collection appears corrupted, attempting to delete", collection_name=collection_name)
                    try:
                        self.client.delete_collection(name=collection_name)
                        logger.info("Deleted corrupted collection", collection_name=collection_name)
                    except Exception as delete_error:
                        logger.warning("Could not delete collection", collection_name=collection_name, error=str(delete_error))
                
                # Crear nueva colección con metadata válido (no vacío)
                try:
                    collection = self.client.create_collection(
                        name=collection_name,
                        metadata={"description": "Document embeddings collection"}
                    )
                    logger.info("Created collection", collection_name=collection_name)
                    return True
                except Exception as create_error:
                    # Si ya existe, intentar obtenerla de nuevo
                    if "already exists" in str(create_error).lower():
                        try:
                            collection = self.client.get_collection(name=collection_name)
                            return True
                        except:
                            return False
                    else:
                        logger.error("Error creating collection", collection_name=collection_name, error=str(create_error))
                        return False
        except Exception as e:
            logger.error("Error creating/accessing collection", collection_name=collection_name, error=str(e), exc_info=True)
            return False

    async def upsert_chunks(
        self, collection_name: str, chunks: List[DocumentChunk]
    ) -> bool:
        try:
            # Intentar obtener la colección existente primero
            collection = None
            try:
                collection = self.client.get_collection(name=collection_name)
            except Exception as get_error:
                # Si falla con error '_type', la colección está corrupta, eliminarla y recrearla
                if "'_type'" in str(get_error) or "_type" in str(get_error):
                    logger.warning("Collection appears corrupted, attempting to delete and recreate", collection_name=collection_name)
                    try:
                        self.client.delete_collection(name=collection_name)
                        logger.info("Deleted corrupted collection", collection_name=collection_name)
                    except Exception as delete_error:
                        logger.warning("Could not delete collection", collection_name=collection_name, error=str(delete_error))
                
                # Crear nueva colección con metadata válido (no vacío)
                try:
                    collection = self.client.create_collection(
                        name=collection_name,
                        metadata={"description": "Document embeddings collection"}
                    )
                    logger.info("Created new collection", collection_name=collection_name)
                except Exception as create_error:
                    # Si ya existe, intentar obtenerla de nuevo
                    if "already exists" in str(create_error).lower():
                        try:
                            collection = self.client.get_collection(name=collection_name)
                        except:
                            # Último recurso: usar get_or_create sin metadata problemático
                            collection = self.client.get_or_create_collection(
                                name=collection_name,
                                metadata={"description": "Document embeddings collection"}
                            )
                    else:
                        logger.error("Error creating collection", collection_name=collection_name, error=str(create_error))
                        raise Exception(f"Could not access or create collection: {create_error}")
            
            ids = []
            embeddings = []
            documents = []
            metadatas = []
            
            for chunk in chunks:
                if not chunk.embedding:
                    continue
                
                ids.append(chunk.id)
                embeddings.append(chunk.embedding)
                documents.append(chunk.content)
                clean_metadata = {
                    "document_id": str(chunk.document_id),
                    "chunk_index": str(chunk.chunk_index),
                }
                for k, v in chunk.metadata.items():
                    if isinstance(v, (str, int, float, bool)) or v is None:
                        clean_metadata[k] = str(v) if v is not None else ""
                
                metadatas.append(clean_metadata)
            
            if ids:
                collection.upsert(
                    ids=ids,
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas
                )
                logger.info("Successfully upserted chunks", collection_name=collection_name, chunks_count=len(ids))
            return True
        except Exception as e:
            logger.error("Error upserting chunks", collection_name=collection_name, error=str(e), exc_info=True)
            raise

    async def search_similar(
        self,
        collection_name: str,
        query_embedding: List[float],
        limit: int = 5,
        score_threshold: float = 0.7,
    ) -> List[dict]:
        try:
            collection = self.client.get_collection(name=collection_name)
            distance_threshold = 1.0 - score_threshold
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
            )
            
            output = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    distance = results['distances'][0][i] if results.get('distances') else 0.0
                    score = 1.0 - distance
                    
                    if score >= score_threshold:
                        output.append({
                            "id": results['ids'][0][i],
                            "score": score,
                            "content": results['documents'][0][i] if results.get('documents') else "",
                            "document_id": results['metadatas'][0][i].get("document_id") if results.get('metadatas') else None,
                            "chunk_index": int(results['metadatas'][0][i].get("chunk_index", 0)) if results.get('metadatas') else 0,
                            "metadata": {
                                k: v
                                for k, v in (results['metadatas'][0][i].items() if results.get('metadatas') else {})
                                if k not in ["document_id", "chunk_index"]
                            },
                        })
            
            return output
        except Exception as e:
            logger.error("Error searching similar", collection_name=collection_name, error=str(e), exc_info=True)
            return []

    async def delete_document_chunks(
        self, collection_name: str, document_id: str
    ) -> bool:
        try:
            collection = self.client.get_collection(name=collection_name)
            
            # Buscar todos los chunks del documento
            results = collection.get(
                where={"document_id": document_id}
            )
            
            if results['ids']:
                collection.delete(ids=results['ids'])
            
            return True
        except Exception as e:
            logger.error("Error deleting chunks", collection_name=collection_name, document_id=document_id, error=str(e), exc_info=True)
            return False
