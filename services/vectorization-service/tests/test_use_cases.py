import pytest
from unittest.mock import AsyncMock, Mock
from src.application.use_cases.upload_document_use_case import UploadDocumentUseCase
from src.application.use_cases.process_document_use_case import ProcessDocumentUseCase
from src.domain.entities.document import DocumentStatus


class TestUploadDocumentUseCase:
    @pytest.fixture
    def use_case(self, mock_event_publisher):
        mock_repo = AsyncMock()
        return UploadDocumentUseCase(
            document_repository=mock_repo,
            event_publisher=mock_event_publisher,
            upload_dir="/tmp/test",
        )

    @pytest.mark.asyncio
    async def test_execute_success(self, use_case, mock_event_publisher):
        """Test de ejecución exitosa del caso de uso"""
        import tempfile
        import os
        from src.domain.entities.document import Document, DocumentStatus
        
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            tmp_file.write(b"test content")
            tmp_path = tmp_file.name
        
        try:
            mock_doc = Document(
                id="doc-1",
                name="test.pdf",
                user_id="user-1",
                status=DocumentStatus.PENDING,
                file_path=tmp_path,
                description="Test document",
            )
            use_case.document_repository.create = AsyncMock(return_value=mock_doc)
            
            result = await use_case.execute(
                user_id="user-1",
                file_name="test.pdf",
                file_path=tmp_path,
                description="Test document",
            )
            
            assert result.id == "doc-1"
            assert result.name == "test.pdf"
            assert result.user_id == "user-1"
            assert result.status == DocumentStatus.PENDING
            
            use_case.document_repository.create.assert_called_once()
            mock_event_publisher.publish.assert_called_once()
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


class TestProcessDocumentUseCase:
    @pytest.fixture
    def use_case(self, mock_embedding_service, mock_document_processor, mock_vector_repository, mock_event_publisher):
        mock_doc_repo = AsyncMock()
        return ProcessDocumentUseCase(
            document_repository=mock_doc_repo,
            vector_repository=mock_vector_repository,
            embedding_service=mock_embedding_service,
            document_processor=mock_document_processor,
            event_publisher=mock_event_publisher,
            collection_name="documents",
        )

    @pytest.mark.asyncio
    async def test_execute_success(self, use_case, sample_document, mock_embedding_service, mock_document_processor, mock_vector_repository, mock_event_publisher):
        """Test de procesamiento exitoso de documento"""
        use_case.document_repository.get_by_id = AsyncMock(return_value=sample_document)
        use_case.document_repository.update = AsyncMock(return_value=sample_document)
        
        result = await use_case.execute("doc-1")
        
        assert result.status == DocumentStatus.COMPLETED
        assert result.chunks > 0
        
        mock_document_processor.process_file.assert_called_once()
        mock_embedding_service.generate_embeddings_batch.assert_called_once()
        mock_vector_repository.upsert_chunks.assert_called_once()
        mock_event_publisher.publish.assert_called()

    @pytest.mark.asyncio
    async def test_execute_document_not_found(self, use_case):
        """Test cuando el documento no existe"""
        use_case.document_repository.get_by_id = AsyncMock(return_value=None)
        
        with pytest.raises(ValueError, match="not found"):
            await use_case.execute("non-existent-doc")

    @pytest.mark.asyncio
    async def test_execute_processing_failure(self, use_case, sample_document, mock_document_processor, mock_event_publisher):
        """Test cuando falla el procesamiento"""
        use_case.document_repository.get_by_id = AsyncMock(return_value=sample_document)
        use_case.document_repository.update = AsyncMock(return_value=sample_document)
        
        mock_document_processor.process_file = AsyncMock(side_effect=Exception("Processing error"))
        
        with pytest.raises(Exception, match="Processing error"):
            await use_case.execute("doc-1")
        
        update_calls = [call for call in use_case.document_repository.update.call_args_list]
        assert len(update_calls) >= 1
        mock_event_publisher.publish.assert_called()
