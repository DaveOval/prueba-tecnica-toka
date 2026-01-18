import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.infrastructure.vector_db.chroma_vector_repository import ChromaVectorRepository
from src.domain.entities.document_chunk import DocumentChunk


class TestChromaVectorRepository:
    @pytest.fixture
    def repository(self):
        with patch('src.infrastructure.vector_db.chroma_vector_repository.chromadb.HttpClient') as mock_client:
            repo = ChromaVectorRepository()
            repo.client = mock_client.return_value
            return repo

    @pytest.mark.asyncio
    async def test_create_collection_success(self, repository):
        """Test de creación exitosa de colección"""
        mock_collection = Mock()
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        result = await repository.create_collection("test_collection", 1536)
        
        assert result is True
        repository.client.get_collection.assert_called_once_with(name="test_collection")

    @pytest.mark.asyncio
    async def test_create_collection_new(self, repository):
        """Test de creación de nueva colección"""
        # Simular que la colección no existe
        repository.client.get_collection = Mock(side_effect=Exception("does not exist"))
        repository.client.create_collection = Mock(return_value=Mock())
        
        result = await repository.create_collection("test_collection", 1536)
        
        assert result is True
        repository.client.create_collection.assert_called_once()

    @pytest.mark.asyncio
    async def test_upsert_chunks_success(self, repository, sample_document_chunks):
        """Test de upsert exitoso de chunks"""
        mock_collection = Mock()
        mock_collection.upsert = Mock()
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        result = await repository.upsert_chunks("test_collection", sample_document_chunks)
        
        assert result is True
        mock_collection.upsert.assert_called_once()

    @pytest.mark.asyncio
    async def test_upsert_chunks_empty_list(self, repository):
        """Test de upsert con lista vacía"""
        mock_collection = Mock()
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        result = await repository.upsert_chunks("test_collection", [])
        
        assert result is True
        mock_collection.upsert.assert_not_called()

    @pytest.mark.asyncio
    async def test_upsert_chunks_without_embedding(self, repository):
        """Test de upsert ignorando chunks sin embedding"""
        chunk_without_embedding = DocumentChunk(
            id="chunk-1",
            document_id="doc-1",
            chunk_index=0,
            content="test",
            embedding=None,
        )
        
        mock_collection = Mock()
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        result = await repository.upsert_chunks("test_collection", [chunk_without_embedding])
        
        assert result is True
        mock_collection.upsert.assert_not_called()

    @pytest.mark.asyncio
    async def test_search_similar(self, repository):
        """Test de búsqueda de chunks similares"""
        mock_collection = Mock()
        mock_collection.query.return_value = {
            'ids': [['chunk-1', 'chunk-2']],
            'distances': [[0.1, 0.2]],
            'documents': [['content 1', 'content 2']],
            'metadatas': [[
                {'document_id': 'doc-1', 'chunk_index': '0'},
                {'document_id': 'doc-1', 'chunk_index': '1'},
            ]],
        }
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        query_embedding = [0.1] * 1536
        results = await repository.search_similar("test_collection", query_embedding, limit=5)
        
        assert isinstance(results, list)
        assert len(results) == 2
        assert all('id' in r and 'score' in r for r in results)

    @pytest.mark.asyncio
    async def test_search_similar_empty(self, repository):
        """Test de búsqueda sin resultados"""
        mock_collection = Mock()
        mock_collection.query.return_value = {
            'ids': [[]],
            'distances': [[]],
            'documents': [[]],
            'metadatas': [[]],
        }
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        query_embedding = [0.1] * 1536
        results = await repository.search_similar("test_collection", query_embedding)
        
        assert results == []

    @pytest.mark.asyncio
    async def test_delete_document_chunks(self, repository):
        """Test de eliminación de chunks de un documento"""
        mock_collection = Mock()
        mock_collection.get.return_value = {
            'ids': ['chunk-1', 'chunk-2'],
        }
        mock_collection.delete = Mock()
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        result = await repository.delete_document_chunks("test_collection", "doc-1")
        
        assert result is True
        mock_collection.delete.assert_called_once_with(ids=['chunk-1', 'chunk-2'])

    @pytest.mark.asyncio
    async def test_delete_document_chunks_not_found(self, repository):
        """Test de eliminación cuando no hay chunks"""
        mock_collection = Mock()
        mock_collection.get.return_value = {
            'ids': [],
        }
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        result = await repository.delete_document_chunks("test_collection", "doc-1")
        
        assert result is True
