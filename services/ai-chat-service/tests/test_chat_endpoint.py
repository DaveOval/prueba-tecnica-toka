import tests.conftest_main

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from src.main import app


class TestChatEndpoint:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_chat_with_rag(self, client):
        """Test de chat con RAG"""
        with patch('src.main.get_user_id', return_value="user-1"), \
             patch('src.main.llm_service') as mock_llm, \
             patch('src.main.embedding_service') as mock_embedding, \
             patch('src.main.vector_search') as mock_vector, \
             patch('src.main.prompt_repository') as mock_prompt_repo:
            
            # Configurar mocks
            mock_llm.generate_response = AsyncMock(return_value={
                "content": "Test response",
                "tokens": {"input": 100, "output": 50, "total": 150},
            })
            mock_embedding.generate_embedding = AsyncMock(return_value=[0.1] * 1536)
            mock_vector.search_similar = AsyncMock(return_value=[
                {
                    "id": "chunk-1",
                    "score": 0.85,
                    "content": "Relevant context",
                    "document_id": "doc-1",
                    "metadata": {"document_name": "test.pdf"},
                }
            ])
            mock_prompt_repo.get_by_id = AsyncMock(return_value=None)
            
            response = client.post(
                "/api/ai/chat",
                json={
                    "message": "What is in the document?",
                    "conversationId": "conv-1",
                },
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "message" in data["data"]
            assert "sources" in data["data"]

    def test_chat_with_prompt_template(self, client, sample_prompt_template):
        """Test de chat con prompt template"""
        with patch('src.main.get_user_id', return_value="user-1"), \
             patch('src.main.llm_service') as mock_llm, \
             patch('src.main.embedding_service') as mock_embedding, \
             patch('src.main.vector_search') as mock_vector, \
             patch('src.main.prompt_repository') as mock_prompt_repo:
            
            mock_llm.generate_response = AsyncMock(return_value={
                "content": "Response",
                "tokens": {"input": 50, "output": 25, "total": 75},
            })
            mock_embedding.generate_embedding = AsyncMock(return_value=[0.1] * 1536)
            mock_vector.search_similar = AsyncMock(return_value=[])
            mock_prompt_repo.get_by_id = AsyncMock(return_value=sample_prompt_template)
            
            response = client.post(
                "/api/ai/chat",
                json={
                    "message": "Hello",
                    "promptTemplateId": sample_prompt_template.id,
                },
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_chat_error(self, client):
        """Test de chat con error"""
        with patch('src.main.get_user_id', return_value="user-1"), \
             patch('src.main.llm_service') as mock_llm, \
             patch('src.main.prompt_repository') as mock_prompt_repo:
            
            mock_llm.generate_response = AsyncMock(side_effect=Exception("LLM error"))
            mock_prompt_repo.get_by_id = AsyncMock(return_value=None)
            
            response = client.post(
                "/api/ai/chat",
                json={"message": "Test"},
            )
            
            assert response.status_code == 500

    def test_chat_generic_query(self, client):
        """Test de chat con consulta genérica (salto de RAG)"""
        with patch('src.main.get_user_id', return_value="user-1"), \
             patch('src.main.llm_service') as mock_llm, \
             patch('src.main.embedding_service') as mock_embedding, \
             patch('src.main.vector_search') as mock_vector, \
             patch('src.main.prompt_repository') as mock_prompt_repo:
            
            mock_llm.generate_response = AsyncMock(return_value={
                "content": "Hello!",
                "tokens": {"input": 10, "output": 5, "total": 15},
            })
            mock_prompt_repo.get_by_id = AsyncMock(return_value=None)
            
            response = client.post(
                "/api/ai/chat",
                json={"message": "hola"},
            )
            
            assert response.status_code == 200
            # Verificar que NO se generó embedding (consulta genérica)
            mock_embedding.generate_embedding.assert_not_called()
            mock_vector.search_similar.assert_not_called()
