import tests.conftest_main

import pytest
from unittest.mock import AsyncMock, patch
from src.main import handle_document_uploaded


class TestHandleDocumentUploaded:
    @pytest.mark.asyncio
    async def test_handle_document_uploaded_success(self, mock_document_processor, mock_embedding_service, mock_vector_repository, mock_event_publisher):
        """Test de manejo exitoso de documento subido"""
        message = {
            "documentId": "doc-1",
            "filePath": "/tmp/test.pdf",
            "userId": "user-1",
            "fileName": "test.pdf",
        }
        
        # Configurar mocks
        with patch('src.main.document_processor', mock_document_processor), \
             patch('src.main.embedding_service', mock_embedding_service), \
             patch('src.main.vector_repository', mock_vector_repository), \
             patch('src.main.event_publisher', mock_event_publisher):
            
            await handle_document_uploaded(message)
            
            # Verificar que se llamaron los servicios
            mock_document_processor.process_file.assert_called_once_with("/tmp/test.pdf")
            mock_embedding_service.generate_embeddings_batch.assert_called_once()
            mock_vector_repository.upsert_chunks.assert_called_once()
            assert mock_event_publisher.publish.call_count >= 1

    @pytest.mark.asyncio
    async def test_handle_document_uploaded_missing_fields(self, mock_event_publisher):
        """Test cuando faltan campos requeridos"""
        message = {
            "documentId": None,
            "filePath": None,
        }
        
        with patch('src.main.event_publisher', mock_event_publisher):
            await handle_document_uploaded(message)
            
            mock_event_publisher.publish.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_document_uploaded_no_chunks(self, mock_document_processor, mock_event_publisher):
        """Test cuando no se extraen chunks"""
        message = {
            "documentId": "doc-1",
            "filePath": "/tmp/test.pdf",
            "userId": "user-1",
            "fileName": "test.pdf",
        }
        
        mock_document_processor.process_file = AsyncMock(return_value=[])
        
        with patch('src.main.document_processor', mock_document_processor), \
             patch('src.main.event_publisher', mock_event_publisher):
            
            with pytest.raises(ValueError, match="No text chunks extracted"):
                await handle_document_uploaded(message)

    @pytest.mark.asyncio
    async def test_handle_document_uploaded_processing_error(self, mock_document_processor, mock_event_publisher):
        """Test cuando falla el procesamiento"""
        message = {
            "documentId": "doc-1",
            "filePath": "/tmp/test.pdf",
            "userId": "user-1",
            "fileName": "test.pdf",
        }
        
        mock_document_processor.process_file = AsyncMock(side_effect=Exception("Processing error"))
        
        with patch('src.main.document_processor', mock_document_processor), \
             patch('src.main.event_publisher', mock_event_publisher):
            
            await handle_document_uploaded(message)
            assert mock_event_publisher.publish.call_count >= 1
            call_args = [call[0][0] for call in mock_event_publisher.publish.call_args_list]
            assert "document.processing.failed" in call_args
