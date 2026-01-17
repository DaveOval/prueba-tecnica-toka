import { UserDomainService } from "../../domain/services/UserDomainService.js";
import type { ICacheService } from "../ports/ICacheService.js";

export class DeleteUserProfileUseCase {
    constructor(
        private readonly userDomainService: UserDomainService,
        private readonly cacheService?: ICacheService
    ) {}

    async execute(userId: string): Promise<void> {
        await this.userDomainService.deleteProfile(userId);

        // Invalidar cache después de eliminar
        if (this.cacheService) {
            const cacheKey = `user:profile:${userId}`;
            await this.cacheService.delete(cacheKey);
        }
    }
}
