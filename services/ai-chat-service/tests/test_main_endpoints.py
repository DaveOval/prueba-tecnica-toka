import tests.conftest_main

import pytest
from unittest.mock import AsyncMock, Mock, patch
from fastapi.testclient import TestClient

from src.main import app


class TestMainEndpoints:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_health_endpoint(self, client):
        """Test del endpoint de health"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_rag_status_success(self, client):
        """Test del endpoint de estado RAG"""
        with patch('src.main.vector_search') as mock_search:
            mock_collection = Mock()
            mock_collection.count.return_value = 10
            mock_collection.query.return_value = {
                'ids': [[]],
                'distances': [[]],
                'documents': [[]],
                'metadatas': [[]],
            }
            mock_search.client.get_collection.return_value = mock_collection
            mock_search.collection_name = "documents"
            
            response = client.get("/api/ai/rag/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["chroma_connected"] is True

    def test_rag_status_error(self, client):
        """Test del endpoint de estado RAG con error"""
        with patch('src.main.vector_search') as mock_search:
            mock_search.client.get_collection.side_effect = Exception("Connection error")
            mock_search.collection_name = "documents"
            
            response = client.get("/api/ai/rag/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert data["data"]["chroma_connected"] is False

    def test_get_prompts(self, client):
        """Test de obtención de prompts"""
        with patch('src.main.prompt_repository') as mock_repo:
            mock_repo.get_all = AsyncMock(return_value=[])
            
            response = client.get("/api/ai/prompts")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert isinstance(data["data"], list)

    def test_get_prompt_by_id(self, client, sample_prompt_template):
        """Test de obtención de prompt por ID"""
        with patch('src.main.prompt_repository') as mock_repo:
            mock_repo.get_by_id = AsyncMock(return_value=sample_prompt_template)
            
            response = client.get(f"/api/ai/prompts/{sample_prompt_template.id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["id"] == sample_prompt_template.id

    def test_get_prompt_not_found(self, client):
        """Test de obtención de prompt inexistente"""
        with patch('src.main.prompt_repository') as mock_repo:
            mock_repo.get_by_id = AsyncMock(return_value=None)
            
            response = client.get("/api/ai/prompts/non-existent")
            
            assert response.status_code == 404

    def test_create_prompt(self, client):
        """Test de creación de prompt"""
        with patch('src.main.prompt_repository') as mock_repo, \
             patch('src.main.event_publisher') as mock_publisher, \
             patch('src.main.get_user_id', return_value="user-1"):
            
            mock_prompt = Mock()
            mock_prompt.id = "prompt-1"
            mock_prompt.to_dict.return_value = {"id": "prompt-1", "name": "Test"}
            mock_repo.create = AsyncMock(return_value=mock_prompt)
            mock_publisher.publish = AsyncMock()
            
            response = client.post(
                "/api/ai/prompts",
                json={
                    "name": "Test Prompt",
                    "description": "Test description",
                    "systemPrompt": "You are helpful",
                },
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_update_prompt(self, client, sample_prompt_template):
        """Test de actualización de prompt"""
        with patch('src.main.prompt_repository') as mock_repo, \
             patch('src.main.event_publisher') as mock_publisher, \
             patch('src.main.get_user_id', return_value="user-1"):
            
            updated_prompt = Mock()
            updated_prompt.to_dict.return_value = {"id": sample_prompt_template.id, "name": "Updated"}
            mock_repo.get_by_id = AsyncMock(return_value=sample_prompt_template)
            mock_repo.update = AsyncMock(return_value=updated_prompt)
            mock_publisher.publish = AsyncMock()
            
            response = client.put(
                f"/api/ai/prompts/{sample_prompt_template.id}",
                json={"name": "Updated Name"},
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_delete_prompt(self, client, sample_prompt_template):
        """Test de eliminación de prompt"""
        with patch('src.main.prompt_repository') as mock_repo, \
             patch('src.main.event_publisher') as mock_publisher, \
             patch('src.main.get_user_id', return_value="user-1"):
            
            mock_repo.get_by_id = AsyncMock(return_value=sample_prompt_template)
            mock_repo.delete = AsyncMock(return_value=True)
            mock_publisher.publish = AsyncMock()
            
            response = client.delete(f"/api/ai/prompts/{sample_prompt_template.id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_get_metrics(self, client):
        """Test del endpoint de métricas"""
        response = client.get("/api/ai/metrics")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "totalConversations" in data["data"]
