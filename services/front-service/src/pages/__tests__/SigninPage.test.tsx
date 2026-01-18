import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, userEvent, waitFor } from '../../test/utils';
import SigninPage from '../SiginPage';
import * as useAuthModule from '../../shared/hooks/useAuth';

// Mock de los hooks
vi.mock('../../shared/hooks/useAuth');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('SigninPage', () => {
  const mockUseAuth = {
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth);
  });

  it('debe renderizar el formulario de registro', () => {
    const { getByText, getByLabelText } = renderWithProviders(<SigninPage />);

    expect(getByText('Crear Cuenta')).toBeInTheDocument();
    expect(getByLabelText('Email')).toBeInTheDocument();
    expect(getByLabelText('Contraseña')).toBeInTheDocument();
    expect(getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
  });

  it('debe permitir escribir en los campos', async () => {
    const user = userEvent.setup({ delay: null });
    const { getByLabelText } = renderWithProviders(<SigninPage />);

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Contraseña');
    const confirmPasswordInput = getByLabelText('Confirmar Contraseña');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('debe mostrar error cuando las contraseñas no coinciden', async () => {
    const user = userEvent.setup({ delay: null });
    const { getByLabelText, getByRole, findByText } = renderWithProviders(<SigninPage />);

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Contraseña');
    const confirmPasswordInput = getByLabelText('Confirmar Contraseña');
    const submitButton = getByRole('button', { name: /registrarse/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');
    await user.click(submitButton);

    await waitFor(async () => {
      const errorMessage = await findByText(/Las contraseñas no coinciden/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando la contraseña es muy corta', async () => {
    const user = userEvent.setup({ delay: null });
    const { getByLabelText, getByRole, findByText } = renderWithProviders(<SigninPage />);

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Contraseña');
    const confirmPasswordInput = getByLabelText('Confirmar Contraseña');
    const submitButton = getByRole('button', { name: /registrarse/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'short');
    await user.type(confirmPasswordInput, 'short');
    await user.click(submitButton);

    await waitFor(async () => {
      const errorMessage = await findByText(/La contraseña debe tener al menos 8 caracteres/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('debe llamar a register cuando el formulario es válido', async () => {
    const user = userEvent.setup({ delay: null });
    const { getByLabelText, getByRole } = renderWithProviders(<SigninPage />);

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Contraseña');
    const confirmPasswordInput = getByLabelText('Confirmar Contraseña');
    const submitButton = getByRole('button', { name: /registrarse/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUseAuth.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('debe mostrar error cuando el registro falla', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      ...mockUseAuth,
      register: vi.fn().mockResolvedValue({
        success: false,
        error: 'Error al registrar',
      }),
    });

    const user = userEvent.setup({ delay: null });
    const { getByLabelText, getByRole, findByText } = renderWithProviders(<SigninPage />);

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Contraseña');
    const confirmPasswordInput = getByLabelText('Confirmar Contraseña');
    const submitButton = getByRole('button', { name: /registrarse/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    const errorMessage = await findByText('Error al registrar');
    expect(errorMessage).toBeInTheDocument();
  });
});
