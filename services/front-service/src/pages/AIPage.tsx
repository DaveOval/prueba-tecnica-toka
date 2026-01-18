import { useState, useRef, useEffect } from 'react';
import { aiService } from '../shared/service/aiService';
import type { ChatMessage, ChatRequest } from '../shared/service/aiService';
import { useAuth } from '../shared/hooks/useAuth';
import { AINavigation } from '../shared/components/AINavigation';

export default function AIPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);
        setError(null);

        try {
            const request: ChatRequest = {
                message: inputMessage,
                conversationId: conversationId || undefined,
                context: {
                    userId: user?.id,
                },
            };

            const response = await aiService.sendMessage(request);

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.message,
                timestamp: new Date(),
                tokens: response.data.tokens,
                latency: response.data.latency,
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setConversationId(response.data.conversationId);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Error al enviar mensaje');
            console.error('Error sending message:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Asistente de IA</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Consulta información usando RAG (Retrieval-Augmented Generation)
                </p>
            </div>

            <AINavigation />

            <div className="flex flex-col h-[calc(100vh-300px)]">

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-4 mb-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                        <div>
                            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <p className="text-slate-400">Comienza una conversación con el asistente de IA</p>
                            <p className="text-sm text-slate-500 mt-2">
                                El asistente puede responder preguntas sobre usuarios, perfiles y el sistema
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                    message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-100'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                {message.tokens && (
                                    <div className="mt-2 text-xs opacity-70 flex gap-3">
                                        <span>Tokens: {message.tokens.input + message.tokens.output}</span>
                                        {message.latency && <span>Latencia: {message.latency}ms</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 rounded-lg p-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="flex gap-2">
                <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={3}
                    disabled={loading}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || loading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
                >
                    Enviar
                </button>
            </div>
            </div>
        </div>
    );
}
