export interface GetUserProfileResponseDTO {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    createdAt: Date;
    updatedAt: Date;
}
