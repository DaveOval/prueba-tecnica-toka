import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, waitFor } from '../../test/utils';
import HomePage from '../HomePage';
import * as useAuthModule from '../../shared/hooks/useAuth';
import * as userServiceModule from '../../shared/service/userService';
import * as authServiceModule from '../../shared/service/authService';

// Mock de los hooks y servicios
vi.mock('../../shared/hooks/useAuth');
vi.mock('../../shared/service/userService');
vi.mock('../../shared/service/authService');

describe('HomePage', () => {
  const mockUser = {
    id: '1',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockUseAuth = {
    user: mockUser,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth);
    vi.mocked(userServiceModule.userService.getAllUsers).mockResolvedValue({
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
        {
          id: '2',
          email: 'user2@example.com',
          role: 'user',
          active: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
    });
  });

  it('debe renderizar el componente correctamente', () => {
    const { getByText } = renderWithProviders(<HomePage />);

    expect(getByText(/Bienvenido/i)).toBeInTheDocument();
  });

  it('debe mostrar estadísticas para usuarios admin', async () => {
    const { findByText } = renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(userServiceModule.userService.getAllUsers).toHaveBeenCalled();
      expect(authServiceModule.authService.getAllUsers).toHaveBeenCalled();
    });

    // Verificar que se muestran las estadísticas
    const totalUsers = await findByText(/Total de Usuarios/i);
    expect(totalUsers).toBeInTheDocument();
  });

  it('no debe cargar estadísticas para usuarios no admin', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      ...mockUseAuth,
      user: {
        id: '2',
        email: 'user@example.com',
        role: 'user',
      },
    });

    renderWithProviders(<HomePage />);

    // No debería llamar a los servicios
    expect(userServiceModule.userService.getAllUsers).not.toHaveBeenCalled();
    expect(authServiceModule.authService.getAllUsers).not.toHaveBeenCalled();
  });
});
