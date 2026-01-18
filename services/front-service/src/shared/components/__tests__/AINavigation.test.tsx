import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../test/utils';
import { AINavigation } from '../AINavigation';

describe('AINavigation', () => {
  it('debe renderizar los enlaces de navegación', () => {
    const { getByText } = renderWithProviders(<AINavigation />);

    expect(getByText(/Chat/i)).toBeInTheDocument();
    expect(getByText(/Documentos/i)).toBeInTheDocument();
    expect(getByText(/Prompts/i)).toBeInTheDocument();
    expect(getByText(/Métricas/i)).toBeInTheDocument();
  });

  it('debe tener enlaces a las rutas correctas', () => {
    const { getByRole } = renderWithProviders(<AINavigation />);

    const chatLink = getByRole('link', { name: /Chat/i });
    expect(chatLink).toHaveAttribute('href', '/ai');

    const documentsLink = getByRole('link', { name: /Documentos/i });
    expect(documentsLink).toHaveAttribute('href', '/ai/documents');
  });
});
