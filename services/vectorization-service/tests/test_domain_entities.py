import pytest
from datetime import datetime
from src.domain.entities.document import Document, DocumentStatus
from src.domain.entities.document_chunk import DocumentChunk


class TestDocument:
    def test_create_document(self):
        """Test de creación de documento"""
        doc = Document(
            id="doc-1",
            name="test.pdf",
            user_id="user-1",
            status=DocumentStatus.PENDING,
            file_path="/tmp/test.pdf",
        )
        
        assert doc.id == "doc-1"
        assert doc.name == "test.pdf"
        assert doc.user_id == "user-1"
        assert doc.status == DocumentStatus.PENDING
        assert doc.chunks == 0
        assert isinstance(doc.created_at, datetime)

    def test_document_to_dict(self):
        """Test de conversión a diccionario"""
        doc = Document(
            id="doc-1",
            name="test.pdf",
            user_id="user-1",
            status=DocumentStatus.COMPLETED,
            chunks=5,
        )
        
        doc_dict = doc.to_dict()
        
        assert doc_dict["id"] == "doc-1"
        assert doc_dict["name"] == "test.pdf"
        assert doc_dict["status"] == "completed"
        assert doc_dict["chunks"] == 5
        assert "created_at" in doc_dict


class TestDocumentChunk:
    def test_create_chunk(self):
        """Test de creación de chunk"""
        embedding = [0.1] * 1536
        chunk = DocumentChunk(
            id="chunk-1",
            document_id="doc-1",
            chunk_index=0,
            content="Test content",
            embedding=embedding,
            metadata={"key": "value"},
        )
        
        assert chunk.id == "chunk-1"
        assert chunk.document_id == "doc-1"
        assert chunk.chunk_index == 0
        assert chunk.content == "Test content"
        assert chunk.embedding == embedding
        assert chunk.metadata == {"key": "value"}
        assert isinstance(chunk.created_at, datetime)

    def test_chunk_to_dict(self):
        """Test de conversión a diccionario"""
        chunk = DocumentChunk(
            id="chunk-1",
            document_id="doc-1",
            chunk_index=0,
            content="Test content",
        )
        
        chunk_dict = chunk.to_dict()
        
        assert chunk_dict["id"] == "chunk-1"
        assert chunk_dict["document_id"] == "doc-1"
        assert chunk_dict["chunk_index"] == 0
        assert chunk_dict["content"] == "Test content"
        assert "created_at" in chunk_dict

    def test_chunk_without_embedding(self):
        """Test de chunk sin embedding"""
        chunk = DocumentChunk(
            id="chunk-1",
            document_id="doc-1",
            chunk_index=0,
            content="Test content",
            embedding=None,
        )
        
        assert chunk.embedding is None
