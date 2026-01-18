import sys
from unittest.mock import MagicMock

sys.modules['redis'] = MagicMock()
sys.modules['redis.asyncio'] = MagicMock()

import pytest
from unittest.mock import AsyncMock, Mock, patch
from src.infrastructure.repositories.redis_prompt_repository import RedisPromptRepository
from src.domain.entities.prompt_template import PromptTemplate


class TestRedisPromptRepository:
    @pytest.fixture
    def repository(self):
        with patch('src.infrastructure.repositories.redis_prompt_repository.redis.Redis') as mock_redis:
            repo = RedisPromptRepository()
            repo.client = mock_redis.return_value
            return repo

    @pytest.mark.asyncio
    async def test_create_prompt(self, repository, sample_prompt_template):
        """Test de creación de prompt"""
        repository.client.hset = AsyncMock()
        repository.client.sadd = AsyncMock()
        
        result = await repository.create(sample_prompt_template)
        
        assert result.id == sample_prompt_template.id
        repository.client.hset.assert_called_once()
        repository.client.sadd.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_by_id_found(self, repository, sample_prompt_template):
        """Test de obtención de prompt existente"""
        repository.client.hgetall = AsyncMock(return_value={
            "id": sample_prompt_template.id,
            "name": sample_prompt_template.name,
            "description": sample_prompt_template.description,
            "system_prompt": sample_prompt_template.system_prompt,
            "user_prompt_template": sample_prompt_template.user_prompt_template or "",
            "parameters": "[]",
            "created_at": sample_prompt_template.created_at.isoformat(),
            "updated_at": sample_prompt_template.updated_at.isoformat(),
        })
        
        result = await repository.get_by_id(sample_prompt_template.id)
        
        assert result is not None
        assert result.id == sample_prompt_template.id
        assert result.name == sample_prompt_template.name

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, repository):
        """Test de obtención de prompt inexistente"""
        repository.client.hgetall = AsyncMock(return_value={})
        
        result = await repository.get_by_id("non-existent")
        
        assert result is None

    @pytest.mark.asyncio
    async def test_get_all(self, repository, sample_prompt_template):
        """Test de obtención de todos los prompts"""
        repository.client.smembers = AsyncMock(return_value={sample_prompt_template.id})
        repository.client.hgetall = AsyncMock(return_value={
            "id": sample_prompt_template.id,
            "name": sample_prompt_template.name,
            "description": sample_prompt_template.description,
            "system_prompt": sample_prompt_template.system_prompt,
            "user_prompt_template": sample_prompt_template.user_prompt_template or "",
            "parameters": "[]",
            "created_at": sample_prompt_template.created_at.isoformat(),
            "updated_at": sample_prompt_template.updated_at.isoformat(),
        })
        
        result = await repository.get_all()
        
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0].id == sample_prompt_template.id

    @pytest.mark.asyncio
    async def test_get_all_empty(self, repository):
        """Test de obtención cuando no hay prompts"""
        repository.client.smembers = AsyncMock(return_value=set())
        
        result = await repository.get_all()
        
        assert result == []

    @pytest.mark.asyncio
    async def test_update_prompt(self, repository, sample_prompt_template):
        """Test de actualización de prompt"""
        repository.client.exists = AsyncMock(return_value=True)
        repository.client.hset = AsyncMock()
        
        sample_prompt_template.name = "Updated Name"
        result = await repository.update(sample_prompt_template)
        
        assert result.name == "Updated Name"
        repository.client.hset.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_prompt_not_found(self, repository, sample_prompt_template):
        """Test de actualización de prompt inexistente"""
        repository.client.exists = AsyncMock(return_value=False)
        
        with pytest.raises(ValueError, match="not found"):
            await repository.update(sample_prompt_template)

    @pytest.mark.asyncio
    async def test_delete_prompt(self, repository):
        """Test de eliminación de prompt"""
        repository.client.delete = AsyncMock(return_value=1)
        repository.client.srem = AsyncMock()
        
        result = await repository.delete("prompt-1")
        
        assert result is True
        repository.client.delete.assert_called_once()
        repository.client.srem.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_prompt_not_found(self, repository):
        """Test de eliminación de prompt inexistente"""
        repository.client.delete = AsyncMock(return_value=0)
        repository.client.srem = AsyncMock()
        
        result = await repository.delete("non-existent")
        
        assert result is False
