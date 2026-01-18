import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../test/utils';
import { ProtectedRoute } from '../ProtectedRoute';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';

describe('ProtectedRoute', () => {
  it('debe renderizar el contenido cuando el usuario está autenticado', () => {
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

    const { getByText } = renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { store }
    );

    expect(getByText('Protected Content')).toBeInTheDocument();
  });

  it('debe redirigir cuando el usuario no está autenticado', () => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: false,
          token: null,
          user: null,
        },
      },
    });

    const { queryByText } = renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { store }
    );

    // El contenido protegido no debería estar visible
    expect(queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
