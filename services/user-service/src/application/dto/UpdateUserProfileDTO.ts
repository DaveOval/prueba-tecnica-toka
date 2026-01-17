export interface UpdateUserProfileDTO {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
}

export interface UpdateUserProfileResponseDTO {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    updatedAt: Date;
}
