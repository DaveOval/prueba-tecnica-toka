import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore, Store } from '@reduxjs/toolkit';
import authReducer from '../app/store/slices/authSlice';

// Helper para renderizar componentes con providers
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  }: {
    preloadedState?: any;
    store?: Store;
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-exportar todo de testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { waitFor } from '@testing-library/react';
