import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, waitFor, userEvent } from '../../test/utils';
import UsersPage from '../UsersPage';
import * as useAuthModule from '../../shared/hooks/useAuth';
import * as authServiceModule from '../../shared/service/authService';
import { userApi } from '../../shared/api/apiClient';

// Mock de los hooks y servicios
vi.mock('../../shared/hooks/useAuth');
vi.mock('../../shared/service/authService');
vi.mock('../../shared/api/apiClient', () => ({
  userApi: {
    get: vi.fn(),
  },
}));

describe('UsersPage', () => {
  const mockAdminUser = {
    id: '1',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockUseAuth = {
    user: mockAdminUser,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth);
    vi.mocked(userApi.get).mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: '1',
            email: 'user1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: null,
            address: null,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      },
    });
    vi.mocked(authServiceModule.authService.getAllUsers).mockResolvedValue({
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
    });
  });

  it('debe renderizar el componente correctamente', async () => {
    const { getByText } = renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(userApi.get).toHaveBeenCalled();
      expect(authServiceModule.authService.getAllUsers).toHaveBeenCalled();
    });

    expect(getByText(/Gestión de Usuarios/i)).toBeInTheDocument();
  });

  it('debe cargar usuarios al montar si el usuario es admin', async () => {
    renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(userApi.get).toHaveBeenCalled();
      expect(authServiceModule.authService.getAllUsers).toHaveBeenCalled();
    });
  });

  it('no debe cargar usuarios si el usuario no es admin', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      ...mockUseAuth,
      user: {
        id: '2',
        email: 'user@example.com',
        role: 'user',
      },
    });

    renderWithProviders(<UsersPage />);

    expect(userApi.get).not.toHaveBeenCalled();
    expect(authServiceModule.authService.getAllUsers).not.toHaveBeenCalled();
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(userApi.get).mockImplementation(
      () => new Promise(() => {}) // Nunca resuelve
    );

    const { getByText } = renderWithProviders(<UsersPage />);

    expect(getByText(/Cargando usuarios/i)).toBeInTheDocument();
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(userApi.get).mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Error al cargar usuarios',
          },
        },
      },
    });

    const { findByText } = renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(userApi.get).toHaveBeenCalled();
    });

    const errorMessage = await findByText(/Error al cargar usuarios/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
