import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, waitFor, userEvent } from '../../test/utils';
import AIDocumentsPage from '../AIDocumentsPage';
import * as aiServiceModule from '../../shared/service/aiService';

// Mock del servicio
vi.mock('../../shared/service/aiService');

describe('AIDocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aiServiceModule.aiService.getDocuments).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'doc-1',
          name: 'test.pdf',
          status: 'completed',
          chunks: 10,
          uploadedAt: new Date(),
          size: 1024,
        },
      ],
    });
  });

  it('debe renderizar el componente correctamente', async () => {
    const { getByText } = renderWithProviders(<AIDocumentsPage />);

    await waitFor(() => {
      expect(aiServiceModule.aiService.getDocuments).toHaveBeenCalled();
    });

    expect(getByText(/Documentos Vectorizados/i)).toBeInTheDocument();
  });

  it('debe cargar los documentos al montar', async () => {
    renderWithProviders(<AIDocumentsPage />);

    await waitFor(() => {
      expect(aiServiceModule.aiService.getDocuments).toHaveBeenCalled();
    });
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(aiServiceModule.aiService.getDocuments).mockImplementation(
      () => new Promise(() => {}) // Nunca resuelve
    );

    const { getByText } = renderWithProviders(<AIDocumentsPage />);

    expect(getByText(/Cargando documentos/i)).toBeInTheDocument();
  });

  it('debe mostrar los documentos cargados', async () => {
    const { getByText } = renderWithProviders(<AIDocumentsPage />);

    await waitFor(() => {
      expect(aiServiceModule.aiService.getDocuments).toHaveBeenCalled();
    });

    expect(getByText('test.pdf')).toBeInTheDocument();
  });
});
