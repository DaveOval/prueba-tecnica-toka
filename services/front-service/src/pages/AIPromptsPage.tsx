import { useState, useEffect } from 'react';
import { aiService } from '../shared/service/aiService';
import type { PromptTemplate } from '../shared/service/aiService';
import { AINavigation } from '../shared/components/AINavigation';

export default function AIPromptsPage() {
    const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        systemPrompt: '',
        userPromptTemplate: '',
    });

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        try {
            setLoading(true);
            const response = await aiService.getPromptTemplates();
            if (response.success) {
                setPrompts(response.data);
            }
        } catch (error) {
            console.error('Error fetching prompts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (prompt?: PromptTemplate) => {
        if (prompt) {
            setEditingPrompt(prompt);
            setFormData({
                name: prompt.name,
                description: prompt.description,
                systemPrompt: prompt.systemPrompt,
                userPromptTemplate: prompt.userPromptTemplate || '',
            });
        } else {
            setEditingPrompt(null);
            setFormData({
                name: '',
                description: '',
                systemPrompt: '',
                userPromptTemplate: '',
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingPrompt) {
                await aiService.updatePromptTemplate(editingPrompt.id, formData);
            } else {
                await aiService.createPromptTemplate(formData);
            }
            setShowModal(false);
            fetchPrompts();
        } catch (error: any) {
            console.error('Error saving prompt:', error);
            alert(error.response?.data?.error?.message || 'Error al guardar prompt');
        }
    };

    const handleDelete = async (promptId: string) => {
        if (!confirm('¿Estás seguro de eliminar este prompt?')) return;

        try {
            await aiService.deletePromptTemplate(promptId);
            fetchPrompts();
        } catch (error) {
            console.error('Error deleting prompt:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Gestión de Prompts</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Crea y gestiona plantillas de prompts para el agente de IA
                </p>
            </div>

            <AINavigation />

            <div className="flex items-center justify-between">
                <div></div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                >
                    Nuevo Prompt
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Cargando prompts...</div>
            ) : prompts.length === 0 ? (
                <div className="text-center py-12 border border-slate-800 rounded-lg bg-slate-900/40">
                    <p className="text-slate-400">No hay prompts creados</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                    >
                        Crear Primer Prompt
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prompts.map((prompt) => (
                        <div
                            key={prompt.id}
                            className="border border-slate-800 rounded-lg bg-slate-900/40 p-4 hover:bg-slate-900/60 transition"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-medium text-slate-100">{prompt.name}</h3>
                                    {prompt.description && (
                                        <p className="text-sm text-slate-400 mt-1">{prompt.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(prompt)}
                                        className="text-blue-400 hover:text-blue-300 transition"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(prompt.id)}
                                        className="text-red-400 hover:text-red-300 transition"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="text-xs text-slate-500 space-y-1">
                                <p className="text-slate-400">System Prompt:</p>
                                <p className="text-slate-300 line-clamp-2">{prompt.systemPrompt}</p>
                                <p className="mt-2">
                                    Creado: {new Date(prompt.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de edición/creación */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingPrompt ? 'Editar Prompt' : 'Nuevo Prompt'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Descripción</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">System Prompt</label>
                                <textarea
                                    value={formData.systemPrompt}
                                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                                    rows={6}
                                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-100 resize-none font-mono text-sm"
                                    placeholder="Escribe el prompt del sistema..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">User Prompt Template (opcional)</label>
                                <textarea
                                    value={formData.userPromptTemplate}
                                    onChange={(e) => setFormData({ ...formData, userPromptTemplate: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-100 resize-none font-mono text-sm"
                                    placeholder="Template para el prompt del usuario (puede incluir variables como {query})"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
