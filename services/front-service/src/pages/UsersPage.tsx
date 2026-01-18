import { useEffect, useState } from 'react';
import { userApi } from '../shared/api/apiClient';
import { authService } from '../shared/service/authService';
import { userService, type UserProfile } from '../shared/service/userService';
import { useAuth } from '../shared/hooks/useAuth';
import { EditUserModal } from '../shared/components/EditUserModal';
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

interface AuthUser {
    id: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function UsersPage() {
    const { user } = useAuth();
    const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
    const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activating, setActivating] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [deactivatingUserId, setDeactivatingUserId] = useState<string | null>(null);
    const [changingRoleUserId, setChangingRoleUserId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            // Obtener perfiles de usuario y usuarios de auth
            const [profilesResponse, authResponse] = await Promise.all([
                userApi.get<{ success: boolean; data: UserProfile[] }>('/'),
                authService.getAllUsers(),
            ]);

            if (profilesResponse.data.success) {
                setUserProfiles(profilesResponse.data.data);
            }

            if (authResponse.success) {
                setAuthUsers(authResponse.data);
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error?.message || 'Error al cargar usuarios');
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Error al cargar usuarios';
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (userId: string) => {
        try {
            setActivating(userId);
            await authService.activateUser(userId);
            // Recargar datos
            await fetchData();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error?.message || 'Error al activar usuario');
            } else {
                setError('Error al activar usuario');
            }
        } finally {
            setActivating(null);
        }
    };

    const handleEdit = (profile: UserProfile) => {
        setEditingUser(profile);
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            setDeletingUserId(userId);
            // Eliminar tanto el perfil como el usuario de autenticación
            await Promise.all([
                userService.deleteUserProfile(userId),
                authService.deleteUser(userId),
            ]);
            await fetchData();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error?.message || 'Error al eliminar usuario');
            } else {
                setError('Error al eliminar usuario');
            }
        } finally {
            setDeletingUserId(null);
        }
    };

    const handleDeactivate = async (userId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas desactivar este usuario? No podrá iniciar sesión hasta que sea reactivado.')) {
            return;
        }

        try {
            setDeactivatingUserId(userId);
            await authService.deactivateUser(userId);
            await fetchData();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error?.message || 'Error al desactivar usuario');
            } else {
                setError('Error al desactivar usuario');
            }
        } finally {
            setDeactivatingUserId(null);
        }
    };

    const handleChangeRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const roleText = newRole === 'admin' ? 'administrador' : 'usuario';
        
        if (!window.confirm(`¿Estás seguro de que deseas cambiar el rol de este usuario a ${roleText}?`)) {
            return;
        }

        try {
            setChangingRoleUserId(userId);
            await authService.changeUserRole(userId, newRole as 'user' | 'admin');
            await fetchData();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error?.message || 'Error al cambiar rol');
            } else {
                setError('Error al cambiar rol');
            }
        } finally {
            setChangingRoleUserId(null);
        }
    };

    // Combinar datos de auth y perfiles
    const combinedUsers = authUsers.map(authUser => {
        const profile = userProfiles.find(p => p.id === authUser.id);
        return {
            ...authUser,
            profile,
        };
    });

    const pendingUsers = combinedUsers.filter(u => !u.active);
    const activeUsers = combinedUsers.filter(u => u.active);

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
                    Administra los usuarios del sistema y aprueba solicitudes de registro.
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
                <>
                    {/* Usuarios Pendientes */}
                    {pendingUsers.length > 0 && (
                        <div className="rounded-2xl border border-yellow-800 bg-yellow-900/20 p-6 shadow">
                            <h2 className="text-xl font-semibold text-yellow-400 mb-4">
                                Usuarios Pendientes de Aprobación ({pendingUsers.length})
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-yellow-700">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Email</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Rol</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Fecha de Registro</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingUsers.map((authUser) => (
                                            <tr key={authUser.id} className="border-b border-yellow-800/50 hover:bg-yellow-900/10">
                                                <td className="py-3 px-4 text-sm text-slate-200">{authUser.email}</td>
                                                <td className="py-3 px-4 text-sm text-slate-300">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${
                                                        authUser.role === 'admin' 
                                                            ? 'bg-blue-600/20 text-blue-400' 
                                                            : 'bg-slate-600/20 text-slate-400'
                                                    }`}>
                                                        {authUser.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-400">
                                                    {new Date(authUser.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <button
                                                        onClick={() => handleActivate(authUser.id)}
                                                        disabled={activating === authUser.id}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                    >
                                                        {activating === authUser.id ? 'Activando...' : 'Activar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Usuarios Activos */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                        <h2 className="text-xl font-semibold mb-4">
                            Usuarios Activos ({activeUsers.length})
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Nombre</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Rol</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Teléfono</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Dirección</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Fecha de Registro</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                No hay usuarios activos
                                            </td>
                                        </tr>
                                    ) : (
                                        activeUsers.map((authUser) => {
                                            const profile = authUser.profile;
                                            return (
                                                <tr key={authUser.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                                    <td className="py-3 px-4 text-sm text-slate-200">{authUser.email}</td>
                                                    <td className="py-3 px-4 text-sm text-slate-300">
                                                        {profile && (profile.firstName || profile.lastName)
                                                            ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
                                                            : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-300">
                                                        <span className={`px-2 py-0.5 text-xs rounded ${
                                                            authUser.role === 'admin' 
                                                                ? 'bg-blue-600/20 text-blue-400' 
                                                                : 'bg-slate-600/20 text-slate-400'
                                                        }`}>
                                                            {authUser.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-300">
                                                        {profile?.phone || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-300">
                                                        {profile?.address || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-400">
                                                        {new Date(authUser.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <div className="flex flex-wrap gap-2">
                                                            {profile && (
                                                                <>
                                                                    {/* Solo mostrar botón de editar si no es admin */}
                                                                    {authUser.role !== 'admin' && (
                                                                        <button
                                                                            onClick={() => handleEdit(profile)}
                                                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition"
                                                                        >
                                                                            Editar
                                                                        </button>
                                                                    )}
                                                                    {/* Solo mostrar botón de desactivar si no es admin */}
                                                                    {authUser.role !== 'admin' && (
                                                                        <button
                                                                            onClick={() => handleDeactivate(authUser.id)}
                                                                            disabled={deactivatingUserId === authUser.id}
                                                                            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                                        >
                                                                            {deactivatingUserId === authUser.id ? 'Desactivando...' : 'Desactivar'}
                                                                        </button>
                                                                    )}
                                                                    {/* Solo mostrar botón de cambiar rol si no es admin */}
                                                                    {authUser.role !== 'admin' && (
                                                                        <button
                                                                            onClick={() => handleChangeRole(authUser.id, authUser.role)}
                                                                            disabled={changingRoleUserId === authUser.id}
                                                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                                        >
                                                                            {changingRoleUserId === authUser.id 
                                                                                ? 'Cambiando...' 
                                                                                : 'Hacer Admin'}
                                                                        </button>
                                                                    )}
                                                                    {/* Solo mostrar botón de eliminar si no es admin */}
                                                                    {authUser.role !== 'admin' && (
                                                                        <button
                                                                            onClick={() => handleDelete(authUser.id)}
                                                                            disabled={deletingUserId === authUser.id}
                                                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                                        >
                                                                            {deletingUserId === authUser.id ? 'Eliminando...' : 'Eliminar'}
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modal de Edición */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => {
                        fetchData();
                        setEditingUser(null);
                    }}
                />
            )}
        </section>
    );
}
