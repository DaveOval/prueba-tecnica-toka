"""
Configuración global para tests que requieren importar main.py
Mockea Kafka y ChromaDB antes de cualquier importación
"""
import sys
from unittest.mock import MagicMock

kafka_mock = MagicMock()
kafka_mock.KafkaProducer = MagicMock()
kafka_mock.KafkaConsumer = MagicMock()

sys.modules['kafka'] = kafka_mock
sys.modules['kafka.producer'] = MagicMock()
sys.modules['kafka.consumer'] = MagicMock()

chromadb_mock = MagicMock()
mock_chroma_client = MagicMock()
chromadb_mock.HttpClient = MagicMock(return_value=mock_chroma_client)
chromadb_mock.config = MagicMock()
chromadb_mock.config.Settings = MagicMock()

sys.modules['chromadb'] = chromadb_mock
