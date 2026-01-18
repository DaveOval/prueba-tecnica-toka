export interface RegisterUserDTO {
    email: string;
    password: string;
}

export interface RegisterUserResponseDTO {
    id: string;
    email: string;
    createdAt: Date;
}