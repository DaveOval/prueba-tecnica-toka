import tests.conftest_main  # noqa: F401

import pytest
from unittest.mock import patch

from src.main import get_user_id


class TestGetUserId:
    @pytest.mark.asyncio
    async def test_get_user_id_with_valid_token(self):
        """Test de extracción de user_id con token válido"""
        from jose import jwt
        
        # Crear un token JWT válido
        secret = "test-secret"
        token = jwt.encode(
            {"userId": "user-123", "email": "test@example.com"},
            secret,
            algorithm="HS256"
        )
        
        authorization = f"Bearer {token}"
        
        with patch('src.main.os.getenv', return_value=secret):
            user_id = await get_user_id(authorization=authorization)
            
            assert user_id == "user-123"

    @pytest.mark.asyncio
    async def test_get_user_id_without_token(self):
        """Test cuando no hay token"""
        user_id = await get_user_id(authorization=None)
        
        assert user_id == "temp-user-id"

    @pytest.mark.asyncio
    async def test_get_user_id_invalid_token(self):
        """Test con token inválido"""
        authorization = "Bearer invalid-token"
        
        user_id = await get_user_id(authorization=authorization)
        
        # Debería retornar temp-user-id en caso de error
        assert user_id == "temp-user-id"

    @pytest.mark.asyncio
    async def test_get_user_id_malformed_header(self):
        """Test con header mal formado"""
        authorization = "InvalidFormat token"
        
        user_id = await get_user_id(authorization=authorization)
        
        assert user_id == "temp-user-id"

    @pytest.mark.asyncio
    async def test_get_user_id_token_without_userid(self):
        """Test con token válido pero sin userId"""
        from jose import jwt
        
        secret = "test-secret"
        token = jwt.encode(
            {"email": "test@example.com"},
            secret,
            algorithm="HS256"
        )
        
        authorization = f"Bearer {token}"
        
        with patch('src.main.os.getenv', return_value=secret):
            user_id = await get_user_id(authorization=authorization)
            
            assert user_id == "temp-user-id"
