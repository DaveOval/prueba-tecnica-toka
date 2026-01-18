from kafka import KafkaProducer
from typing import Dict, Any
import json
import os
from src.application.ports.ievent_publisher import IEventPublisher


class KafkaEventPublisher(IEventPublisher):
    def __init__(self):
        kafka_broker = os.getenv("KAFKA_BROKER", "localhost:9092")
        self.producer = KafkaProducer(
            bootstrap_servers=[kafka_broker],
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )

    async def connect(self) -> None:
        # KafkaProducer se conecta automáticamente
        pass

    async def disconnect(self) -> None:
        self.producer.close()

    async def publish(self, event_name: str, payload: Dict[str, Any]) -> None:
        try:
            key = payload.get("promptId") or payload.get("userId") or "unknown"
            value = {
                **payload,
                "eventType": event_name,
                "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            }
            self.producer.send(event_name, key=key, value=value)
            self.producer.flush()
        except Exception as e:
            print(f"Error publishing event: {e}")
            raise
