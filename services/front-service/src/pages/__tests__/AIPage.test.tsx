import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent, waitFor } from '../../test/utils';
import AIPage from '../AIPage';
import * as useAuthModule from '../../shared/hooks/useAuth';
import * as aiServiceModule from '../../shared/service/aiService';

// Mock de los hooks y servicios
vi.mock('../../shared/hooks/useAuth');
vi.mock('../../shared/service/aiService');

describe('AIPage', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
  };

  const mockUseAuth = {
    user: mockUser,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth);
    vi.mocked(aiServiceModule.aiService.getPromptTemplates).mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          name: 'Test Prompt',
          description: 'Test description',
          systemPrompt: 'You are a helpful assistant',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    vi.mocked(aiServiceModule.aiService.sendMessage).mockResolvedValue({
      success: true,
      data: {
        message: 'Test response',
        conversationId: 'conv-1',
        tokens: {
          input: 10,
          output: 20,
          total: 30,
        },
        latency: 1000,
        sources: [],
      },
    });
  });

  it('debe renderizar el componente correctamente', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<AIPage />);

    expect(getByText('Asistente de IA')).toBeInTheDocument();
    expect(getByText(/Consulta información usando RAG/i)).toBeInTheDocument();
    expect(getByPlaceholderText('Escribe tu mensaje...')).toBeInTheDocument();
  });

  it('debe mostrar el selector de prompts', async () => {
    const { findByText, getByText } = renderWithProviders(<AIPage />);

    // Esperar a que se carguen los prompts
    await waitFor(() => {
      expect(aiServiceModule.aiService.getPromptTemplates).toHaveBeenCalled();
    });

    // Buscar el selector por el texto del label o el select directamente
    const defaultOption = getByText('Default (Sin template)');
    expect(defaultOption).toBeInTheDocument();
  });

  it('debe permitir escribir un mensaje', async () => {
    const user = userEvent.setup();
    const { getByPlaceholderText } = renderWithProviders(<AIPage />);

    const input = getByPlaceholderText('Escribe tu mensaje...');
    await user.type(input, 'Hola, ¿cómo estás?');

    expect(input).toHaveValue('Hola, ¿cómo estás?');
  });

  it('debe enviar un mensaje cuando se hace clic en Enviar', async () => {
    const user = userEvent.setup();
    const { getByPlaceholderText, getByRole } = renderWithProviders(<AIPage />);

    const input = getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = getByRole('button', { name: /enviar/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    expect(aiServiceModule.aiService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test message',
      })
    );
  });

  it('debe mostrar el mensaje del usuario después de enviarlo', async () => {
    const user = userEvent.setup();
    const { getByPlaceholderText, getByRole, findByText } = renderWithProviders(<AIPage />);

    const input = getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = getByRole('button', { name: /enviar/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    const userMessage = await findByText('Test message');
    expect(userMessage).toBeInTheDocument();
  });

  it('debe mostrar la respuesta del asistente', async () => {
    const user = userEvent.setup();
    const { getByPlaceholderText, getByRole, findByText } = renderWithProviders(<AIPage />);

    const input = getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = getByRole('button', { name: /enviar/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    const assistantMessage = await findByText('Test response');
    expect(assistantMessage).toBeInTheDocument();
  });

  it('debe mostrar estado de carga mientras se procesa el mensaje', async () => {
    const user = userEvent.setup();
    let resolveMessage: (value: any) => void;
    const messagePromise = new Promise((resolve) => {
      resolveMessage = resolve;
    });

    vi.mocked(aiServiceModule.aiService.sendMessage).mockReturnValue(messagePromise as any);

    const { getByPlaceholderText, getByRole, getByText } = renderWithProviders(<AIPage />);

    const input = getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = getByRole('button', { name: /enviar/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    // Verificar que el botón está deshabilitado durante la carga
    expect(sendButton).toBeDisabled();

    resolveMessage!({
      success: true,
      data: {
        message: 'Response',
        conversationId: 'conv-1',
        tokens: { input: 10, output: 20, total: 30 },
        latency: 1000,
      },
    });
    await messagePromise;
  });

  it('debe mostrar error cuando falla el envío del mensaje', async () => {
    const user = userEvent.setup();
    vi.mocked(aiServiceModule.aiService.sendMessage).mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Error al enviar mensaje',
          },
        },
      },
    });

    const { getByPlaceholderText, getByRole, findByText } = renderWithProviders(<AIPage />);

    const input = getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = getByRole('button', { name: /enviar/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    const errorMessage = await findByText('Error al enviar mensaje');
    expect(errorMessage).toBeInTheDocument();
  });

  it('debe cargar los prompts disponibles al montar', async () => {
    renderWithProviders(<AIPage />);

    await waitFor(() => {
      expect(aiServiceModule.aiService.getPromptTemplates).toHaveBeenCalled();
    });
  });
});
