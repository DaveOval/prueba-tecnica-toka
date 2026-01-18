import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { login, logout } from '../../app/store/slices/authSlice';
import { authService, type LoginCredentials, type RegisterData } from '../service/authService';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../app/routing/routes';
import { AxiosError } from 'axios';

export function useAuth() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    const handleLogin = async (credentials: LoginCredentials) => {
        try {
            const response = await authService.login(credentials);
            
            if (response.success && response.data.accessToken) {
                const userData = authService.decodeToken(response.data.accessToken);
                
                if (userData) {
                    dispatch(login({
                        token: response.data.accessToken,
                        user: {
                            id: userData.userId,
                            email: userData.email,
                            role: userData.role,
                        },
                    }));

                    navigate(routes.home);
                    return { success: true };
                }
            }
            
            return { success: false, error: 'Error al procesar la respuesta' };
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                return { success: false, error: error.response?.data?.error?.message || 'Error al iniciar sesión' };
            }
            const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
            return { success: false, error: errorMessage };
        }
    };

    const handleRegister = async (data: RegisterData) => {
        try {
            const response = await authService.register(data);
            
            if (response.success) {
                // Después de registrar, hacer login automático
                return await handleLogin({
                    email: data.email,
                    password: data.password,
                });
            }
            
            return { success: false, error: 'Error al registrar usuario' };
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                return { success: false, error: error.response?.data?.error?.message || 'Error al registrar usuario' };
            }
            const errorMessage = error instanceof Error ? error.message : 'Error al registrar usuario';
            return { success: false, error: errorMessage };
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate(routes.login);
    };

    return {
        isAuthenticated,
        user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
    };
}