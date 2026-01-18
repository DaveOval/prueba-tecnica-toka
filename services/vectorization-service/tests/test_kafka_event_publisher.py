import pytest
from unittest.mock import AsyncMock, Mock, patch
from src.infrastructure.messaging.kafka_event_publisher import KafkaEventPublisher


class TestKafkaEventPublisher:
    @pytest.fixture
    def publisher(self):
        with patch('src.infrastructure.messaging.kafka_event_publisher.KafkaProducer') as mock_producer:
            return KafkaEventPublisher()

    @pytest.mark.asyncio
    async def test_publish_event(self, publisher):
        """Test de publicación de evento"""
        with patch.object(publisher, 'producer') as mock_prod:
            mock_prod.send = Mock()
            mock_prod.flush = Mock()
            
            await publisher.publish("test.topic", {"key": "value"})
            
            mock_prod.send.assert_called_once()
            mock_prod.flush.assert_called_once()

    @pytest.mark.asyncio
    async def test_disconnect(self, publisher):
        """Test de desconexión"""
        with patch.object(publisher, 'producer') as mock_prod:
            mock_prod.close = Mock()
            
            await publisher.disconnect()
            
            mock_prod.close.assert_called_once()
