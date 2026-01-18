import { apiClient } from '../api/apiClient';

// Tipos para el servicio de IA
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    tokens?: {
        input: number;
        output: number;
    };
    latency?: number; // en milisegundos
}

export interface ChatRequest {
    message: string;
    conversationId?: string;
    context?: {
        userId?: string;
        entityType?: string;
        entityId?: string;
    };
}

export interface ChatResponse {
    success: boolean;
    data: {
        message: string;
        conversationId: string;
        tokens: {
            input: number;
            output: number;
            total: number;
        };
        latency: number;
        sources?: Array<{
            documentId: string;
            documentName: string;
            relevance: number;
            excerpt: string;
        }>;
    };
}

export interface DocumentUpload {
    file: File;
    name?: string;
    description?: string;
}

export interface DocumentUploadResponse {
    success: boolean;
    data: {
        documentId: string;
        name: string;
        status: 'processing' | 'completed' | 'failed';
        chunks?: number;
        message?: string;
    };
}

export interface Document {
    id: string;
    name: string;
    description?: string;
    status: 'processing' | 'completed' | 'failed';
    chunks: number;
    uploadedAt: Date;
    size: number;
}

export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    userPromptTemplate?: string;
    parameters?: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean';
        description: string;
        required: boolean;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface PromptEvaluation {
    conversationId: string;
    promptTemplateId?: string;
    metrics: {
        latency: number;
        tokens: {
            input: number;
            output: number;
            total: number;
        };
        cost: {
            input: number;
            output: number;
            total: number;
        };
    };
    quality?: {
        relevance: number;
        accuracy: number;
        completeness: number;
    };
    timestamp: Date;
}

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
    metrics?: {
        totalTokens: number;
        totalCost: number;
        averageLatency: number;
    };
}

// Servicio de IA
export const aiService = {
    // Chat con el agente
    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        const response = await apiClient.post<ChatResponse>('/api/ai/chat', request);
        return response.data;
    },

    // Cargar documento para vectorización
    async uploadDocument(document: DocumentUpload): Promise<DocumentUploadResponse> {
        const formData = new FormData();
        formData.append('file', document.file);
        if (document.name) formData.append('name', document.name);
        if (document.description) formData.append('description', document.description);

        const response = await apiClient.post<DocumentUploadResponse>>(
            '/api/ai/documents/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // Listar documentos
    async getDocuments(): Promise<{ success: boolean; data: Document[] }> {
        const response = await apiClient.get<{ success: boolean; data: Document[] }>('/api/ai/documents');
        return response.data;
    },

    // Eliminar documento
    async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete<{ success: boolean; message: string }>(
            `/api/ai/documents/${documentId}`
        );
        return response.data;
    },

    // Gestión de prompts
    async getPromptTemplates(): Promise<{ success: boolean; data: PromptTemplate[] }> {
        const response = await apiClient.get<{ success: boolean; data: PromptTemplate[] }>('/api/ai/prompts');
        return response.data;
    },

    async createPromptTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data: PromptTemplate }> {
        const response = await apiClient.post<{ success: boolean; data: PromptTemplate }>('/api/ai/prompts', template);
        return response.data;
    },

    async updatePromptTemplate(templateId: string, template: Partial<PromptTemplate>): Promise<{ success: boolean; data: PromptTemplate }> {
        const response = await apiClient.put<{ success: boolean; data: PromptTemplate }>(
            `/api/ai/prompts/${templateId}`,
            template
        );
        return response.data;
    },

    async deletePromptTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete<{ success: boolean; message: string }>(
            `/api/ai/prompts/${templateId}`
        );
        return response.data;
    },

    // Conversaciones
    async getConversations(): Promise<{ success: boolean; data: Conversation[] }> {
        const response = await apiClient.get<{ success: boolean; data: Conversation[] }>('/api/ai/conversations');
        return response.data;
    },

    async getConversation(conversationId: string): Promise<{ success: boolean; data: Conversation }> {
        const response = await apiClient.get<{ success: boolean; data: Conversation }>(
            `/api/ai/conversations/${conversationId}`
        );
        return response.data;
    },

    async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete<{ success: boolean; message: string }>(
            `/api/ai/conversations/${conversationId}`
        );
        return response.data;
    },

    // Evaluaciones y métricas
    async getEvaluations(limit?: number, offset?: number): Promise<{ success: boolean; data: PromptEvaluation[]; total: number }> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());

        const response = await apiClient.get<{ success: boolean; data: PromptEvaluation[]; total: number }>(
            `/api/ai/evaluations?${params.toString()}`
        );
        return response.data;
    },

    async getMetrics(): Promise<{
        success: boolean;
        data: {
            totalConversations: number;
            totalMessages: number;
            totalTokens: number;
            totalCost: number;
            averageLatency: number;
            documentsProcessed: number;
        };
    }> {
        const response = await apiClient.get('/api/ai/metrics');
        return response.data;
    },
};
