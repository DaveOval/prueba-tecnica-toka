import { describe, it, expect } from 'vitest';
import authReducer, { login, logout, setUser } from '../authSlice';

describe('authSlice', () => {
  const initialState = {
    isAuthenticated: false,
    token: null,
    user: null,
  };

  describe('login', () => {
    it('debe establecer el estado de autenticación al hacer login', () => {
      const action = login({
        token: 'mock-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'user',
        },
      });

      const state = authReducer(initialState, action);

      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('mock-token');
      expect(state.user).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'user',
      });
    });
  });

  describe('logout', () => {
    it('debe limpiar el estado de autenticación al hacer logout', () => {
      const loggedInState = {
        isAuthenticated: true,
        token: 'mock-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'user',
        },
      };

      const action = logout();
      const state = authReducer(loggedInState, action);

      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
    });
  });

  describe('setUser', () => {
    it('debe actualizar la información del usuario', () => {
      const loggedInState = {
        isAuthenticated: true,
        token: 'mock-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'user',
        },
      };

      const action = setUser({
        id: '1',
        email: 'updated@example.com',
        role: 'admin',
      });

      const state = authReducer(loggedInState, action);

      expect(state.user).toEqual({
        id: '1',
        email: 'updated@example.com',
        role: 'admin',
      });
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('mock-token');
    });
  });
});
