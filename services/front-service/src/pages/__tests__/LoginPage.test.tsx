import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent } from '../../test/utils';
import LoginPage from '../LoginPage';
import * as useAuthModule from '../../shared/hooks/useAuth';

// Mock del hook useAuth
vi.mock('../../shared/hooks/useAuth');

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockUseAuth = vi.fn(() => ({
    login: mockLogin,
    isAuthenticated: false,
    user: null,
    register: vi.fn(),
    logout: vi.fn(),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthModule.useAuth).mockImplementation(mockUseAuth);
  });

  it('debe renderizar el formulario de login', () => {
    const { getByRole, getByLabelText } = renderWithProviders(<LoginPage />);

    expect(getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(getByLabelText('Email')).toBeInTheDocument();
    expect(getByLabelText('Contraseña')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
  });

  it('debe permitir escribir en los campos de email y contraseña', async () => {
    const user = userEvent.setup();
    const { getByLabelText } = renderWithProviders(<LoginPage />);

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Contraseña');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('debe llamar a login cuando se envía el formulario', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });

    const { getByLabelText, getByRole } = renderWithProviders(<LoginPage />);

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Contraseña');
    const submitButton = getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('debe mostrar error cuando el login falla', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ 
      success: false, 
      error: 'Credenciales inválidas' 
    });

    const { getByLabelText, getByRole, findByText } = renderWithProviders(<LoginPage />);

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Contraseña');
    const submitButton = getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    const errorMessage = await findByText('Credenciales inválidas');
    expect(errorMessage).toBeInTheDocument();
  });

  it('debe mostrar estado de carga mientras se procesa el login', async () => {
    const user = userEvent.setup();
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValue(loginPromise);

    const { getByLabelText, getByRole, getByText } = renderWithProviders(<LoginPage />);

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Contraseña');
    const submitButton = getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(getByText('Iniciando sesión...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    resolveLogin!({ success: true });
    await loginPromise;
  });

  it('debe mostrar el enlace de registro', () => {
    const { getByText } = renderWithProviders(<LoginPage />);

    const signupLink = getByText(/regístrate aquí/i);
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signin');
  });
});
