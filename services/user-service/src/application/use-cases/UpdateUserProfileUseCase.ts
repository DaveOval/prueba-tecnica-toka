import { UserDomainService } from "../../domain/services/UserDomainService.js";
import type { UpdateUserProfileDTO, UpdateUserProfileResponseDTO } from "../dto/UpdateUserProfileDTO.js";

export class UpdateUserProfileUseCase {
    constructor(
        private readonly userDomainService: UserDomainService
    ) {}

    async execute(userId: string, dto: UpdateUserProfileDTO): Promise<UpdateUserProfileResponseDTO> {
        const profile = await this.userDomainService.updateProfile(userId, dto);

        return {
            id: profile.getId(),
            email: profile.getEmail().getValue(),
            firstName: profile.getFirstName(),
            lastName: profile.getLastName(),
            phone: profile.getPhone(),
            address: profile.getAddress(),
            updatedAt: profile.getUpdatedAt(),
        };
    }
}
