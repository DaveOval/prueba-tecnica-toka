import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../userService';
import { userApi } from '../../api/apiClient';
import { AxiosError } from 'axios';

// Mock del apiClient
vi.mock('../../api/apiClient', () => ({
  userApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('debe obtener todos los perfiles de usuarios', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: '1',
              email: 'user1@example.com',
              firstName: 'John',
              lastName: 'Doe',
              phone: '123456789',
              address: '123 Main St',
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          ],
        },
      };

      vi.mocked(userApi.get).mockResolvedValue(mockResponse);

      const result = await userService.getAllUsers();

      expect(userApi.get).toHaveBeenCalledWith('/');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getUserProfile', () => {
    it('debe obtener el perfil de un usuario por ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            email: 'user1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '123456789',
            address: '123 Main St',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        },
      };

      vi.mocked(userApi.get).mockResolvedValue(mockResponse);

      const result = await userService.getUserProfile('1');

      expect(userApi.get).toHaveBeenCalledWith('/1');
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('1');
    });
  });

  describe('updateUserProfile', () => {
    it('debe actualizar el perfil de un usuario', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            email: 'user1@example.com',
            firstName: 'Jane',
            lastName: 'Doe',
            phone: '987654321',
            address: '456 Oak Ave',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-02',
          },
        },
      };

      vi.mocked(userApi.put).mockResolvedValue(mockResponse);

      const result = await userService.updateUserProfile('1', {
        firstName: 'Jane',
        phone: '987654321',
      });

      expect(userApi.put).toHaveBeenCalledWith('/1', {
        firstName: 'Jane',
        phone: '987654321',
      });
      expect(result.success).toBe(true);
      expect(result.data.firstName).toBe('Jane');
    });
  });

  describe('deleteUserProfile', () => {
    it('debe eliminar el perfil de un usuario', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Perfil eliminado',
        },
      };

      vi.mocked(userApi.delete).mockResolvedValue(mockResponse);

      const result = await userService.deleteUserProfile('1');

      expect(userApi.delete).toHaveBeenCalledWith('/1');
      expect(result.success).toBe(true);
    });
  });

  describe('updateUserProfile', () => {
    it('debe actualizar solo algunos campos del perfil', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            email: 'user1@example.com',
            firstName: 'Jane',
            lastName: 'Doe',
            phone: null,
            address: null,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-02',
          },
        },
      };

      vi.mocked(userApi.put).mockResolvedValue(mockResponse);

      const result = await userService.updateUserProfile('1', {
        firstName: 'Jane',
      });

      expect(userApi.put).toHaveBeenCalledWith('/1', {
        firstName: 'Jane',
      });
      expect(result.success).toBe(true);
      expect(result.data.firstName).toBe('Jane');
    });
  });
});
