import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../test/utils';
import { LayoutWithNavbar } from '../LayoutWithNavbar';
import * as useAuthModule from '../../hooks/useAuth';

// Mock del hook
vi.mock('../../hooks/useAuth');

describe('LayoutWithNavbar', () => {
  const mockUseAuth = {
    user: {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    },
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth);
  });

  it('debe renderizar el layout con navbar', () => {
    const { getByText } = renderWithProviders(<LayoutWithNavbar />);

    expect(getByText('UserManager')).toBeInTheDocument();
    expect(getByText('Inicio')).toBeInTheDocument();
  });

  it('debe mostrar enlaces de admin cuando el usuario es admin', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      ...mockUseAuth,
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
      },
    });

    const { getByText } = renderWithProviders(<LayoutWithNavbar />);

    expect(getByText('Usuarios')).toBeInTheDocument();
    expect(getByText('Auditoría')).toBeInTheDocument();
  });

  it('debe mostrar el email del usuario cuando está autenticado', () => {
    const { getByText } = renderWithProviders(<LayoutWithNavbar />);

    expect(getByText('test@example.com')).toBeInTheDocument();
  });
});
