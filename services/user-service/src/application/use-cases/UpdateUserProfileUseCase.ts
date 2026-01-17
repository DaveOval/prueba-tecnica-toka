import { UserDomainService } from "../../domain/services/UserDomainService.js";
import type { UpdateUserProfileDTO, UpdateUserProfileResponseDTO } from "../dto/UpdateUserProfileDTO.js";
import type { ICacheService } from "../ports/ICacheService.js";
import type { IEventPublisher } from "../ports/IEventPublisher.js";

export class UpdateUserProfileUseCase {
    constructor(
        private readonly userDomainService: UserDomainService,
        private readonly cacheService?: ICacheService,
        private readonly eventPublisher?: IEventPublisher
    ) {}

    async execute(userId: string, dto: UpdateUserProfileDTO): Promise<UpdateUserProfileResponseDTO> {
        const profile = await this.userDomainService.updateProfile(userId, dto);

        const result: UpdateUserProfileResponseDTO = {
            id: profile.getId(),
            email: profile.getEmail().getValue(),
            firstName: profile.getFirstName(),
            lastName: profile.getLastName(),
            phone: profile.getPhone(),
            address: profile.getAddress(),
            updatedAt: profile.getUpdatedAt(),
        };

        // Invalidar y actualizar cache después de actualizar
        if (this.cacheService) {
            const cacheKey = `user:profile:${userId}`;
            await this.cacheService.delete(cacheKey);
            await this.cacheService.set(cacheKey, result, 3600);
        }

        // publish audit event
        if (this.eventPublisher) {
            await this.eventPublisher.publish("audit.event", {
                userId: userId,
                action: "UPDATE",
                entityType: "USER_PROFILE",
                entityId: userId,
                details: {
                    updatedFields: Object.keys(dto),
                },
            });
        }

        return result;
    }
}
