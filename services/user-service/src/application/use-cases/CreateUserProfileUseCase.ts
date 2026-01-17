import { Email } from "../../domain/value-objects/Email.js";
import { UserDomainService } from "../../domain/services/UserDomainService.js";
import type { CreateUserProfileDTO, CreateUserProfileResponseDTO } from "../dto/CreateUserProfileDTO.js";

export class CreateUserProfileUseCase {
    constructor(
        private readonly userDomainService: UserDomainService
    ) {}

    async execute(dto: CreateUserProfileDTO): Promise<CreateUserProfileResponseDTO> {
        const email = Email.create(dto.email);

        const profile = await this.userDomainService.createProfile(
            dto.id,
            email,
            dto.firstName,
            dto.lastName,
            dto.phone,
            dto.address
        );

        return {
            id: profile.getId(),
            email: profile.getEmail().getValue(),
            firstName: profile.getFirstName(),
            lastName: profile.getLastName(),
            phone: profile.getPhone(),
            address: profile.getAddress(),
            createdAt: profile.getCreatedAt(),
        };
    }
}
