import { AuthDomainService } from "../../domain/services/AuthDomainService.js";
import { UserRole } from "../../domain/entities/User.js";
import type { IEventPublisher } from "../ports/IEventPublisher.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export class ChangeUserRoleUseCase {
    constructor(
        private readonly authDomainService: AuthDomainService,
        private readonly userRepository: IUserRepository,
        private readonly eventPublisher: IEventPublisher
    ){}

    async execute(userId: string, newRole: string): Promise<void> {
        // Verificar que el usuario existe
        const existingUser = await this.userRepository.findById(userId);
        if (!existingUser) {
            throw new Error("User not found");
        }

        // No permitir quitar el rol de admin a otros admins
        if (existingUser.isAdmin() && newRole !== 'admin') {
            throw new Error("Cannot remove admin role from admin users");
        }

        const role = newRole === 'admin' ? UserRole.ADMIN : UserRole.USER;
        const user = await this.authDomainService.changeUserRole(userId, role);

        // publish audit event
        await this.eventPublisher.publish("audit.event", {
            userId: user.getId(),
            action: "UPDATE",
            entityType: "AUTH",
            entityId: user.getId(),
            details: { 
                email: user.getEmail().getValue(),
                newRole: user.getRole(),
            },
        });
    }
}
