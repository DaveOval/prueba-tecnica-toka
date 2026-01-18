import { useState, useEffect } from 'react';
import { aiService } from '../shared/service/aiService';
import type { PromptEvaluation } from '../shared/service/aiService';
import { AINavigation } from '../shared/components/AINavigation';

export default function AIMetricsPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [evaluations, setEvaluations] = useState<PromptEvaluation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [metricsResponse, evaluationsResponse] = await Promise.all([
                aiService.getMetrics(),
                aiService.getEvaluations(20, 0),
            ]);

            if (metricsResponse.success) {
                setMetrics(metricsResponse.data);
            }

            if (evaluationsResponse.success) {
                setEvaluations(evaluationsResponse.data);
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCost = (cost: number) => {
        return `$${cost.toFixed(4)}`;
    };

    const formatLatency = (latency: number) => {
        return `${latency.toFixed(0)}ms`;
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-400">Cargando métricas...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Métricas y Evaluación</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Monitorea el rendimiento y costos del agente de IA
                </p>
            </div>

            <AINavigation />

            {/* Métricas generales */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-slate-800 rounded-lg bg-slate-900/40 p-4">
                        <p className="text-sm text-slate-400">Total Conversaciones</p>
                        <p className="text-2xl font-bold mt-2">{metrics.totalConversations}</p>
                    </div>

                    <div className="border border-slate-800 rounded-lg bg-slate-900/40 p-4">
                        <p className="text-sm text-slate-400">Total Mensajes</p>
                        <p className="text-2xl font-bold mt-2">{metrics.totalMessages}</p>
                    </div>

                    <div className="border border-slate-800 rounded-lg bg-slate-900/40 p-4">
                        <p className="text-sm text-slate-400">Total Tokens</p>
                        <p className="text-2xl font-bold mt-2">{metrics.totalTokens.toLocaleString()}</p>
                    </div>

                    <div className="border border-slate-800 rounded-lg bg-slate-900/40 p-4">
                        <p className="text-sm text-slate-400">Costo Total</p>
                        <p className="text-2xl font-bold mt-2 text-purple-400">
                            {formatCost(metrics.totalCost)}
                        </p>
                    </div>

                    <div className="border border-slate-800 rounded-lg bg-slate-900/40 p-4">
                        <p className="text-sm text-slate-400">Latencia Promedio</p>
                        <p className="text-2xl font-bold mt-2 text-blue-400">
                            {formatLatency(metrics.averageLatency)}
                        </p>
                    </div>

                    <div className="border border-slate-800 rounded-lg bg-slate-900/40 p-4">
                        <p className="text-sm text-slate-400">Documentos Procesados</p>
                        <p className="text-2xl font-bold mt-2">{metrics.documentsProcessed}</p>
                    </div>
                </div>
            )}

            {/* Evaluaciones recientes */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Evaluaciones Recientes</h2>
                {evaluations.length === 0 ? (
                    <div className="text-center py-8 border border-slate-800 rounded-lg bg-slate-900/40 text-slate-400">
                        No hay evaluaciones disponibles
                    </div>
                ) : (
                    <div className="border border-slate-800 rounded-lg bg-slate-900/40 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Fecha</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Latencia</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Tokens</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Costo</th>
                                    {evaluations[0]?.quality && (
                                        <>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Relevancia</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Precisión</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {evaluations.map((evaluation) => (
                                    <tr key={evaluation.conversationId} className="border-t border-slate-800 hover:bg-slate-800/30">
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {new Date(evaluation.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {formatLatency(evaluation.metrics.latency)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {evaluation.metrics.tokens.total.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {formatCost(evaluation.metrics.cost.total)}
                                        </td>
                                        {evaluation.quality && (
                                            <>
                                                <td className="px-4 py-3 text-sm text-slate-300">
                                                    {(evaluation.quality.relevance * 100).toFixed(1)}%
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-300">
                                                    {(evaluation.quality.accuracy * 100).toFixed(1)}%
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
