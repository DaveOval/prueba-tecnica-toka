import { Navigate } from 'react-router-dom';
import HomePage from '../../pages/HomePage';
import NotFoundPage from '../../pages/NotFoundPage';
import LoginPage from '../../pages/LoginPage';
import SigninPage from '../../pages/SiginPage';
import { ProtectedRoute } from './ProtectedRoute';

export const routes = {
    home: '/',
    notFound: '*',
    login: '/login',
    signin: '/signin',
} as const;

export const appRoutes = [
    // Rutas públicas
    { path: routes.login, element: <LoginPage /> },
    { path: routes.signin, element: <SigninPage /> },
    // Rutas protegidas
    { 
        path: routes.home, 
        element: (
            <ProtectedRoute>
                <HomePage />
            </ProtectedRoute>
        ) 
    },
    // Redireccion
    { path: "/inicio", element: <Navigate to={routes.home} replace /> },
    { path: routes.notFound, element: <NotFoundPage /> },
]