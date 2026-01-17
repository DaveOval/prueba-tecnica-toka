import { UserDomainService } from "../../domain/services/UserDomainService.js";
import type { ICacheService } from "../ports/ICacheService.js";
import type { IEventPublisher } from "../ports/IEventPublisher.js";

export class DeleteUserProfileUseCase {
    constructor(
        private readonly userDomainService: UserDomainService,
        private readonly cacheService?: ICacheService,
        private readonly eventPublisher?: IEventPublisher
    ) {}

    async execute(userId: string): Promise<void> {
        await this.userDomainService.deleteProfile(userId);

        // Invalidar cache después de eliminar
        if (this.cacheService) {
            const cacheKey = `user:profile:${userId}`;
            await this.cacheService.delete(cacheKey);
        }

        // publish audit event
        if (this.eventPublisher) {
            await this.eventPublisher.publish("audit.event", {
                userId: userId,
                action: "DELETE",
                entityType: "USER_PROFILE",
                entityId: userId,
            });
        }
    }
}
