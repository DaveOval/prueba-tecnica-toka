import json
import os
import redis.asyncio as redis
from typing import Optional, List
from datetime import datetime
from src.domain.entities.prompt_template import PromptTemplate
from src.domain.repositories.iprompt_repository import IPromptRepository


class RedisPromptRepository(IPromptRepository):
    def __init__(self):
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        self.client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True,
            socket_connect_timeout=5,
        )
        self.key_prefix = "prompt:"
        self.index_key = "prompts:index"

    def _get_key(self, prompt_id: str) -> str:
        return f"{self.key_prefix}{prompt_id}"

    async def create(self, prompt: PromptTemplate) -> PromptTemplate:
        try:
            key = self._get_key(prompt.id)
            data = {
                "id": prompt.id,
                "name": prompt.name,
                "description": prompt.description,
                "system_prompt": prompt.system_prompt,
                "user_prompt_template": prompt.user_prompt_template or "",
                "parameters": json.dumps(prompt.parameters or []),
                "created_at": prompt.created_at.isoformat(),
                "updated_at": prompt.updated_at.isoformat(),
            }
            
            # Guardar el prompt
            await self.client.hset(key, mapping=data)
            
            # Agregar a la lista de índices
            await self.client.sadd(self.index_key, prompt.id)
            
            return prompt
        except Exception as e:
            logger.error("Error creating prompt in Redis", prompt_id=prompt.id, error=str(e), exc_info=True)
            raise

    async def get_by_id(self, prompt_id: str) -> Optional[PromptTemplate]:
        try:
            key = self._get_key(prompt_id)
            data = await self.client.hgetall(key)
            
            if not data:
                return None
            
            return self._deserialize(data)
        except Exception as e:
            logger.error("Error getting prompt from Redis", prompt_id=prompt_id, error=str(e), exc_info=True)
            return None

    async def get_all(self) -> List[PromptTemplate]:
        try:
            # Obtener todos los IDs del índice
            prompt_ids = await self.client.smembers(self.index_key)
            
            prompts = []
            for prompt_id in prompt_ids:
                prompt = await self.get_by_id(prompt_id)
                if prompt:
                    prompts.append(prompt)
            
            # Ordenar por fecha de creación (más recientes primero)
            prompts.sort(key=lambda p: p.created_at, reverse=True)
            
            return prompts
        except Exception as e:
            logger.error("Error getting all prompts from Redis", error=str(e), exc_info=True)
            return []

    async def update(self, prompt: PromptTemplate) -> PromptTemplate:
        try:
            key = self._get_key(prompt.id)
            
            # Verificar que existe
            exists = await self.client.exists(key)
            if not exists:
                raise ValueError(f"Prompt {prompt.id} not found")
            
            # Actualizar datos
            prompt.updated_at = datetime.utcnow()
            data = {
                "name": prompt.name,
                "description": prompt.description,
                "system_prompt": prompt.system_prompt,
                "user_prompt_template": prompt.user_prompt_template or "",
                "parameters": json.dumps(prompt.parameters or []),
                "updated_at": prompt.updated_at.isoformat(),
            }
            
            await self.client.hset(key, mapping=data)
            
            return prompt
        except Exception as e:
            logger.error("Error updating prompt in Redis", prompt_id=prompt.id, error=str(e), exc_info=True)
            raise

    async def delete(self, prompt_id: str) -> bool:
        try:
            key = self._get_key(prompt_id)
            
            # Eliminar el prompt
            deleted = await self.client.delete(key)
            
            # Eliminar del índice
            await self.client.srem(self.index_key, prompt_id)
            
            return deleted > 0
        except Exception as e:
            logger.error("Error deleting prompt from Redis", prompt_id=prompt_id, error=str(e), exc_info=True)
            return False

    def _deserialize(self, data: dict) -> PromptTemplate:
        """Convierte datos de Redis a PromptTemplate"""
        parameters = []
        if data.get("parameters"):
            try:
                parameters = json.loads(data["parameters"])
            except:
                parameters = []
        
        return PromptTemplate(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            system_prompt=data["system_prompt"],
            user_prompt_template=data.get("user_prompt_template") or None,
            parameters=parameters,
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
        )
