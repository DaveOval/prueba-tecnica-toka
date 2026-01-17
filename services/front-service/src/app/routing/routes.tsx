import { Navigate } from 'react-router-dom';
// import HomePage from '../pages/HomePage';
// import NotFoundPage from '../pages/NotFoundPage';

export const routes = {
    home: '/',
    notFound: '*',
} as const;

export const appRoutes = [
    // { path: routes.home, element: <HomePage /> },
    { path: routes.home, element: <h1>Home</h1> },
    // Redireccion
    { path: "/inicio", element: <Navigate to={routes.home} replace /> },
    { path: routes.notFound, element: <Navigate to={routes.notFound} replace /> },
]