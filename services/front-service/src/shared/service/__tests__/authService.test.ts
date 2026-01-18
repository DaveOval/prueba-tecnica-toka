import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../authService';
import { authApi } from '../../api/apiClient';
import { AxiosError } from 'axios';

// Mock del apiClient
vi.mock('../../api/apiClient', () => ({
  authApi: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('debe hacer login exitosamente', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: {
              id: '1',
              email: 'test@example.com',
            },
          },
        },
      };

      vi.mocked(authApi.post).mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(authApi.post).toHaveBeenCalledWith('/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('mock-access-token');
    });

    it('debe manejar errores en el login', async () => {
      const error = new AxiosError('Network Error');
      vi.mocked(authApi.post).mockRejectedValue(error);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('debe registrar un usuario exitosamente', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            email: 'test@example.com',
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      vi.mocked(authApi.post).mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(authApi.post).toHaveBeenCalledWith('/register', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('test@example.com');
    });
  });

  describe('decodeToken', () => {
    it('debe decodificar un token JWT válido', () => {
      // Crear un token JWT mock
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'admin',
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;

      const result = authService.decodeToken(mockToken);

      expect(result).toEqual({
        userId: '123',
        email: 'test@example.com',
        role: 'admin',
      });
    });

    it('debe retornar null para un token inválido', () => {
      const result = authService.decodeToken('invalid-token');
      expect(result).toBeNull();
    });

    it('debe usar role por defecto "user" si no está presente', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;

      const result = authService.decodeToken(mockToken);

      expect(result).toEqual({
        userId: '123',
        email: 'test@example.com',
        role: 'user',
      });
    });
  });

  describe('getAllUsers', () => {
    it('debe obtener todos los usuarios', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: '1',
              email: 'user1@example.com',
              role: 'user',
              active: true,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          ],
        },
      };

      vi.mocked(authApi.get).mockResolvedValue(mockResponse);

      const result = await authService.getAllUsers();

      expect(authApi.get).toHaveBeenCalledWith('/users');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('activateUser', () => {
    it('debe activar un usuario', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Usuario activado',
        },
      };

      vi.mocked(authApi.patch).mockResolvedValue(mockResponse);

      const result = await authService.activateUser('user-id');

      expect(authApi.patch).toHaveBeenCalledWith('/activate/user-id');
      expect(result.success).toBe(true);
    });
  });

  describe('deactivateUser', () => {
    it('debe desactivar un usuario', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Usuario desactivado',
        },
      };

      vi.mocked(authApi.patch).mockResolvedValue(mockResponse);

      const result = await authService.deactivateUser('user-id');

      expect(authApi.patch).toHaveBeenCalledWith('/deactivate/user-id');
      expect(result.success).toBe(true);
    });
  });

  describe('changeUserRole', () => {
    it('debe cambiar el rol de un usuario', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Rol actualizado',
        },
      };

      vi.mocked(authApi.patch).mockResolvedValue(mockResponse);

      const result = await authService.changeUserRole('user-id', 'admin');

      expect(authApi.patch).toHaveBeenCalledWith('/change-role/user-id', {
        role: 'admin',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteUser', () => {
    it('debe eliminar un usuario', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Usuario eliminado',
        },
      };

      vi.mocked(authApi.delete).mockResolvedValue(mockResponse);

      const result = await authService.deleteUser('user-id');

      expect(authApi.delete).toHaveBeenCalledWith('/user-id');
      expect(result.success).toBe(true);
    });
  });

  describe('activateUser', () => {
    it('debe activar un usuario', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Usuario activado',
        },
      };

      vi.mocked(authApi.patch).mockResolvedValue(mockResponse);

      const result = await authService.activateUser('1');

      expect(authApi.patch).toHaveBeenCalledWith('/activate/1');
      expect(result.success).toBe(true);
    });
  });

  describe('deactivateUser', () => {
    it('debe desactivar un usuario', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Usuario desactivado',
        },
      };

      vi.mocked(authApi.patch).mockResolvedValue(mockResponse);

      const result = await authService.deactivateUser('1');

      expect(authApi.patch).toHaveBeenCalledWith('/deactivate/1');
      expect(result.success).toBe(true);
    });
  });

  describe('changeUserRole', () => {
    it('debe cambiar el rol de un usuario', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Rol actualizado',
        },
      };

      vi.mocked(authApi.patch).mockResolvedValue(mockResponse);

      const result = await authService.changeUserRole('1', 'admin');

      expect(authApi.patch).toHaveBeenCalledWith('/change-role/1', { role: 'admin' });
      expect(result.success).toBe(true);
    });
  });
});
