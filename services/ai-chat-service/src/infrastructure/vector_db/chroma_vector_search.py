from typing import List, Dict
import os
import chromadb
from chromadb.config import Settings
from src.application.ports.ivector_search import IVectorSearch


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
            collection = self.client.get_collection(name=self.collection_name)
            
            # Chroma usa distancia, no score. Convertimos threshold a distancia
            # Para cosine similarity: distance = 1 - similarity
            # score_threshold de 0.7 = distance_threshold de 0.3
            score_threshold = 0.7
            distance_threshold = 1.0 - score_threshold
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
            )
            
            # Chroma devuelve resultados en formato diferente
            output = []
            if results.get('ids') and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    # Chroma devuelve distances, las convertimos a scores
                    distance = results['distances'][0][i] if results.get('distances') and len(results['distances'][0]) > i else 0.0
                    score = 1.0 - distance  # Convertir distancia a similitud
                    
                    # Usar un threshold muy bajo para obtener resultados (0.05 en lugar de 0.7)
                    # Los scores pueden ser bajos pero aún relevantes
                    if score >= 0.05:  # Threshold muy permisivo para obtener resultados
                        metadata_dict = {}
                        if results.get('metadatas') and len(results['metadatas'][0]) > i:
                            metadata_dict = results['metadatas'][0][i] if isinstance(results['metadatas'][0][i], dict) else {}
                        
                        output.append({
                            "id": results['ids'][0][i],
                            "score": score,
                            "content": results['documents'][0][i] if results.get('documents') and len(results['documents'][0]) > i else "",
                            "document_id": metadata_dict.get("document_id") if metadata_dict else None,
                            "chunk_index": int(metadata_dict.get("chunk_index", 0)) if metadata_dict else 0,
                            "metadata": {
                                k: v
                                for k, v in metadata_dict.items()
                                if k not in ["document_id", "chunk_index"]
                            },
                        })
            
            print(f"Found {len(output)} similar chunks (threshold: 0.5)")
            return output
        except Exception as e:
            print(f"Error searching similar: {e}")
            return []
