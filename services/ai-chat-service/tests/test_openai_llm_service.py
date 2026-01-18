import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.infrastructure.services.openai_llm_service import OpenAILLMService


class TestOpenAILLMService:
    @pytest.fixture
    def service(self):
        return OpenAILLMService()

    @pytest.mark.asyncio
    async def test_generate_response(self, service):
        """Test de generación de respuesta"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Test response"
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        mock_response.usage.total_tokens = 150
        
        with patch.object(service, '_ensure_client'):
            service.client = AsyncMock()
            service.client.chat.completions.create = AsyncMock(return_value=mock_response)
            
            messages = [{"role": "user", "content": "Hello"}]
            response = await service.generate_response(messages)
            
            assert response["content"] == "Test response"
            assert response["tokens"]["input"] == 100
            assert response["tokens"]["output"] == 50
            assert response["tokens"]["total"] == 150
            service.client.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_response_with_system_prompt(self, service):
        """Test de generación con system prompt"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Response"
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 25
        mock_response.usage.total_tokens = 75
        
        with patch.object(service, '_ensure_client'):
            service.client = AsyncMock()
            service.client.chat.completions.create = AsyncMock(return_value=mock_response)
            
            messages = [{"role": "user", "content": "Hello"}]
            response = await service.generate_response(messages, system_prompt="You are helpful")
            
            call_args = service.client.chat.completions.create.call_args
            assert call_args is not None

    @pytest.mark.asyncio
    async def test_generate_response_with_temperature(self, service):
        """Test de generación con temperatura personalizada"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Response"
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 25
        mock_response.usage.total_tokens = 75
        
        with patch.object(service, '_ensure_client'):
            service.client = AsyncMock()
            service.client.chat.completions.create = AsyncMock(return_value=mock_response)
            
            messages = [{"role": "user", "content": "Hello"}]
            await service.generate_response(messages, temperature=0.9)
            
            call_args = service.client.chat.completions.create.call_args
            assert call_args[1]["temperature"] == 0.9

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
        
        with patch('src.infrastructure.services.openai_llm_service.AsyncOpenAI') as mock_openai:
            service._ensure_client()
            mock_openai.assert_called_once_with(api_key="test-key")
            assert service.client is not None
