import os
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from src.application.ports.illm_service import ILLMService


class OpenAILLMService(ILLMService):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.client = None
        # El cliente se inicializará lazy cuando se necesite

    def _ensure_client(self):
        """Inicializa el cliente si no está inicializado"""
        if not self.client:
            if not self.api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required")
            self.client = AsyncOpenAI(api_key=self.api_key)

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        # Asegurar que el cliente esté inicializado
        self._ensure_client()
        
        # Preparar mensajes
        chat_messages = []
        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})
        chat_messages.extend(messages)

        # Llamar a OpenAI
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=chat_messages,
            temperature=temperature,
        )

        content = response.choices[0].message.content
        usage = response.usage

        return {
            "content": content,
            "tokens": {
                "input": usage.prompt_tokens,
                "output": usage.completion_tokens,
                "total": usage.total_tokens,
            },
        }
