import { authApi } from "../api/apiClient";

export interface LoginCredentials {
    email: string;
    password: string;
};

export interface RegisterData {
    email: string;
    password: string;
};

export interface LoginResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
        };
    }
}

export interface RegisterResponse {
    success: boolean;
    data: {
        id: string;
        email: string;
        createdAt: string;
    };
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await authApi.post<LoginResponse>('/login', credentials);
        return response.data;
    },

    async register(data: RegisterData): Promise<RegisterResponse> {
        const response = await authApi.post<RegisterResponse>('/register', data);
        return response.data;
    },

    async getAllUsers(): Promise<{ success: boolean; data: Array<{ id: string; email: string; role: string; active: boolean; createdAt: string; updatedAt: string }> }> {
        const response = await authApi.get<{ success: boolean; data: Array<{ id: string; email: string; role: string; active: boolean; createdAt: string; updatedAt: string }> }>('/users');
        return response.data;
    },

    async activateUser(userId: string): Promise<{ success: boolean; message: string }> {
        const response = await authApi.patch<{ success: boolean; message: string }>(`/activate/${userId}`);
        return response.data;
    },

    decodeToken(token: string): { userId: string; email: string; role: string } | null {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                userId: payload.userId,
                email: payload.email,
                role: payload.role || 'user',
            };
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    },
}