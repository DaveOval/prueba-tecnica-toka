import { UserDomainService } from "../../domain/services/UserDomainService.js";
import type { GetUserProfileResponseDTO } from "../dto/GetUserProfileResponseDTO.js";
import type { ICacheService } from "../ports/ICacheService.js";

export class GetUserProfileUseCase {
    constructor(
        private readonly userDomainService: UserDomainService,
        private readonly cacheService?: ICacheService
    ) {}

    async execute(userId: string): Promise<GetUserProfileResponseDTO> {
        const cacheKey = `user:profile:${userId}`;

        // Intentar obtener del cache
        if (this.cacheService) {
            const cached = await this.cacheService.get<GetUserProfileResponseDTO>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Si no está en cache, obtener de la base de datos
        const profile = await this.userDomainService.getProfile(userId);

        const result: GetUserProfileResponseDTO = {
            id: profile.getId(),
            email: profile.getEmail().getValue(),
            firstName: profile.getFirstName(),
            lastName: profile.getLastName(),
            phone: profile.getPhone(),
            address: profile.getAddress(),
            createdAt: profile.getCreatedAt(),
            updatedAt: profile.getUpdatedAt(),
        };

        // Guardar en cache (TTL de 1 hora)
        if (this.cacheService) {
            await this.cacheService.set(cacheKey, result, 3600);
        }

        return result;
    }
}
