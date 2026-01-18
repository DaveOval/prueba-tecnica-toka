import axios from 'axios';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL?.replace("/api/auth", "") || "http://localhost:3000",
    headers: {
        'Content-Type': 'application/json',
    },
});


// Interceptores
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token inválido o expirado
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Cliente específico para Auth Service
export const authApi = axios.create({
    baseURL: import.meta.env.VITE_API_AUTH_URL || 'http://localhost:3000/api/auth',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token a authApi (para endpoints protegidos)
authApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Cliente específico para User Service
export const userApi = axios.create({
    baseURL: import.meta.env.VITE_API_USER_URL || 'http://localhost:3001/api/users',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token a userApi
userApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Cliente específico para Audit Service
export const auditApi = axios.create({
    baseURL: import.meta.env.VITE_API_AUDIT_URL || 'http://localhost:3002/api/audit',
    headers: {
        'Content-Type': 'application/json',
    },
});