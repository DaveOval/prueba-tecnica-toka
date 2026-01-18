import { AuthDomainService } from "../../domain/services/AuthDomainService.js";
import type { IEventPublisher } from "../ports/IEventPublisher.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export class DeleteUserUseCase {
    constructor(
        private readonly authDomainService: AuthDomainService,
        private readonly userRepository: IUserRepository,
        private readonly eventPublisher: IEventPublisher
    ) {}

    async execute(userId: string): Promise<void> {
        // Verificar que el usuario existe y no es admin
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // No permitir eliminar a otros admins
        if (user.isAdmin()) {
            throw new Error("Cannot delete admin users");
        }

        await this.authDomainService.deleteUser(userId);

        // publish audit event
        await this.eventPublisher.publish("audit.event", {
            userId: userId,
            action: "DELETE",
            entityType: "AUTH",
            entityId: userId,
        });
    }
}
