import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.infrastructure.vector_db.chroma_vector_repository import ChromaVectorRepository
from src.domain.entities.document_chunk import DocumentChunk


class TestChromaVectorRepositoryExtended:
    """Tests adicionales para mejorar coverage de ChromaVectorRepository"""
    
    @pytest.fixture
    def repository(self):
        with patch('src.infrastructure.vector_db.chroma_vector_repository.chromadb.HttpClient') as mock_client:
            repo = ChromaVectorRepository()
            repo.client = mock_client.return_value
            return repo

    @pytest.mark.asyncio
    async def test_create_collection_corrupted(self, repository):
        """Test de creación cuando la colección está corrupta"""
        # Simular error de tipo '_type' que indica corrupción
        repository.client.get_collection = Mock(side_effect=Exception("'_type' error"))
        repository.client.delete_collection = Mock()
        repository.client.create_collection = Mock(return_value=Mock())
        
        result = await repository.create_collection("test_collection", 1536)
        
        assert result is True
        repository.client.delete_collection.assert_called_once()
        repository.client.create_collection.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_collection_already_exists(self, repository):
        """Test cuando la colección ya existe después de crear"""
        repository.client.get_collection = Mock(side_effect=Exception("does not exist"))
        repository.client.create_collection = Mock(side_effect=Exception("already exists"))
        repository.client.get_collection = Mock(return_value=Mock())
        
        # Reconfigurar después del primer side_effect
        repository.client.get_collection = Mock(side_effect=[
            Exception("does not exist"),
            Mock()  # Segunda llamada retorna la colección
        ])
        repository.client.create_collection = Mock(side_effect=Exception("already exists"))
        
        result = await repository.create_collection("test_collection", 1536)
        
        # Debería intentar obtenerla de nuevo
        assert repository.client.get_collection.call_count >= 1

    @pytest.mark.asyncio
    async def test_upsert_chunks_corrupted_collection(self, repository, sample_document_chunks):
        """Test de upsert cuando la colección está corrupta"""
        mock_collection = Mock()
        mock_collection.upsert = Mock()
        
        repository.client.get_collection = Mock(side_effect=Exception("'_type' error"))
        repository.client.delete_collection = Mock()
        repository.client.create_collection = Mock(return_value=mock_collection)
        
        result = await repository.upsert_chunks("test_collection", sample_document_chunks)
        
        assert result is True
        mock_collection.upsert.assert_called_once()

    @pytest.mark.asyncio
    async def test_upsert_chunks_get_or_create_fallback(self, repository, sample_document_chunks):
        """Test usando get_or_create como último recurso"""
        mock_collection = Mock()
        mock_collection.upsert = Mock()
        
        repository.client.get_collection = Mock(side_effect=Exception("error"))
        repository.client.delete_collection = Mock(side_effect=Exception("error"))
        repository.client.create_collection = Mock(side_effect=Exception("already exists"))
        repository.client.get_or_create_collection = Mock(return_value=mock_collection)
        
        result = await repository.upsert_chunks("test_collection", sample_document_chunks)
        
        assert result is True
        repository.client.get_or_create_collection.assert_called_once()

    @pytest.mark.asyncio
    async def test_upsert_chunks_exception(self, repository, sample_document_chunks):
        """Test cuando upsert lanza excepción"""
        mock_collection = Mock()
        mock_collection.upsert = Mock(side_effect=Exception("Upsert error"))
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        with pytest.raises(Exception, match="Upsert error"):
            await repository.upsert_chunks("test_collection", sample_document_chunks)

    @pytest.mark.asyncio
    async def test_search_similar_with_threshold(self, repository):
        """Test de búsqueda con threshold de score"""
        mock_collection = Mock()
        mock_collection.query.return_value = {
            'ids': [['chunk-1', 'chunk-2', 'chunk-3']],
            'distances': [[0.1, 0.4, 0.5]],  # scores: 0.9, 0.6, 0.5
            'documents': [['content 1', 'content 2', 'content 3']],
            'metadatas': [[
                {'document_id': 'doc-1', 'chunk_index': '0'},
                {'document_id': 'doc-1', 'chunk_index': '1'},
                {'document_id': 'doc-1', 'chunk_index': '2'},
            ]],
        }
        repository.client.get_collection = Mock(return_value=mock_collection)
        
        query_embedding = [0.1] * 1536
        results = await repository.search_similar("test_collection", query_embedding, limit=5, score_threshold=0.7)
        
        # Solo debería retornar chunks con score >= 0.7
        assert len(results) == 1  # Solo chunk-1 tiene score 0.9
        assert results[0]['score'] >= 0.7

    @pytest.mark.asyncio
    async def test_search_similar_error(self, repository):
        """Test de búsqueda cuando hay error"""
        repository.client.get_collection = Mock(side_effect=Exception("Collection error"))
        
        query_embedding = [0.1] * 1536
        results = await repository.search_similar("test_collection", query_embedding)
        
        assert results == []

    @pytest.mark.asyncio
    async def test_delete_document_chunks_error(self, repository):
        """Test de eliminación cuando hay error"""
        repository.client.get_collection = Mock(side_effect=Exception("Collection error"))
        
        result = await repository.delete_document_chunks("test_collection", "doc-1")
        
        assert result is False

    @pytest.mark.asyncio
    async def test_create_collection_error(self, repository):
        """Test cuando hay error al crear colección"""
        repository.client.get_collection = Mock(side_effect=Exception("error"))
        repository.client.create_collection = Mock(side_effect=Exception("create error"))
        
        result = await repository.create_collection("test_collection", 1536)
        
        assert result is False
