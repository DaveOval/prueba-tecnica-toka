from abc import ABC, abstractmethod
from typing import Optional, List
from src.domain.entities.prompt_template import PromptTemplate


class IPromptRepository(ABC):
    @abstractmethod
    async def create(self, prompt: PromptTemplate) -> PromptTemplate:
        pass

    @abstractmethod
    async def get_by_id(self, prompt_id: str) -> Optional[PromptTemplate]:
        pass

    @abstractmethod
    async def get_all(self) -> List[PromptTemplate]:
        pass

    @abstractmethod
    async def update(self, prompt: PromptTemplate) -> PromptTemplate:
        pass

    @abstractmethod
    async def delete(self, prompt_id: str) -> bool:
        pass
