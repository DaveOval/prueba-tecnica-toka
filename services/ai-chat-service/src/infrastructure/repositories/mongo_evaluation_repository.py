import os
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from src.infrastructure.config.logger import logger


class MongoEvaluationRepository:
    def __init__(self):
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://admin:admin@localhost:27017/audit_db?authSource=admin")
        
        db_name = "audit_db"
        try:
            uri_without_params = mongo_uri.split("?")[0]
            parts = uri_without_params.split("/")
            if len(parts) > 3:
                db_name = parts[-1] if parts[-1] else "audit_db"
        except Exception as e:
            logger.warning("Error extracting database name from URI, using default", error=str(e))
            db_name = "audit_db"
        
        logger.info("Connecting to MongoDB", 
            uri_preview=mongo_uri.split("@")[-1] if "@" in mongo_uri else mongo_uri[:50],
            database=db_name
        )
        
        self.client = AsyncIOMotorClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db.evaluations
        

    async def _ensure_indexes(self):
        """Crea índices en la colección para mejorar el rendimiento"""
        try:
            await self.collection.create_index("conversationId")
            await self.collection.create_index([("timestamp", -1)])
            await self.collection.create_index("promptTemplateId")
        except Exception as e:
            logger.warning("Error creating indexes", error=str(e))

    async def create(
        self,
        conversation_id: str,
        prompt_template_id: Optional[str],
        metrics: dict,
        quality: Optional[dict] = None,
    ) -> dict:
        """Crea una nueva evaluación y la almacena en MongoDB"""
        try:
            await self._ensure_indexes()
            
            timestamp = datetime.utcnow()
            
            evaluation = {
                "conversationId": conversation_id,
                "promptTemplateId": prompt_template_id,
                "metrics": metrics,
                "quality": quality,
                "timestamp": timestamp,
            }
            
            result = await self.collection.insert_one(evaluation)
            
            logger.debug("Evaluation saved to MongoDB", 
                evaluation_id=str(result.inserted_id),
                conversation_id=conversation_id
            )
            
            return {
                "conversationId": conversation_id,
                "promptTemplateId": prompt_template_id,
                "metrics": metrics,
                "quality": quality,
                "timestamp": timestamp,
            }
        except Exception as e:
            logger.error("Error creating evaluation in MongoDB", error=str(e), exc_info=True)
            raise

    async def get_all(self, limit: Optional[int] = None, offset: Optional[int] = None) -> tuple[List[dict], int]:
        """Obtiene todas las evaluaciones, ordenadas por timestamp (más recientes primero)"""
        try:
            total = await self.collection.count_documents({})
            
            query = self.collection.find({}).sort("timestamp", -1)
            
            if offset:
                query = query.skip(offset)
            if limit:
                query = query.limit(limit)
            
            cursor = query
            evaluations = []
            async for doc in cursor:
                evaluation = {
                    "conversationId": doc.get("conversationId", ""),
                    "promptTemplateId": doc.get("promptTemplateId"),
                    "metrics": doc.get("metrics", {}),
                    "quality": doc.get("quality"),
                    "timestamp": doc.get("timestamp"),
                }
                evaluations.append(evaluation)
            
            return evaluations, total
        except Exception as e:
            logger.error("Error getting evaluations from MongoDB", error=str(e), exc_info=True)
            return [], 0

    async def close(self):
        """Cierra la conexión a MongoDB"""
        self.client.close()
