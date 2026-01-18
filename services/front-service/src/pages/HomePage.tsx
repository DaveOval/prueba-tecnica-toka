import { useAuth } from '../shared/hooks/useAuth';
import { Link } from 'react-router-dom';
import { routes } from '../app/routing/routes';
import { useEffect, useState } from 'react';
import { userService } from '../shared/service/userService';
import { authService } from '../shared/service/authService';
import { AxiosError } from 'axios';

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin' && user?.id) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [usersResponse, authResponse] = await Promise.all([
        userService.getAllUsers(),
        authService.getAllUsers(),
      ]);

      if (usersResponse.success && authResponse.success) {
        const totalUsers = authResponse.data.length;
        const activeUsers = authResponse.data.filter(u => u.active).length;
        const pendingUsers = authResponse.data.filter(u => !u.active).length;

        setStats({
          totalUsers,
          activeUsers,
          pendingUsers,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <section className="space-y-6">
      {/* Bienvenida */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {user?.email?.split('@')[0] || 'Usuario'}
        </h1>
        <p className="mt-2 text-slate-300">
          Bienvenido al sistema de gestión de usuarios.
        </p>
        {user?.role === 'admin' && (
          <p className="mt-1 text-sm text-slate-400">
            Tienes acceso completo como administrador.
          </p>
        )}
      </div>

      {/* Dashboard para Admin */}
      {user?.role === 'admin' && (
        <>
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
              <p className="text-slate-400">Cargando estadísticas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total de Usuarios</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Usuarios Activos</p>
                    <p className="text-3xl font-bold mt-2 text-green-400">{stats.activeUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Pendientes de Aprobación</p>
                    <p className="text-3xl font-bold mt-2 text-yellow-400">{stats.pendingUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Accesos Rápidos */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Accesos Rápidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to={routes.users}
                className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Gestión de Usuarios</p>
                    <p className="text-sm text-slate-400">Administrar y aprobar usuarios</p>
                  </div>
                </div>
              </Link>

              <Link
                to={routes.profile}
                className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Mi Perfil</p>
                    <p className="text-sm text-slate-400">Ver y editar tu información</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Contenido para Usuarios Normales */}
      {user?.role !== 'admin' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Acciones Disponibles</h2>
          <div className="space-y-4">
            <Link
              to={routes.profile}
              className="block p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Ver Mi Perfil</p>
                  <p className="text-sm text-slate-400">Consulta tu información personal</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
