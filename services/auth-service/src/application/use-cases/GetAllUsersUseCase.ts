import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export interface UserDTO {
    id: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class GetAllUsersUseCase {
    constructor(
        private readonly userRepository: IUserRepository
    ){}

    async execute(): Promise<UserDTO[]> {
        const users = await this.userRepository.findAll();
        
        return users.map(user => ({
            id: user.getId(),
            email: user.getEmail().getValue(),
            role: user.getRole(),
            active: user.isActive(),
            createdAt: user.getCreatedAt(),
            updatedAt: user.getUpdatedAt(),
        }));
    }
}
