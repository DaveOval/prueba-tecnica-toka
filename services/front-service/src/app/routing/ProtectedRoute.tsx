import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { routes } from "./routes";


interface ProtectedRouterProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children } : ProtectedRouterProps) {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to={routes.login} replace />;
    }

    return children;
}