import os
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from src.application.ports.illm_service import ILLMService


class OpenAILLMService(ILLMService):
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
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
