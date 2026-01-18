import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.infrastructure.services.openai_embedding_service import OpenAIEmbeddingService


class TestOpenAIEmbeddingService:
    @pytest.fixture
    def service(self):
        return OpenAIEmbeddingService()

    @pytest.mark.asyncio
    async def test_generate_embedding(self, service):
        """Test de generación de embedding único"""
        mock_response = Mock()
        mock_response.data = [Mock(embedding=[0.1] * 1536)]
        
        with patch.object(service, '_ensure_client'):
            service.client = AsyncMock()
            service.client.embeddings.create = AsyncMock(return_value=mock_response)
            
            embedding = await service.generate_embedding("test text")
            
            assert isinstance(embedding, list)
            assert len(embedding) == 1536
            service.client.embeddings.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_embeddings_batch(self, service):
        """Test de generación de embeddings en batch"""
        mock_response = Mock()
        mock_response.data = [
            Mock(embedding=[0.1] * 1536),
            Mock(embedding=[0.2] * 1536),
            Mock(embedding=[0.3] * 1536),
        ]
        
        with patch.object(service, '_ensure_client'):
            service.client = AsyncMock()
            service.client.embeddings.create = AsyncMock(return_value=mock_response)
            
            texts = ["text 1", "text 2", "text 3"]
            embeddings = await service.generate_embeddings_batch(texts)
            
            assert isinstance(embeddings, list)
            assert len(embeddings) == 3
            assert all(len(emb) == 1536 for emb in embeddings)
            service.client.embeddings.create.assert_called_once_with(
                model=service.model,
                input=texts,
            )

    @pytest.mark.asyncio
    async def test_ensure_client_without_api_key(self, service):
        """Test de inicialización sin API key"""
        service.api_key = None
        
        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            service._ensure_client()

    @pytest.mark.asyncio
    async def test_ensure_client_with_api_key(self, service):
        """Test de inicialización con API key"""
        service.api_key = "test-key"
        service.client = None
        
        with patch('src.infrastructure.services.openai_embedding_service.AsyncOpenAI') as mock_openai:
            service._ensure_client()
            mock_openai.assert_called_once_with(api_key="test-key")
            assert service.client is not None
