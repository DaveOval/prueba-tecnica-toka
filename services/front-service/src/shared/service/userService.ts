import { userApi } from "../api/apiClient";

export interface UserProfile {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserProfileData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
}

export const userService = {
    async getUserProfile(userId: string): Promise<{ success: boolean; data: UserProfile }> {
        const response = await userApi.get<{ success: boolean; data: UserProfile }>(`/${userId}`);
        return response.data;
    },

    async getAllUsers(): Promise<{ success: boolean; data: UserProfile[] }> {
        const response = await userApi.get<{ success: boolean; data: UserProfile[] }>('/');
        return response.data;
    },

    async updateUserProfile(userId: string, data: UpdateUserProfileData): Promise<{ success: boolean; data: UserProfile }> {
        const response = await userApi.put<{ success: boolean; data: UserProfile }>(`/${userId}`, data);
        return response.data;
    },

    async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string }> {
        const response = await userApi.delete<{ success: boolean; message: string }>(`/${userId}`);
        return response.data;
    },
};
