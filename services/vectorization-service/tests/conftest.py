import pytest
import os
from unittest.mock import Mock, AsyncMock
from typing import List
# variables
os.environ["OPENAI_API_KEY"] = "test-api-key"
os.environ["CHROMA_HOST"] = "localhost"
os.environ["CHROMA_PORT"] = "8000"
os.environ["JWT_ACCESS_SECRET"] = "test-secret"
os.environ["UPLOAD_DIR"] = "/tmp/test_uploads"
os.environ["KAFKA_BROKER"] = "localhost:9092"

@pytest.fixture
def mock_embedding_service():
    """Mock del servicio de embeddings"""
    mock = AsyncMock()
    mock.generate_embedding.return_value = [0.1] * 1536  # Embedding de prueba
    mock.generate_embeddings_batch.return_value = [
        [0.1] * 1536,
        [0.2] * 1536,
        [0.3] * 1536,
    ]
    mock._ensure_client = Mock()  # Mock del método interno
    return mock

@pytest.fixture
def mock_document_processor():
    """Mock del procesador de documentos"""
    mock = AsyncMock()
    mock.process_file.return_value = [
        "This is chunk 1 of the document.",
        "This is chunk 2 of the document.",
        "This is chunk 3 of the document.",
    ]
    mock.chunk_text.return_value = [
        "This is chunk 1 of the document.",
        "This is chunk 2 of the document.",
    ]
    return mock

@pytest.fixture
def mock_vector_repository():
    """Mock del repositorio de vectores"""
    mock = AsyncMock()
    mock.create_collection.return_value = True
    mock.upsert_chunks.return_value = True
    mock.delete_document_chunks.return_value = True
    mock.search_similar.return_value = []
    
    # Mock de la colección
    mock_collection = Mock()
    mock_collection.get.return_value = {
        'ids': [],
        'metadatas': [],
        'documents': [],
    }
    mock.client.get_collection.return_value = mock_collection
    mock.client.get_or_create_collection.return_value = mock_collection
    
    return mock

@pytest.fixture
def mock_event_publisher():
    """Mock del publicador de eventos"""
    mock = AsyncMock()
    mock.publish.return_value = None
    mock.disconnect.return_value = None
    return mock

@pytest.fixture
def mock_event_consumer():
    """Mock del consumidor de eventos"""
    mock = AsyncMock()
    mock.subscribe = AsyncMock()
    mock.stop = AsyncMock()
    return mock

@pytest.fixture
def sample_document_chunks():
    """Chunks de documento de ejemplo"""
    from src.domain.entities.document_chunk import DocumentChunk
    
    return [
        DocumentChunk(
            id="chunk-1",
            document_id="doc-1",
            chunk_index=0,
            content="This is chunk 1",
            embedding=[0.1] * 1536,
            metadata={"document_name": "test.pdf"},
        ),
        DocumentChunk(
            id="chunk-2",
            document_id="doc-1",
            chunk_index=1,
            content="This is chunk 2",
            embedding=[0.2] * 1536,
            metadata={"document_name": "test.pdf"},
        ),
    ]

@pytest.fixture
def sample_document():
    """Documento de ejemplo"""
    from src.domain.entities.document import Document, DocumentStatus
    
    return Document(
        id="doc-1",
        name="test.pdf",
        user_id="user-1",
        status=DocumentStatus.PENDING,
        file_path="/tmp/test.pdf",
        chunks=0,
    )
