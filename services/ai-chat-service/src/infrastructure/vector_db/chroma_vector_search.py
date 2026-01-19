from typing import List, Dict
import os
import chromadb
from chromadb.config import Settings
from src.application.ports.ivector_search import IVectorSearch
from src.infrastructure.config.logger import logger


class ChromaVectorSearch(IVectorSearch):
    def __init__(self):
        host = os.getenv("CHROMA_HOST", "localhost")
        port = int(os.getenv("CHROMA_PORT", "8000"))
        self.client = chromadb.HttpClient(
            host=host,
            port=port,
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection_name = os.getenv("CHROMA_COLLECTION_NAME", "documents")

    async def search_similar(
        self, query_embedding: List[float], limit: int = 5
    ) -> List[Dict]:
        try:
            chroma_host = os.getenv('CHROMA_HOST', 'localhost')
            chroma_port = os.getenv('CHROMA_PORT', '8000')
            logger.debug("Connecting to ChromaDB", host=chroma_host, port=chroma_port, collection_name=self.collection_name)
            
            collection = self.client.get_collection(name=self.collection_name)
            logger.debug("Collection retrieved successfully", collection_name=self.collection_name)
            
            # Verificar si la colección tiene datos
            count_result = collection.count()
            logger.debug("Collection count", collection_name=self.collection_name, count=count_result)
            
            if count_result == 0:
                logger.warning("Collection is empty, no documents to search", collection_name=self.collection_name)
                return []
            
            score_threshold = 0.7
            distance_threshold = 1.0 - score_threshold
            
            logger.debug("Querying ChromaDB", limit=limit, embedding_dim=len(query_embedding))
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
            )
            logger.debug("Query completed", results_structure=list(results.keys()))
            
            # Chroma devuelve resultados en formato diferente
            output = []
            if results.get('ids') and len(results['ids'][0]) > 0:
                logger.debug("Processing results", results_count=len(results['ids'][0]))
                for i in range(len(results['ids'][0])):
                    # Chroma devuelve distances, las convertimos a scores
                    distance = results['distances'][0][i] if results.get('distances') and len(results['distances'][0]) > i else 0.0
                
                    score = 1.0 / (1.0 + distance)
                    
                    if score >= 0.5:
                        metadata_dict = {}
                        if results.get('metadatas') and len(results['metadatas'][0]) > i:
                            metadata_dict = results['metadatas'][0][i] if isinstance(results['metadatas'][0][i], dict) else {}
                        
                        content = results['documents'][0][i] if results.get('documents') and len(results['documents'][0]) > i else ""
                        doc_name = metadata_dict.get("document_name", "unknown") if metadata_dict else "unknown"
                        
                        logger.debug("Adding chunk", 
                            chunk_index=i+1,
                            document_name=doc_name,
                            content_length=len(content),
                            score=score
                        )
                        
                        output.append({
                            "id": results['ids'][0][i],
                            "score": score,
                            "content": content,
                            "document_id": metadata_dict.get("document_id") if metadata_dict else None,
                            "chunk_index": int(metadata_dict.get("chunk_index", 0)) if metadata_dict else 0,
                            "metadata": {
                                k: v
                                for k, v in metadata_dict.items()
                                if k not in ["document_id", "chunk_index"]
                            },
                        })
                    else:
                        logger.debug("Result filtered out", chunk_index=i+1, score=score)
            else:
                logger.debug("No results returned from query")
            
            logger.info("Returning similar chunks", chunks_count=len(output))
            return output
        except Exception as e:
            logger.error("Error searching similar", error=str(e), exc_info=True)
            return []
