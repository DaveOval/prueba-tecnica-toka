from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class ILLMService(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Genera una respuesta del LLM"""
        pass
