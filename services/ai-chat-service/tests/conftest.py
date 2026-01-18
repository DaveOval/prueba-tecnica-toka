import pytest
import os
from unittest.mock import Mock, AsyncMock

os.environ["OPENAI_API_KEY"] = "test-api-key"
os.environ["CHROMA_HOST"] = "localhost"
os.environ["CHROMA_PORT"] = "8000"
os.environ["JWT_ACCESS_SECRET"] = "test-secret"
os.environ["REDIS_HOST"] = "localhost"
os.environ["REDIS_PORT"] = "6379"
os.environ["KAFKA_BROKER"] = "localhost:9092"
os.environ["LLM_MODEL"] = "gpt-4o-mini"
os.environ["EMBEDDING_MODEL"] = "text-embedding-3-small"

@pytest.fixture
def mock_llm_service():
    """Mock del servicio LLM"""
    mock = AsyncMock()
    mock.generate_response.return_value = {
        "content": "This is a test response from the AI.",
        "tokens": {
            "input": 100,
            "output": 50,
            "total": 150,
        },
    }
    mock._ensure_client = Mock()
    return mock

@pytest.fixture
def mock_embedding_service():
    """Mock del servicio de embeddings"""
    mock = AsyncMock()
    mock.generate_embedding.return_value = [0.1] * 1536
    mock.generate_embeddings_batch.return_value = [
        [0.1] * 1536,
        [0.2] * 1536,
    ]
    mock._ensure_client = Mock()
    return mock

@pytest.fixture
def mock_vector_search():
    """Mock del servicio de búsqueda vectorial"""
    mock = AsyncMock()
    mock.search_similar.return_value = [
        {
            "id": "chunk-1",
            "score": 0.85,
            "content": "This is relevant context from document 1",
            "document_id": "doc-1",
            "chunk_index": 0,
            "metadata": {"document_name": "test.pdf"},
        },
        {
            "id": "chunk-2",
            "score": 0.75,
            "content": "This is relevant context from document 2",
            "document_id": "doc-1",
            "chunk_index": 1,
            "metadata": {"document_name": "test.pdf"},
        },
    ]
    mock.client.get_collection.return_value = Mock()
    return mock

@pytest.fixture
def mock_prompt_repository():
    """Mock del repositorio de prompts"""
    mock = AsyncMock()
    mock.get_by_id = AsyncMock(return_value=None)
    mock.get_all = AsyncMock(return_value=[])
    mock.create = AsyncMock()
    mock.update = AsyncMock()
    mock.delete = AsyncMock(return_value=True)
    return mock

@pytest.fixture
def mock_event_publisher():
    """Mock del publicador de eventos"""
    mock = AsyncMock()
    mock.publish = AsyncMock()
    mock.disconnect = AsyncMock()
    return mock

@pytest.fixture
def sample_prompt_template():
    """Prompt template de ejemplo"""
    from src.domain.entities.prompt_template import PromptTemplate
    
    return PromptTemplate(
        id="prompt-1",
        name="Test Prompt",
        description="Test description",
        system_prompt="You are a helpful assistant.",
        user_prompt_template="User question: {message}",
        parameters=[],
    )

@pytest.fixture
def sample_message():
    """Mensaje de ejemplo"""
    from src.domain.entities.message import Message, MessageRole
    
    return Message(
        id="msg-1",
        role=MessageRole.USER,
        content="Test message",
        conversation_id="conv-1",
    )

@pytest.fixture
def sample_conversation(sample_message):
    """Conversación de ejemplo"""
    from src.domain.entities.conversation import Conversation
    
    return Conversation(
        id="conv-1",
        user_id="user-1",
        title="Test Conversation",
        messages=[sample_message],
    )
