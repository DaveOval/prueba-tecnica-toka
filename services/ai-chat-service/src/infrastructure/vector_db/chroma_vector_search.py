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
            print(f"[ChromaVectorSearch] Connecting to ChromaDB at {os.getenv('CHROMA_HOST', 'localhost')}:{os.getenv('CHROMA_PORT', '8000')}")
            print(f"[ChromaVectorSearch] Collection name: {self.collection_name}")
            
            collection = self.client.get_collection(name=self.collection_name)
            print(f"[ChromaVectorSearch] Collection retrieved successfully")
            
            # Verificar si la colección tiene datos
            count_result = collection.count()
            print(f"[ChromaVectorSearch] Collection has {count_result} items")
            
            if count_result == 0:
                print(f"[ChromaVectorSearch] WARNING: Collection is empty! No documents to search.")
                return []
            
            score_threshold = 0.7
            distance_threshold = 1.0 - score_threshold
            
            print(f"[ChromaVectorSearch] Querying with limit={limit}, embedding_dim={len(query_embedding)}")
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
            )
            print(f"[ChromaVectorSearch] Query completed. Results structure: {list(results.keys())}")
            
            # Chroma devuelve resultados en formato diferente
            output = []
            if results.get('ids') and len(results['ids'][0]) > 0:
                print(f"[ChromaVectorSearch] Processing {len(results['ids'][0])} results")
                for i in range(len(results['ids'][0])):
                    # Chroma devuelve distances, las convertimos a scores
                    distance = results['distances'][0][i] if results.get('distances') and len(results['distances'][0]) > i else 0.0
                
                    score = 1.0 / (1.0 + distance)
                    
                    print(f"[ChromaVectorSearch] Result {i+1}: distance={distance:.4f}, score={score:.4f}")
                    
                    if score >= 0.5:
                        metadata_dict = {}
                        if results.get('metadatas') and len(results['metadatas'][0]) > i:
                            metadata_dict = results['metadatas'][0][i] if isinstance(results['metadatas'][0][i], dict) else {}
                        
                        content = results['documents'][0][i] if results.get('documents') and len(results['documents'][0]) > i else ""
                        doc_name = metadata_dict.get("document_name", "unknown") if metadata_dict else "unknown"
                        
                        print(f"[ChromaVectorSearch] Adding chunk {i+1}: doc={doc_name}, content_length={len(content)}")
                        
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
                        print(f"[ChromaVectorSearch] Result {i+1} filtered out (score {score:.4f} < 0.05)")
            else:
                print(f"[ChromaVectorSearch] No results returned from query")
            
            print(f"[ChromaVectorSearch] Returning {len(output)} similar chunks")
            return output
        except Exception as e:
            print(f"[ChromaVectorSearch] ERROR searching similar: {e}")
            import traceback
            traceback.print_exc()
            return []
