import pytest
from unittest.mock import AsyncMock
from src.application.use_cases.send_message_use_case import SendMessageUseCase


class TestSendMessageUseCase:
    @pytest.fixture
    def use_case(self, mock_llm_service, mock_vector_search, mock_embedding_service):
        return SendMessageUseCase(
            llm_service=mock_llm_service,
            vector_search=mock_vector_search,
            embedding_service=mock_embedding_service,
            system_prompt="You are a helpful assistant.",
        )

    @pytest.mark.asyncio
    async def test_execute_with_rag(self, use_case, mock_llm_service, mock_vector_search, mock_embedding_service):
        """Test de ejecución con RAG activado"""
        result = await use_case.execute(
            user_message="What is the document about?",
            conversation_id="conv-1",
            user_id="user-1",
            use_rag=True,
        )
        
        assert "message" in result
        assert "conversationId" in result
        assert "tokens" in result
        assert "latency" in result
        assert "sources" in result
        
        mock_embedding_service.generate_embedding.assert_called_once()
        mock_vector_search.search_similar.assert_called_once()
        mock_llm_service.generate_response.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_without_rag(self, use_case, mock_llm_service, mock_vector_search, mock_embedding_service):
        """Test de ejecución sin RAG"""
        result = await use_case.execute(
            user_message="Hello",
            conversation_id="conv-1",
            user_id="user-1",
            use_rag=False,
        )
        
        assert "message" in result
        assert result["sources"] == []
        
        mock_embedding_service.generate_embedding.assert_not_called()
        mock_vector_search.search_similar.assert_not_called()
        mock_llm_service.generate_response.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_generic_query_skips_rag(self, use_case, mock_llm_service, mock_vector_search, mock_embedding_service):
        """Test que consultas genéricas saltan RAG"""
        result = await use_case.execute(
            user_message="hola",
            conversation_id="conv-1",
            user_id="user-1",
            use_rag=True,
        )
        
        mock_embedding_service.generate_embedding.assert_not_called()
        mock_vector_search.search_similar.assert_not_called()
        mock_llm_service.generate_response.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_with_user_prompt_template(self, mock_llm_service, mock_vector_search, mock_embedding_service):
        """Test con user prompt template"""
        use_case = SendMessageUseCase(
            llm_service=mock_llm_service,
            vector_search=mock_vector_search,
            embedding_service=mock_embedding_service,
            system_prompt="You are helpful",
            user_prompt_template="Question: {message}",
        )
        
        result = await use_case.execute(
            user_message="Test question",
            conversation_id="conv-1",
            user_id="user-1",
            use_rag=False,
        )
        
        assert "message" in result
        call_args = mock_llm_service.generate_response.call_args[0][0]
        user_message = [msg for msg in call_args if msg["role"] == "user"][0]
        assert "Question:" in user_message["content"]

    @pytest.mark.asyncio
    async def test_execute_with_context_chunks(self, use_case, mock_llm_service, mock_vector_search, mock_embedding_service):
        """Test con chunks de contexto encontrados"""
        mock_vector_search.search_similar.return_value = [
            {
                "id": "chunk-1",
                "score": 0.85,
                "content": "Relevant content",
                "document_id": "doc-1",
                "metadata": {"document_name": "test.pdf"},
            }
        ]
        
        result = await use_case.execute(
            user_message="What is in the document?",
            conversation_id="conv-1",
            user_id="user-1",
            use_rag=True,
        )
        
        assert len(result["sources"]) > 0
        assert result["sources"][0]["documentName"] == "test.pdf"

    @pytest.mark.asyncio
    async def test_execute_embedding_error(self, use_case, mock_embedding_service, mock_llm_service):
        """Test cuando falla la generación de embedding"""
        mock_embedding_service.generate_embedding = AsyncMock(side_effect=Exception("Embedding error"))
        
        with pytest.raises(Exception, match="Embedding error"):
            await use_case.execute(
                user_message="What is the detailed information about the document content and its main topics?",
                conversation_id="conv-1",
                user_id="user-1",
                use_rag=True,
            )

    @pytest.mark.asyncio
    async def test_execute_vector_search_error_continues(self, use_case, mock_vector_search, mock_llm_service):
        """Test que continúa aunque falle la búsqueda vectorial"""
        mock_vector_search.search_similar = AsyncMock(side_effect=Exception("Search error"))
        
        result = await use_case.execute(
            user_message="Test question",
            conversation_id="conv-1",
            user_id="user-1",
            use_rag=True,
        )
        
        assert "message" in result
        assert result["sources"] == []
        mock_llm_service.generate_response.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_creates_conversation_id(self, use_case):
        """Test que crea conversation_id si no se proporciona"""
        result = await use_case.execute(
            user_message="Hello",
            conversation_id=None,
            user_id="user-1",
            use_rag=False,
        )
        
        assert "conversationId" in result
        assert result["conversationId"] is not None

    @pytest.mark.asyncio
    async def test_execute_includes_latency(self, use_case):
        """Test que incluye latencia en la respuesta"""
        result = await use_case.execute(
            user_message="Test",
            conversation_id="conv-1",
            user_id="user-1",
            use_rag=False,
        )
        
        assert "latency" in result
        assert isinstance(result["latency"], int)
        assert result["latency"] >= 0
