from datetime import datetime
from typing import Optional, List, Dict


class PromptTemplate:
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        system_prompt: str,
        user_prompt_template: Optional[str] = None,
        parameters: Optional[List[Dict]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.name = name
        self.description = description
        self.system_prompt = system_prompt
        self.user_prompt_template = user_prompt_template
        self.parameters = parameters or []
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "systemPrompt": self.system_prompt,
            "userPromptTemplate": self.user_prompt_template,
            "parameters": self.parameters,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }
