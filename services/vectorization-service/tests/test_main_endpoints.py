import tests.conftest_main

import pytest
from unittest.mock import AsyncMock, Mock, patch
from fastapi.testclient import TestClient
import io
import os

from src.main import app


class TestMainEndpoints:
    @pytest.fixture
    def client(self):
        """Cliente de test para FastAPI"""
        return TestClient(app)

    @pytest.fixture
    def mock_services(self):
        """Mock de todos los servicios necesarios"""
        with patch('src.main.document_processor') as mock_processor, \
             patch('src.main.embedding_service') as mock_embedding, \
             patch('src.main.vector_repository') as mock_repo, \
             patch('src.main.event_publisher') as mock_publisher:
            
            # Configurar mocks
            mock_processor.process_file = AsyncMock(return_value=["chunk 1", "chunk 2"])
            mock_embedding.generate_embeddings_batch = AsyncMock(return_value=[[0.1]*1536, [0.2]*1536])
            mock_repo.create_collection = AsyncMock(return_value=True)
            mock_repo.upsert_chunks = AsyncMock(return_value=True)
            mock_repo.client.get_collection.return_value = Mock()
            mock_publisher.publish = AsyncMock()
            
            yield {
                'processor': mock_processor,
                'embedding': mock_embedding,
                'repo': mock_repo,
                'publisher': mock_publisher,
            }

    def test_health_endpoint(self, client):
        """Test del endpoint de health"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_get_documents_empty(self, client):
        """Test de obtención de documentos cuando no hay documentos"""
        with patch('src.main.vector_repository') as mock_repo:
            # Simular que la colección no existe
            mock_repo.client.get_collection.side_effect = Exception("does not exist")
            
            response = client.get("/api/ai/documents")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"] == []

    def test_get_documents_with_data(self, client):
        """Test de obtención de documentos con datos"""
        with patch('src.main.vector_repository') as mock_repo, \
             patch('glob.glob', return_value=[]), \
             patch('os.path.exists', return_value=False):
            
            mock_collection = Mock()
            mock_collection.get.return_value = {
                'ids': ['chunk-1', 'chunk-2'],
                'metadatas': [
                    {'document_id': 'doc-1', 'document_name': 'test.pdf'},
                    {'document_id': 'doc-1', 'document_name': 'test.pdf'},
                ],
            }
            mock_repo.client.get_collection.return_value = mock_collection
            
            response = client.get("/api/ai/documents")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert isinstance(data["data"], list)

    def test_get_documents_error_handling(self, client):
        """Test de manejo de errores al obtener documentos"""
        with patch('src.main.vector_repository') as mock_repo:
            mock_repo.client.get_collection.side_effect = Exception("Unexpected error")
            
            # Debería retornar lista vacía en lugar de fallar
            response = client.get("/api/ai/documents")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"] == []

    def test_delete_document_success(self, client):
        """Test de eliminación exitosa de documento"""
        with patch('src.main.vector_repository') as mock_repo, \
             patch('src.main.event_publisher') as mock_publisher, \
             patch('src.main.get_user_id', return_value="user-1"):
            
            mock_collection = Mock()
            mock_collection.get.return_value = {
                'ids': ['chunk-1'],
                'metadatas': [{'document_name': 'test.pdf'}],
            }
            mock_repo.client.get_collection.return_value = mock_collection
            mock_repo.delete_document_chunks = AsyncMock(return_value=True)
            mock_publisher.publish = AsyncMock()
            
            response = client.delete("/api/ai/documents/doc-1")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "message" in data

    def test_delete_document_not_found(self, client):
        """Test de eliminación cuando el documento no existe"""
        with patch('src.main.vector_repository') as mock_repo, \
             patch('src.main.get_user_id', return_value="user-1"):
            
            mock_repo.client.get_collection.side_effect = Exception("does not exist")
            
            response = client.delete("/api/ai/documents/non-existent")
            
            assert response.status_code == 404

    def test_delete_document_error(self, client):
        """Test de manejo de errores al eliminar documento"""
        with patch('src.main.vector_repository') as mock_repo, \
             patch('src.main.get_user_id', return_value="user-1"):
            
            mock_collection = Mock()
            mock_collection.get.return_value = {
                'ids': ['chunk-1'],
                'metadatas': [{'document_name': 'test.pdf'}],
            }
            mock_repo.client.get_collection.return_value = mock_collection
            mock_repo.delete_document_chunks = AsyncMock(side_effect=Exception("Database error"))
            
            response = client.delete("/api/ai/documents/doc-1")
            
            assert response.status_code == 500
