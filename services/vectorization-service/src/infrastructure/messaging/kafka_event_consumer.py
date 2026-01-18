from kafka import KafkaConsumer
from typing import Callable, Dict, Any
import json
import os
import asyncio


class KafkaEventConsumer:
    def __init__(self, group_id: str):
        kafka_broker = os.getenv("KAFKA_BROKER", "localhost:9092")
        self.consumer = KafkaConsumer(
            bootstrap_servers=[kafka_broker],
            group_id=group_id,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="latest",
        )
        self.is_running = False

    async def start(self):
        if not self.is_running:
            self.is_running = True

    async def stop(self):
        if self.is_running:
            self.consumer.close()
            self.is_running = False

    async def subscribe(self, topic: str, handler: Callable[[Dict[str, Any]], None]):
        if not self.is_running:
            await self.start()

        self.consumer.subscribe([topic])

        async def consume_messages():
            for message in self.consumer:
                try:
                    await handler(message.value)
                except Exception as e:
                    print(f"Error processing message from topic {topic}: {e}")

        # Ejecutar en un loop separado
        asyncio.create_task(consume_messages())
        print(f"Subscribed to topic: {topic}")
