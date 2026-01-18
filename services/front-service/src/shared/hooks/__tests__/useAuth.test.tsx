import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../app/store/slices/authSlice';
import * as authServiceModule from '../../service/authService';
import { AxiosError } from 'axios';

// Mock del servicio de autenticación
vi.mock('../../service/authService');

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createWrapper = (preloadedState = {}) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState,
  });

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it('debe retornar el estado de autenticación inicial', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('debe llamar a authService.login cuando se ejecuta login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      success: true,
      data: {
        accessToken: 'mock-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@example.com' },
      },
    });

    vi.mocked(authServiceModule.authService.login).mockImplementation(mockLogin);
    vi.mocked(authServiceModule.authService.decodeToken).mockReturnValue({
      userId: '1',
      email: 'test@example.com',
      role: 'user',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await result.current.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('debe retornar error cuando el login falla', async () => {
    // Crear un error AxiosError real
    const axiosError = new AxiosError('Request failed');
    axiosError.response = {
      data: {
        error: {
          message: 'Credenciales inválidas',
        },
      },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as any,
    };

    const mockLogin = vi.fn().mockRejectedValue(axiosError);
    vi.mocked(authServiceModule.authService.login).mockImplementation(mockLogin);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    const response = await result.current.login({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Credenciales inválidas');
  });

  it('debe llamar a authService.register cuando se ejecuta register', async () => {
    const mockRegister = vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: '1',
        email: 'test@example.com',
        createdAt: '2024-01-01',
      },
    });

    vi.mocked(authServiceModule.authService.register).mockImplementation(mockRegister);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    const response = await result.current.register({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(mockRegister).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(response.success).toBe(true);
  });

  it('debe ejecutar logout correctamente', () => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          token: 'mock-token',
          user: {
            id: '1',
            email: 'test@example.com',
            role: 'user',
          },
        },
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </Provider>
      ),
    });

    // Verificar estado inicial
    expect(result.current.isAuthenticated).toBe(true);

    result.current.logout();

    // Verificar que el estado se actualizó
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.token).toBeNull();
    expect(state.auth.user).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
