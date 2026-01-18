import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, waitFor } from '../../test/utils';
import AIPromptsPage from '../AIPromptsPage';
import * as aiServiceModule from '../../shared/service/aiService';

// Mock del servicio
vi.mock('../../shared/service/aiService');

describe('AIPromptsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aiServiceModule.aiService.getPromptTemplates).mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          name: 'Test Prompt',
          description: 'Test description',
          systemPrompt: 'You are helpful',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
  });

  it('debe renderizar el componente correctamente', async () => {
    const { getByText } = renderWithProviders(<AIPromptsPage />);

    await waitFor(() => {
      expect(aiServiceModule.aiService.getPromptTemplates).toHaveBeenCalled();
    });

    expect(getByText(/Gestión de Prompts/i)).toBeInTheDocument();
  });

  it('debe cargar los prompts al montar', async () => {
    renderWithProviders(<AIPromptsPage />);

    await waitFor(() => {
      expect(aiServiceModule.aiService.getPromptTemplates).toHaveBeenCalled();
    });
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(aiServiceModule.aiService.getPromptTemplates).mockImplementation(
      () => new Promise(() => {}) // Nunca resuelve
    );

    const { getByText } = renderWithProviders(<AIPromptsPage />);

    expect(getByText(/Cargando prompts/i)).toBeInTheDocument();
  });

  it('debe mostrar los prompts cargados', async () => {
    const { getByText } = renderWithProviders(<AIPromptsPage />);

    await waitFor(() => {
      expect(aiServiceModule.aiService.getPromptTemplates).toHaveBeenCalled();
    });

    expect(getByText('Test Prompt')).toBeInTheDocument();
  });
});
