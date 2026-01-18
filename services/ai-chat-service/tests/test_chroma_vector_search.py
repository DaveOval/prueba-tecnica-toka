import sys
from unittest.mock import MagicMock

chromadb_mock = MagicMock()
chromadb_mock.config = MagicMock()
chromadb_mock.config.Settings = MagicMock()
chromadb_mock.HttpClient = MagicMock()

sys.modules['chromadb'] = chromadb_mock
sys.modules['chromadb.config'] = chromadb_mock.config
sys.modules['chromadb.config.Settings'] = chromadb_mock.config.Settings

import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.infrastructure.vector_db.chroma_vector_search import ChromaVectorSearch


class TestChromaVectorSearch:
    @pytest.fixture
    def search_service(self):
        with patch('src.infrastructure.vector_db.chroma_vector_search.chromadb.HttpClient') as mock_client:
            service = ChromaVectorSearch()
            service.client = mock_client.return_value
            return service

    @pytest.mark.asyncio
    async def test_search_similar_with_results(self, search_service):
        """Test de búsqueda con resultados"""
        mock_collection = Mock()
        mock_collection.count.return_value = 10
        mock_collection.query.return_value = {
            'ids': [['chunk-1', 'chunk-2']],
            'distances': [[0.1, 0.2]],
            'documents': [['content 1', 'content 2']],
            'metadatas': [[
                {'document_id': 'doc-1', 'chunk_index': '0', 'document_name': 'test.pdf'},
                {'document_id': 'doc-1', 'chunk_index': '1', 'document_name': 'test.pdf'},
            ]],
        }
        search_service.client.get_collection = Mock(return_value=mock_collection)
        
        query_embedding = [0.1] * 1536
        results = await search_service.search_similar(query_embedding, limit=5)
        
        assert isinstance(results, list)
        assert len(results) == 2
        assert all('id' in r and 'score' in r and 'content' in r for r in results)

    @pytest.mark.asyncio
    async def test_search_similar_empty_collection(self, search_service):
        """Test de búsqueda cuando la colección está vacía"""
        mock_collection = Mock()
        mock_collection.count.return_value = 0
        search_service.client.get_collection = Mock(return_value=mock_collection)
        
        query_embedding = [0.1] * 1536
        results = await search_service.search_similar(query_embedding)
        
        assert results == []

    @pytest.mark.asyncio
    async def test_search_similar_no_results(self, search_service):
        """Test de búsqueda sin resultados"""
        mock_collection = Mock()
        mock_collection.count.return_value = 10
        mock_collection.query.return_value = {
            'ids': [[]],
            'distances': [[]],
            'documents': [[]],
            'metadatas': [[]],
        }
        search_service.client.get_collection = Mock(return_value=mock_collection)
        
        query_embedding = [0.1] * 1536
        results = await search_service.search_similar(query_embedding)
        
        assert results == []

    @pytest.mark.asyncio
    async def test_search_similar_low_score_filtered(self, search_service):
        """Test de filtrado por score bajo"""
        mock_collection = Mock()
        mock_collection.count.return_value = 10
        mock_collection.query.return_value = {
            'ids': [['chunk-1', 'chunk-2']],
            'distances': [[10.0, 0.1]],
            'documents': [['content 1', 'content 2']],
            'metadatas': [[
                {'document_id': 'doc-1', 'chunk_index': '0'},
                {'document_id': 'doc-1', 'chunk_index': '1'},
            ]],
        }
        search_service.client.get_collection = Mock(return_value=mock_collection)
        
        query_embedding = [0.1] * 1536
        results = await search_service.search_similar(query_embedding)
        
        assert len(results) == 1  

    @pytest.mark.asyncio
    async def test_search_similar_error(self, search_service):
        """Test de manejo de errores en búsqueda"""
        search_service.client.get_collection = Mock(side_effect=Exception("Connection error"))
        
        query_embedding = [0.1] * 1536
        results = await search_service.search_similar(query_embedding)
        
        assert results == []
