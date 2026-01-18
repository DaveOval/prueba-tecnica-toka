from abc import ABC, abstractmethod
from typing import Dict, Any


class IEventPublisher(ABC):
    @abstractmethod
    async def publish(self, event_name: str, payload: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    async def connect(self) -> None:
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        pass
