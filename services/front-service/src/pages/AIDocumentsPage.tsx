import { useState, useEffect } from 'react';
import { aiService } from '../shared/service/aiService';
import type { Document, DocumentUpload } from '../shared/service/aiService';
import { AINavigation } from '../shared/components/AINavigation';

export default function AIDocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentName, setDocumentName] = useState('');
    const [documentDescription, setDocumentDescription] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await aiService.getDocuments();
            if (response.success) {
                setDocuments(response.data);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (!documentName) {
                setDocumentName(file.name);
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setUploading(true);
            const upload: DocumentUpload = {
                file: selectedFile,
                name: documentName || undefined,
                description: documentDescription || undefined,
            };

            const response = await aiService.uploadDocument(upload);
            if (response.success) {
                setShowUploadModal(false);
                setSelectedFile(null);
                setDocumentName('');
                setDocumentDescription('');
                fetchDocuments();
            }
        } catch (error: any) {
            console.error('Error uploading document:', error);
            alert(error.response?.data?.error?.message || 'Error al subir documento');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (documentId: string) => {
        if (!confirm('¿Estás seguro de eliminar este documento?')) return;

        try {
            const response = await aiService.deleteDocument(documentId);
            if (response.success) {
                fetchDocuments();
            }
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-400 bg-green-600/20';
            case 'processing':
                return 'text-yellow-400 bg-yellow-600/20';
            case 'failed':
                return 'text-red-400 bg-red-600/20';
            default:
                return 'text-slate-400 bg-slate-600/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Completado';
            case 'processing':
                return 'Procesando';
            case 'failed':
                return 'Fallido';
            default:
                return status;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Documentos Vectorizados</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Gestiona los documentos que se utilizan para el RAG
                </p>
            </div>

            <AINavigation />

            <div className="flex items-center justify-between">
                <div></div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                >
                    Subir Documento
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Cargando documentos...</div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12 border border-slate-800 rounded-lg bg-slate-900/40">
                    <p className="text-slate-400">No hay documentos cargados</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                    >
                        Subir Primer Documento
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="border border-slate-800 rounded-lg bg-slate-900/40 p-4 hover:bg-slate-900/60 transition"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-medium text-slate-100">{doc.name}</h3>
                                    {doc.description && (
                                        <p className="text-sm text-slate-400 mt-1">{doc.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="text-red-400 hover:text-red-300 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.status)}`}>
                                    {getStatusLabel(doc.status)}
                                </span>
                            </div>

                            <div className="text-xs text-slate-500 space-y-1">
                                <p>Chunks: {doc.chunks}</p>
                                <p>Tamaño: {(doc.size / 1024).toFixed(2)} KB</p>
                                <p>Subido: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de subida */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Subir Documento</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Archivo</label>
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    accept=".pdf,.txt,.doc,.docx,.md"
                                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-100"
                                />
                                {selectedFile && (
                                    <p className="text-sm text-slate-400 mt-1">{selectedFile.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Nombre (opcional)</label>
                                <input
                                    type="text"
                                    value={documentName}
                                    onChange={(e) => setDocumentName(e.target.value)}
                                    placeholder="Nombre del documento"
                                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
                                <textarea
                                    value={documentDescription}
                                    onChange={(e) => setDocumentDescription(e.target.value)}
                                    placeholder="Descripción del documento"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-100 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedFile(null);
                                    setDocumentName('');
                                    setDocumentDescription('');
                                }}
                                className="flex-1 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || uploading}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition"
                            >
                                {uploading ? 'Subiendo...' : 'Subir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
