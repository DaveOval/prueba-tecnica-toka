import { useEffect, useState } from 'react';
import { userApi } from '../shared/api/apiClient';
import { useAuth } from '../shared/hooks/useAuth';
import { AxiosError } from 'axios';

interface UserProfile {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function UsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await userApi.get<{ success: boolean; data: UserProfile[] }>('/');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error?.message || 'Error al cargar usuarios');
            }
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar usuarios';
            setError(errorMessage);
        } finally {
            setLoading(false);
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
                <h1 className="text-2xl font-semibold tracking-tight">Gestión de Usuarios</h1>
                <p className="mt-2 text-slate-300">
                    Lista de todos los usuarios registrados en el sistema.
                </p>
            </div>

            {loading && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                    <p className="text-slate-400">Cargando usuarios...</p>
                </div>
            )}

            {error && (
                <div className="rounded-2xl border border-red-800 bg-red-900/20 p-6 shadow">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Nombre</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Teléfono</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Dirección</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Fecha de Registro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400">
                                            No hay usuarios registrados
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                            <td className="py-3 px-4 text-sm text-slate-200">{user.email}</td>
                                            <td className="py-3 px-4 text-sm text-slate-300">
                                                {user.firstName || user.lastName
                                                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-300">{user.phone || '-'}</td>
                                            <td className="py-3 px-4 text-sm text-slate-300">{user.address || '-'}</td>
                                            <td className="py-3 px-4 text-sm text-slate-400">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}
