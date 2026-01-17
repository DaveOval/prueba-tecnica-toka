import { UserDomainService } from "../../domain/services/UserDomainService.js";
import type { GetUserProfileResponseDTO } from "../dto/GetUserProfileResponseDTO.js";

export class GetUserProfileUseCase {
    constructor(
        private readonly userDomainService: UserDomainService
    ) {}

    async execute(userId: string): Promise<GetUserProfileResponseDTO> {
        const profile = await this.userDomainService.getProfile(userId);

        return {
            id: profile.getId(),
            email: profile.getEmail().getValue(),
            firstName: profile.getFirstName(),
            lastName: profile.getLastName(),
            phone: profile.getPhone(),
            address: profile.getAddress(),
            createdAt: profile.getCreatedAt(),
            updatedAt: profile.getUpdatedAt(),
        };
    }
}
