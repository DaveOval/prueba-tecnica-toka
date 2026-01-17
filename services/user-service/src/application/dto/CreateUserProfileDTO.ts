export interface CreateUserProfileDTO {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
}

export interface CreateUserProfileResponseDTO {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    createdAt: Date;
}
