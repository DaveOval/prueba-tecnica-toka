import { useEffect, useState } from 'react';
import { useAuth } from '../shared/hooks/useAuth';
import { auditService, type AuditLog, type GetAuditLogsParams } from '../shared/service/auditService';
import { AxiosError } from 'axios';

const ITEMS_PER_PAGE = 20;

export default function AuditLogsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<GetAuditLogsParams>({
        limit: ITEMS_PER_PAGE,
        offset: 0,
    });

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchLogs();
        }
    }, [user, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await auditService.getAuditLogs(filters);
            setLogs(response.logs);
            setTotal(response.total);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error?.message || 'Error al cargar logs');
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Error al cargar logs';
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof GetAuditLogsParams, value: string | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined,
            offset: 0,
        }));
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setFilters(prev => ({
            ...prev,
            offset: (page - 1) * ITEMS_PER_PAGE,
        }));
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE':
            case 'REGISTER':
                return 'bg-green-600/20 text-green-400';
            case 'UPDATE':
            case 'ACTIVATE':
                return 'bg-blue-600/20 text-blue-400';
            case 'DELETE':
                return 'bg-red-600/20 text-red-400';
            case 'LOGIN':
                return 'bg-purple-600/20 text-purple-400';
            default:
                return 'bg-slate-600/20 text-slate-400';
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="rounded-2xl border border-red-800 bg-red-900/20 p-6 shadow">
                <h2 className="text-xl font-semibold text-red-400">Acceso Denegado</h2>
                <p className="mt-2 text-red-300">
                    Solo los administradores pueden ver esta página.
                </p>
            </div>
        );
    }

    return (
        <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                <h1 className="text-2xl font-semibold tracking-tight">Logs de Auditoría</h1>
                <p className="mt-2 text-slate-300">
                    Registro de todas las acciones realizadas en el sistema.
                </p>
            </div>

            {/* Filtros */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                <h2 className="text-lg font-semibold mb-4">Filtros</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Tipo de Entidad
                        </label>
                        <select
                            value={filters.entityType || ''}
                            onChange={(e) => handleFilterChange('entityType', e.target.value || undefined)}
                            className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="USER">Usuario</option>
                            <option value="USER_PROFILE">Perfil de Usuario</option>
                            <option value="AUTH">Autenticación</option>
                            <option value="SYSTEM">Sistema</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Acción
                        </label>
                        <select
                            value={filters.action || ''}
                            onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                            className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas</option>
                            <option value="CREATE">Crear</option>
                            <option value="UPDATE">Actualizar</option>
                            <option value="DELETE">Eliminar</option>
                            <option value="LOGIN">Iniciar Sesión</option>
                            <option value="REGISTER">Registrar</option>
                            <option value="ACTIVATE">Activar</option>
                            <option value="DEACTIVATE">Desactivar</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Usuario ID
                        </label>
                        <input
                            type="text"
                            value={filters.userId || ''}
                            onChange={(e) => handleFilterChange('userId', e.target.value || undefined)}
                            placeholder="Filtrar por ID de usuario"
                            className="w-full px-3 py-2 bg-slate-700 text-slate-200 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <button
                    onClick={() => {
                        setFilters({ limit: ITEMS_PER_PAGE, offset: 0 });
                        setCurrentPage(1);
                    }}
                    className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition"
                >
                    Limpiar Filtros
                </button>
            </div>

            {loading && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                    <p className="text-slate-400">Cargando logs...</p>
                </div>
            )}

            {error && (
                <div className="rounded-2xl border border-red-800 bg-red-900/20 p-6 shadow">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                Registros ({total})
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Fecha/Hora</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Acción</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Tipo de Entidad</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Usuario ID</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Entidad ID</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400">
                                                No hay logs disponibles
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                                <td className="py-3 px-4 text-sm text-slate-300">
                                                    {new Date(log.timestamp).toLocaleString('es-ES')}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-300">{log.entityType}</td>
                                                <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                                                    {log.userId || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                                                    {log.entityId || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-300">
                                                    {log.details ? (
                                                        <details className="cursor-pointer">
                                                            <summary className="text-blue-400 hover:text-blue-300">
                                                                Ver detalles
                                                            </summary>
                                                            <pre className="mt-2 text-xs bg-slate-800 p-2 rounded overflow-auto max-w-xs">
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        </details>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-slate-400">
                                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, total)} de {total}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        Anterior
                                    </button>
                                    <span className="px-3 py-1.5 text-slate-300">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
