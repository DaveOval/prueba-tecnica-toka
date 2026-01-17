import { Email } from "../../domain/value-objects/Email.js";
import { UserDomainService } from "../../domain/services/UserDomainService.js";
import type { CreateUserProfileDTO, CreateUserProfileResponseDTO } from "../dto/CreateUserProfileDTO.js";
import type { ICacheService } from "../ports/ICacheService.js";

export class CreateUserProfileUseCase {
    constructor(
        private readonly userDomainService: UserDomainService,
        private readonly cacheService?: ICacheService
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

        const result: CreateUserProfileResponseDTO = {
            id: profile.getId(),
            email: profile.getEmail().getValue(),
            firstName: profile.getFirstName(),
            lastName: profile.getLastName(),
            phone: profile.getPhone(),
            address: profile.getAddress(),
            createdAt: profile.getCreatedAt(),
        };

        // Guardar en cache después de crear
        if (this.cacheService) {
            const cacheKey = `user:profile:${profile.getId()}`;
            await this.cacheService.set(cacheKey, result, 3600);
        }

        return result;
    }
}
