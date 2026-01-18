import tests.conftest_main

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
import io
import os

from src.main import app


class TestMainUpload:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def mock_pdf_file(self):
        """Mock de archivo PDF"""
        file_content = b"%PDF-1.4\nTest PDF content"
        return ("test.pdf", io.BytesIO(file_content), "application/pdf")

    def test_upload_document_no_filename(self, client):
        """Test de subida sin nombre de archivo"""
        file_content = b"PDF content"
        file = (None, io.BytesIO(file_content), "application/pdf")
        
        with patch('src.main.get_user_id', return_value="user-1"):
            response = client.post(
                "/api/ai/documents/upload",
                files={"file": file},
            )
        
        assert response.status_code == 400
        assert "Filename is required" in response.json()["detail"]

    def test_upload_document_invalid_extension(self, client):
        """Test de subida con extensión inválida"""
        file_content = b"Not a PDF"
        file = ("test.txt", io.BytesIO(file_content), "text/plain")
        
        with patch('src.main.get_user_id', return_value="user-1"):
            response = client.post(
                "/api/ai/documents/upload",
                files={"file": file},
            )
        
        assert response.status_code == 400
        assert "Only PDF files are allowed" in response.json()["detail"]

    def test_upload_document_file_too_large(self, client):
        """Test de subida con archivo muy grande"""
        # Crear un archivo simulado de más de 50MB
        large_content = b"x" * (51 * 1024 * 1024)  # 51 MB
        file = ("test.pdf", io.BytesIO(large_content), "application/pdf")
        
        with patch('src.main.get_user_id', return_value="user-1"), \
             patch('os.getenv', return_value="50"):
            response = client.post(
                "/api/ai/documents/upload",
                files={"file": file},
            )
        
        assert response.status_code == 400
        assert "File size exceeds" in response.json()["detail"]

    def test_upload_document_success(self, client, mock_pdf_file):
        """Test de subida exitosa de documento"""
        with patch('src.main.get_user_id', return_value="user-1"), \
             patch('src.main.document_processor') as mock_processor, \
             patch('src.main.embedding_service') as mock_embedding, \
             patch('src.main.vector_repository') as mock_repo, \
             patch('src.main.event_publisher') as mock_publisher, \
             patch('aiofiles.open', create=True) as mock_aiofiles, \
             patch('os.path.exists', return_value=True), \
             patch('os.getenv', side_effect=lambda k, d=None: "50" if k == "MAX_FILE_SIZE_MB" else d):
            
            # Configurar mocks
            mock_processor.process_file = AsyncMock(return_value=["chunk 1", "chunk 2"])
            mock_embedding.generate_embeddings_batch = AsyncMock(return_value=[[0.1]*1536, [0.2]*1536])
            mock_repo.create_collection = AsyncMock(return_value=True)
            mock_repo.upsert_chunks = AsyncMock(return_value=True)
            mock_publisher.publish = AsyncMock()
            
            # Mock de aiofiles
            mock_file_handle = AsyncMock()
            mock_file_handle.write = AsyncMock()
            mock_aiofiles.return_value.__aenter__.return_value = mock_file_handle
            
            response = client.post(
                "/api/ai/documents/upload",
                files={"file": mock_pdf_file},
                data={"name": "test.pdf", "description": "Test document"},
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "documentId" in data["data"]
            assert data["data"]["chunks"] == 2

    def test_upload_document_no_text_extracted(self, client, mock_pdf_file):
        """Test cuando no se puede extraer texto"""
        with patch('src.main.get_user_id', return_value="user-1"), \
             patch('src.main.document_processor') as mock_processor, \
             patch('aiofiles.open', create=True) as mock_aiofiles, \
             patch('os.path.exists', return_value=True), \
             patch('os.getenv', side_effect=lambda k, d=None: "50" if k == "MAX_FILE_SIZE_MB" else d):
            
            mock_processor.process_file = AsyncMock(return_value=[])
            mock_file_handle = AsyncMock()
            mock_file_handle.write = AsyncMock()
            mock_aiofiles.return_value.__aenter__.return_value = mock_file_handle
            
            response = client.post(
                "/api/ai/documents/upload",
                files={"file": mock_pdf_file},
            )
            
            assert response.status_code == 400
            assert "No text could be extracted" in response.json()["detail"]

    def test_upload_document_processing_error(self, client, mock_pdf_file):
        """Test cuando falla el procesamiento"""
        with patch('src.main.get_user_id', return_value="user-1"), \
             patch('src.main.document_processor') as mock_processor, \
             patch('aiofiles.open', create=True) as mock_aiofiles, \
             patch('os.path.exists', return_value=True), \
             patch('os.getenv', side_effect=lambda k, d=None: "50" if k == "MAX_FILE_SIZE_MB" else d):
            
            mock_processor.process_file = AsyncMock(side_effect=Exception("Processing error"))
            mock_file_handle = AsyncMock()
            mock_file_handle.write = AsyncMock()
            mock_aiofiles.return_value.__aenter__.return_value = mock_file_handle
            
            response = client.post(
                "/api/ai/documents/upload",
                files={"file": mock_pdf_file},
            )
            
            assert response.status_code == 500
