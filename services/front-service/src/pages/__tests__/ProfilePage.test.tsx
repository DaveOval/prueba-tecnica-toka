import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, waitFor } from '../../test/utils';
import ProfilePage from '../ProfilePage';
import * as useAuthModule from '../../shared/hooks/useAuth';
import * as userServiceModule from '../../shared/service/userService';

// Mock de los hooks y servicios
vi.mock('../../shared/hooks/useAuth');
vi.mock('../../shared/service/userService');

describe('ProfilePage', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
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
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(userServiceModule.userService.getUserProfile).mockImplementation(
      () => new Promise(() => {}) // Nunca resuelve
    );

    const { getByText } = renderWithProviders(<ProfilePage />);

    expect(getByText('Cargando perfil...')).toBeInTheDocument();
  });

  it('debe mostrar el perfil del usuario cuando se carga correctamente', async () => {
    const mockProfile = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '123456789',
      address: '123 Main St',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    vi.mocked(userServiceModule.userService.getUserProfile).mockResolvedValue({
      success: true,
      data: mockProfile,
    });

    const { findByText, getByText } = renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(userServiceModule.userService.getUserProfile).toHaveBeenCalledWith('1');
    });

    expect(await findByText('Mi Perfil')).toBeInTheDocument();
    expect(getByText('test@example.com')).toBeInTheDocument();
    expect(getByText('John')).toBeInTheDocument();
    expect(getByText('Doe')).toBeInTheDocument();
  });

  it('debe mostrar error cuando falla la carga del perfil', async () => {
    vi.mocked(userServiceModule.userService.getUserProfile).mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Error al cargar el perfil',
          },
        },
      },
    });

    const { findByText } = renderWithProviders(<ProfilePage />);

    const errorMessage = await findByText('Error al cargar el perfil');
    expect(errorMessage).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no se encuentra el perfil', async () => {
    vi.mocked(userServiceModule.userService.getUserProfile).mockResolvedValue({
      success: false,
      data: null as any,
    });

    const { findByText } = renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(userServiceModule.userService.getUserProfile).toHaveBeenCalled();
    });

    const notFoundMessage = await findByText('No se encontró el perfil');
    expect(notFoundMessage).toBeInTheDocument();
  });
});
