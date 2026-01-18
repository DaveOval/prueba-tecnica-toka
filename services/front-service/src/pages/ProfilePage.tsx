import { useEffect, useState } from 'react';
import { useAuth } from '../shared/hooks/useAuth';
import { userService, type UserProfile } from '../shared/service/userService';
import { AxiosError } from 'axios';

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await userService.getUserProfile(user!.id);
            if (response.success) {
                setProfile(response.data);
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error?.message || 'Error al cargar el perfil');
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Error al cargar el perfil';
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                <p className="text-slate-400">Cargando perfil...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-800 bg-red-900/20 p-6 shadow">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                <p className="text-slate-400">No se encontró el perfil</p>
            </div>
        );
    }

    return (
        <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>
                <p className="mt-2 text-slate-300">
                    Información de tu cuenta y perfil de usuario.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                <div className="space-y-6">
                    {/* Información de Cuenta */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-slate-200">Información de Cuenta</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                                <p className="text-slate-200">{profile.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Rol</label>
                                <span className={`inline-block px-2 py-1 text-xs rounded ${
                                    user?.role === 'admin' 
                                        ? 'bg-blue-600/20 text-blue-400' 
                                        : 'bg-slate-600/20 text-slate-400'
                                }`}>
                                    {user?.role || 'user'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Información Personal */}
                    <div className="border-t border-slate-700 pt-6">
                        <h2 className="text-lg font-semibold mb-4 text-slate-200">Información Personal</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                                <p className="text-slate-200">
                                    {profile.firstName || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Apellido</label>
                                <p className="text-slate-200">
                                    {profile.lastName || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Teléfono</label>
                                <p className="text-slate-200">
                                    {profile.phone || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Dirección</label>
                                <p className="text-slate-200">
                                    {profile.address || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Información de Fechas */}
                    <div className="border-t border-slate-700 pt-6">
                        <h2 className="text-lg font-semibold mb-4 text-slate-200">Información de Fechas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Fecha de Registro</label>
                                <p className="text-slate-200">
                                    {new Date(profile.createdAt).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Última Actualización</label>
                                <p className="text-slate-200">
                                    {new Date(profile.updatedAt).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {user?.role === 'admin' && (
                        <div className="border-t border-slate-700 pt-6">
                            <p className="text-sm text-slate-400">
                                💡 Como administrador, puedes editar y eliminar usuarios desde la página de gestión de usuarios.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
