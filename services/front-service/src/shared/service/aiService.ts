import { aiChatApi, vectorizationApi } from '../api/apiClient';

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
        const response = await aiChatApi.post<ChatResponse>('/chat', request);
        return response.data;
    },

    // Cargar documento para vectorización
    async uploadDocument(document: DocumentUpload): Promise<DocumentUploadResponse> {
        const formData = new FormData();
        formData.append('file', document.file);
        if (document.name) formData.append('name', document.name);
        if (document.description) formData.append('description', document.description);

        const response = await vectorizationApi.post<DocumentUploadResponse>(
            '/documents/upload',
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
        const response = await vectorizationApi.get<{ success: boolean; data: Document[] }>('/documents');
        return response.data;
    },

    // Eliminar documento
    async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
        const response = await vectorizationApi.delete<{ success: boolean; message: string }>(
            `/documents/${documentId}`
        );
        return response.data;
    },

    // Gestión de prompts
    async getPromptTemplates(): Promise<{ success: boolean; data: PromptTemplate[] }> {
        const response = await aiChatApi.get<{ success: boolean; data: PromptTemplate[] }>('/prompts');
        return response.data;
    },

    async createPromptTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data: PromptTemplate }> {
        const response = await aiChatApi.post<{ success: boolean; data: PromptTemplate }>('/prompts', template);
        return response.data;
    },

    async updatePromptTemplate(templateId: string, template: Partial<PromptTemplate>): Promise<{ success: boolean; data: PromptTemplate }> {
        const response = await aiChatApi.put<{ success: boolean; data: PromptTemplate }>(
            `/prompts/${templateId}`,
            template
        );
        return response.data;
    },

    async deletePromptTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
        const response = await aiChatApi.delete<{ success: boolean; message: string }>(
            `/prompts/${templateId}`
        );
        return response.data;
    },

    // Conversaciones
    async getConversations(): Promise<{ success: boolean; data: Conversation[] }> {
        const response = await aiChatApi.get<{ success: boolean; data: Conversation[] }>('/conversations');
        return response.data;
    },

    async getConversation(conversationId: string): Promise<{ success: boolean; data: Conversation }> {
        const response = await aiChatApi.get<{ success: boolean; data: Conversation }>(
            `/conversations/${conversationId}`
        );
        return response.data;
    },

    async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
        const response = await aiChatApi.delete<{ success: boolean; message: string }>(
            `/conversations/${conversationId}`
        );
        return response.data;
    },

    // Evaluaciones y métricas
    async getEvaluations(limit?: number, offset?: number): Promise<{ success: boolean; data: PromptEvaluation[]; total: number }> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());

        const response = await aiChatApi.get<{ success: boolean; data: PromptEvaluation[]; total: number }>(
            `/evaluations?${params.toString()}`
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
        const response = await aiChatApi.get('/metrics');
        return response.data;
    },
};
