import pytest
from datetime import datetime
from src.domain.entities.prompt_template import PromptTemplate
from src.domain.entities.message import Message, MessageRole
from src.domain.entities.conversation import Conversation


class TestPromptTemplate:
    def test_create_prompt_template(self):
        """Test de creación de prompt template"""
        prompt = PromptTemplate(
            id="prompt-1",
            name="Test Prompt",
            description="Test description",
            system_prompt="You are a helpful assistant.",
            user_prompt_template="User: {message}",
            parameters=[{"name": "temperature", "value": 0.7}],
        )
        
        assert prompt.id == "prompt-1"
        assert prompt.name == "Test Prompt"
        assert prompt.system_prompt == "You are a helpful assistant."
        assert prompt.user_prompt_template == "User: {message}"
        assert len(prompt.parameters) == 1
        assert isinstance(prompt.created_at, datetime)

    def test_prompt_template_to_dict(self):
        """Test de conversión a diccionario"""
        prompt = PromptTemplate(
            id="prompt-1",
            name="Test Prompt",
            description="Test description",
            system_prompt="You are a helpful assistant.",
        )
        
        prompt_dict = prompt.to_dict()
        
        assert prompt_dict["id"] == "prompt-1"
        assert prompt_dict["name"] == "Test Prompt"
        assert prompt_dict["systemPrompt"] == "You are a helpful assistant."
        assert "createdAt" in prompt_dict
        assert "updatedAt" in prompt_dict

    def test_prompt_template_without_user_template(self):
        """Test de prompt template sin user template"""
        prompt = PromptTemplate(
            id="prompt-1",
            name="Test Prompt",
            description="Test description",
            system_prompt="You are a helpful assistant.",
            user_prompt_template=None,
        )
        
        assert prompt.user_prompt_template is None


class TestMessage:
    def test_create_message(self):
        """Test de creación de mensaje"""
        message = Message(
            id="msg-1",
            role=MessageRole.USER,
            content="Hello",
            conversation_id="conv-1",
            tokens={"input": 10, "output": 5},
            latency=100,
        )
        
        assert message.id == "msg-1"
        assert message.role == MessageRole.USER
        assert message.content == "Hello"
        assert message.conversation_id == "conv-1"
        assert message.tokens == {"input": 10, "output": 5}
        assert message.latency == 100
        assert isinstance(message.created_at, datetime)

    def test_message_to_dict(self):
        """Test de conversión a diccionario"""
        message = Message(
            id="msg-1",
            role=MessageRole.ASSISTANT,
            content="Hello, how can I help?",
            conversation_id="conv-1",
        )
        
        message_dict = message.to_dict()
        
        assert message_dict["id"] == "msg-1"
        assert message_dict["role"] == "assistant"
        assert message_dict["content"] == "Hello, how can I help?"
        assert "timestamp" in message_dict

    def test_message_with_sources(self):
        """Test de mensaje con fuentes"""
        sources = [
            {"documentId": "doc-1", "documentName": "test.pdf", "relevance": 0.85}
        ]
        message = Message(
            id="msg-1",
            role=MessageRole.ASSISTANT,
            content="Response",
            conversation_id="conv-1",
            sources=sources,
        )
        
        assert message.sources == sources


class TestConversation:
    def test_create_conversation(self, sample_message):
        """Test de creación de conversación"""
        conversation = Conversation(
            id="conv-1",
            user_id="user-1",
            title="Test Conversation",
            messages=[sample_message],
        )
        
        assert conversation.id == "conv-1"
        assert conversation.user_id == "user-1"
        assert conversation.title == "Test Conversation"
        assert len(conversation.messages) == 1
        assert isinstance(conversation.created_at, datetime)

    def test_conversation_to_dict(self, sample_message):
        """Test de conversión a diccionario"""
        conversation = Conversation(
            id="conv-1",
            user_id="user-1",
            title="Test Conversation",
            messages=[sample_message],
        )
        
        conv_dict = conversation.to_dict()
        
        assert conv_dict["id"] == "conv-1"
        assert conv_dict["user_id"] == "user-1"
        assert conv_dict["title"] == "Test Conversation"
        assert len(conv_dict["messages"]) == 1
        assert "created_at" in conv_dict

    def test_conversation_empty_messages(self):
        """Test de conversación sin mensajes"""
        conversation = Conversation(
            id="conv-1",
            user_id="user-1",
            title="Empty Conversation",
            messages=[],
        )
        
        assert len(conversation.messages) == 0
