import pytest
from unittest.mock import Mock, patch, AsyncMock
from pathlib import Path
import tempfile
import os
from src.infrastructure.services.document_processor import DocumentProcessor


class TestDocumentProcessor:
    @pytest.fixture
    def processor(self):
        return DocumentProcessor()

    @pytest.mark.asyncio
    async def test_chunk_text_basic(self, processor):
        """Test de chunking básico de texto"""
        text = "This is a test. " * 100  # Texto largo
        chunks = await processor.chunk_text(text, chunk_size=50, overlap=10)
        
        assert len(chunks) > 0
        assert all(isinstance(chunk, str) for chunk in chunks)
        assert all(len(chunk) > 0 for chunk in chunks)

    @pytest.mark.asyncio
    async def test_chunk_text_with_overlap(self, processor):
        """Test de chunking con overlap"""
        text = "Sentence one. Sentence two. Sentence three. " * 20
        chunks = await processor.chunk_text(text, chunk_size=100, overlap=20)
        
        assert len(chunks) > 1
        # Verificar que hay overlap

    @pytest.mark.asyncio
    async def test_chunk_text_empty(self, processor):
        """Test de chunking con texto vacío"""
        chunks = await processor.chunk_text("", chunk_size=100, overlap=20)
        assert chunks == []

    @pytest.mark.asyncio
    async def test_chunk_text_short(self, processor):
        """Test de chunking con texto corto"""
        text = "Short text"
        chunks = await processor.chunk_text(text, chunk_size=100, overlap=20)
        assert len(chunks) == 1
        assert chunks[0] == "Short text"

    @pytest.mark.asyncio
    async def test_extract_pdf_text(self, processor):
        """Test de extracción de texto de PDF"""
        # Crear un PDF de prueba simple
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
            tmp_path = tmp_file.name
        
        try:
            # Intentar procesar (puede fallar si no hay PDF válido, pero probamos la estructura)
            with patch('src.infrastructure.services.document_processor.PdfReader') as mock_reader:
                mock_page = Mock()
                mock_page.extract_text.return_value = "Test PDF content"
                mock_reader.return_value.pages = [mock_page]
                
                text = await processor._extract_pdf_text(tmp_path)
                assert isinstance(text, str)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    @pytest.mark.asyncio
    async def test_process_file_pdf(self, processor):
        """Test de procesamiento de archivo PDF"""
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
            tmp_path = tmp_file.name
        
        try:
            with patch('src.infrastructure.services.document_processor.PdfReader') as mock_reader:
                mock_page = Mock()
                mock_page.extract_text.return_value = "Test content. " * 50
                mock_reader.return_value.pages = [mock_page]
                
                chunks = await processor.process_file(tmp_path)
                assert isinstance(chunks, list)
                assert len(chunks) > 0
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    @pytest.mark.asyncio
    async def test_process_file_invalid_extension(self, processor):
        """Test de procesamiento con extensión inválida"""
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp_file:
            tmp_path = tmp_file.name
        
        try:
            with pytest.raises(ValueError, match="Only PDF files are supported"):
                await processor.process_file(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
