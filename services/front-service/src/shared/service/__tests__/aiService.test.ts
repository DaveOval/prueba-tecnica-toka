import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../aiService';
import { aiChatApi, vectorizationApi } from '../../api/apiClient';
import { AxiosError } from 'axios';

// Mock del apiClient
vi.mock('../../api/apiClient', () => ({
  aiChatApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  vectorizationApi: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('debe enviar un mensaje al chat', async () => {
      const mockResponse = {
        data: {
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
        },
      };

      vi.mocked(aiChatApi.post).mockResolvedValue(mockResponse);

      const result = await aiService.sendMessage({
        message: 'Test message',
      });

      expect(aiChatApi.post).toHaveBeenCalledWith('/chat', {
        message: 'Test message',
      });
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Test response');
    });

    it('debe enviar un mensaje con conversationId y promptTemplateId', async () => {
      const mockResponse = {
        data: {
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
        },
      };

      vi.mocked(aiChatApi.post).mockResolvedValue(mockResponse);

      const result = await aiService.sendMessage({
        message: 'Test message',
        conversationId: 'conv-1',
        promptTemplateId: 'prompt-1',
      });

      expect(aiChatApi.post).toHaveBeenCalledWith('/chat', {
        message: 'Test message',
        conversationId: 'conv-1',
        promptTemplateId: 'prompt-1',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getPromptTemplates', () => {
    it('debe obtener todos los prompts', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: '1',
              name: 'Test Prompt',
              description: 'Test description',
              systemPrompt: 'You are helpful',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      };

      vi.mocked(aiChatApi.get).mockResolvedValue(mockResponse);

      const result = await aiService.getPromptTemplates();

      expect(aiChatApi.get).toHaveBeenCalledWith('/prompts');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createPromptTemplate', () => {
    it('debe crear un nuevo prompt template', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            name: 'New Prompt',
            description: 'Description',
            systemPrompt: 'You are helpful',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };

      vi.mocked(aiChatApi.post).mockResolvedValue(mockResponse);

      const result = await aiService.createPromptTemplate({
        name: 'New Prompt',
        description: 'Description',
        systemPrompt: 'You are helpful',
      });

      expect(aiChatApi.post).toHaveBeenCalledWith('/prompts', {
        name: 'New Prompt',
        description: 'Description',
        systemPrompt: 'You are helpful',
      });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('New Prompt');
    });
  });

  describe('uploadDocument', () => {
    it('debe subir un documento', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        data: {
          success: true,
          data: {
            documentId: 'doc-1',
            name: 'test.pdf',
            status: 'processing',
          },
        },
      };

      vi.mocked(vectorizationApi.post).mockResolvedValue(mockResponse);

      const result = await aiService.uploadDocument({
        file: mockFile,
        name: 'test.pdf',
      });

      expect(vectorizationApi.post).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.documentId).toBe('doc-1');
    });

    it('debe subir un documento con descripción', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        data: {
          success: true,
          data: {
            documentId: 'doc-1',
            name: 'test.pdf',
            status: 'processing',
          },
        },
      };

      vi.mocked(vectorizationApi.post).mockResolvedValue(mockResponse);

      const result = await aiService.uploadDocument({
        file: mockFile,
        name: 'test.pdf',
        description: 'Test document',
      });

      expect(vectorizationApi.post).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('getDocuments', () => {
    it('debe obtener todos los documentos', async () => {
      const mockResponse = {
        data: {
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
        },
      };

      vi.mocked(vectorizationApi.get).mockResolvedValue(mockResponse);

      const result = await aiService.getDocuments();

      expect(vectorizationApi.get).toHaveBeenCalledWith('/documents');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('deleteDocument', () => {
    it('debe eliminar un documento', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Documento eliminado',
        },
      };

      vi.mocked(vectorizationApi.delete).mockResolvedValue(mockResponse);

      const result = await aiService.deleteDocument('doc-1');

      expect(vectorizationApi.delete).toHaveBeenCalledWith('/documents/doc-1');
      expect(result.success).toBe(true);
    });
  });

  describe('updatePromptTemplate', () => {
    it('debe actualizar un prompt template', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            name: 'Updated Prompt',
            description: 'Updated description',
            systemPrompt: 'You are very helpful',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };

      vi.mocked(aiChatApi.put).mockResolvedValue(mockResponse);

      const result = await aiService.updatePromptTemplate('1', {
        name: 'Updated Prompt',
        description: 'Updated description',
        systemPrompt: 'You are very helpful',
      });

      expect(aiChatApi.put).toHaveBeenCalledWith('/prompts/1', {
        name: 'Updated Prompt',
        description: 'Updated description',
        systemPrompt: 'You are very helpful',
      });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Prompt');
    });
  });

  describe('deletePromptTemplate', () => {
    it('debe eliminar un prompt template', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Prompt eliminado',
        },
      };

      vi.mocked(aiChatApi.delete).mockResolvedValue(mockResponse);

      const result = await aiService.deletePromptTemplate('1');

      expect(aiChatApi.delete).toHaveBeenCalledWith('/prompts/1');
      expect(result.success).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('debe obtener las métricas del sistema', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            totalConversations: 100,
            totalMessages: 500,
            totalTokens: 10000,
            totalCost: 0.5,
            averageLatency: 1200,
            documentsProcessed: 25,
          },
        },
      };

      vi.mocked(aiChatApi.get).mockResolvedValue(mockResponse);

      const result = await aiService.getMetrics();

      expect(aiChatApi.get).toHaveBeenCalledWith('/metrics');
      expect(result.success).toBe(true);
      expect(result.data.totalConversations).toBe(100);
      expect(result.data.totalMessages).toBe(500);
    });
  });

  describe('getConversations', () => {
    it('debe obtener todas las conversaciones', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'conv-1',
              userId: 'user-1',
              messages: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      vi.mocked(aiChatApi.get).mockResolvedValue(mockResponse);

      const result = await aiService.getConversations();

      expect(aiChatApi.get).toHaveBeenCalledWith('/conversations');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getConversation', () => {
    it('debe obtener una conversación específica', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'conv-1',
            userId: 'user-1',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };

      vi.mocked(aiChatApi.get).mockResolvedValue(mockResponse);

      const result = await aiService.getConversation('conv-1');

      expect(aiChatApi.get).toHaveBeenCalledWith('/conversations/conv-1');
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('conv-1');
    });
  });

  describe('deleteConversation', () => {
    it('debe eliminar una conversación', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Conversación eliminada',
        },
      };

      vi.mocked(aiChatApi.delete).mockResolvedValue(mockResponse);

      const result = await aiService.deleteConversation('conv-1');

      expect(aiChatApi.delete).toHaveBeenCalledWith('/conversations/conv-1');
      expect(result.success).toBe(true);
    });
  });

  describe('getEvaluations', () => {
    it('debe obtener las evaluaciones', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
          total: 0,
        },
      };

      vi.mocked(aiChatApi.get).mockResolvedValue(mockResponse);

      const result = await aiService.getEvaluations();

      expect(aiChatApi.get).toHaveBeenCalledWith('/evaluations?');
      expect(result.success).toBe(true);
      expect(result.total).toBe(0);
    });

    it('debe obtener evaluaciones con límite y offset', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
          total: 0,
        },
      };

      vi.mocked(aiChatApi.get).mockResolvedValue(mockResponse);

      const result = await aiService.getEvaluations(10, 20);

      expect(aiChatApi.get).toHaveBeenCalledWith('/evaluations?limit=10&offset=20');
      expect(result.success).toBe(true);
    });

    it('debe obtener evaluaciones solo con límite', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
          total: 0,
        },
      };

      vi.mocked(aiChatApi.get).mockResolvedValue(mockResponse);

      const result = await aiService.getEvaluations(10);

      expect(aiChatApi.get).toHaveBeenCalledWith('/evaluations?limit=10');
      expect(result.success).toBe(true);
    });
  });
});
