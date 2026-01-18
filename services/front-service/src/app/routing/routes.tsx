import { Navigate } from 'react-router-dom';
import HomePage from '../../pages/HomePage';
import { NotFoundPage } from '../../pages/NotFoundPage';
import LoginPage from '../../pages/LoginPage';
import SigninPage from '../../pages/SiginPage';
import UsersPage from '../../pages/UsersPage';
import ProfilePage from '../../pages/ProfilePage';
import AuditLogsPage from '../../pages/AuditLogsPage';
import { ProtectedRoute } from './ProtectedRoute';

export const routes = {
    home: '/',
    users: '/users',
    profile: '/profile',
    auditLogs: '/audit-logs',
    notFound: '*',
    login: '/login',
    signin: '/signin',
} as const;

// Rutas públicas (sin Navbar)
export const publicRoutes = [
    { path: routes.login, element: <LoginPage /> },
    { path: routes.signin, element: <SigninPage /> },
];

// Rutas protegidas (con Navbar)
export const protectedRoutes = [
    { 
        path: routes.home, 
        element: (
            <ProtectedRoute>
                <HomePage />
            </ProtectedRoute>
        ) 
    },
    { 
        path: routes.profile, 
        element: (
            <ProtectedRoute>
                <ProfilePage />
            </ProtectedRoute>
        ) 
    },
    { 
        path: routes.users, 
        element: (
            <ProtectedRoute>
                <UsersPage />
            </ProtectedRoute>
        ) 
    },
    { 
        path: routes.auditLogs, 
        element: (
            <ProtectedRoute>
                <AuditLogsPage />
            </ProtectedRoute>
        ) 
    },
];

// Todas las rutas (para compatibilidad)
export const appRoutes = [
    ...publicRoutes,
    ...protectedRoutes,
    { path: "/inicio", element: <Navigate to={routes.home} replace /> },
    { path: routes.notFound, element: <NotFoundPage /> },
];