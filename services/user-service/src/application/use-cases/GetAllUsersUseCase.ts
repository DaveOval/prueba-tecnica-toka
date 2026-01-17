import { UserDomainService } from "../../domain/services/UserDomainService.js";
import type { GetUserProfileResponseDTO } from "../dto/GetUserProfileResponseDTO.js";

export class GetAllUsersUseCase {
    constructor(
        private readonly userDomainService: UserDomainService
    ) {}

    async execute(): Promise<GetUserProfileResponseDTO[]> {
        const profiles = await this.userDomainService.getAllProfiles();

        return profiles.map(profile => ({
            id: profile.getId(),
            email: profile.getEmail().getValue(),
            firstName: profile.getFirstName(),
            lastName: profile.getLastName(),
            phone: profile.getPhone(),
            address: profile.getAddress(),
            createdAt: profile.getCreatedAt(),
            updatedAt: profile.getUpdatedAt(),
        }));
    }
}
