import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: {
        id: string;
        email: string;
        role: string;
    } | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    token: localStorage.getItem('access_token') || null,
    user: null,
};

if (initialState.token) {
    initialState.isAuthenticated = true;
    try {
        const payload = JSON.parse(atob(initialState.token.split('.')[1]));
        initialState.user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role || 'user',
        };
    } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem('access_token');
        initialState.token = null;
        initialState.isAuthenticated = false;
    }
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<{ token: string; user: { id: string; email: string; role: string } }>) => {
            state.isAuthenticated = true;
            state.token = action.payload.token;
            state.user = action.payload.user;
            localStorage.setItem('access_token', action.payload.token);
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.token = null;
            state.user = null;
            localStorage.removeItem('access_token');
        },
        setUser: (state, action: PayloadAction<{ id: string; email: string; role: string }>) => {
            state.user = action.payload;
        },
    },
})

export const { login, logout, setUser } = authSlice.actions;
export default authSlice.reducer;