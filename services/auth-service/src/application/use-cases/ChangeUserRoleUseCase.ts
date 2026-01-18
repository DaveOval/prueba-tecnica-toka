import { AuthDomainService } from "../../domain/services/AuthDomainService.js";
import { UserRole } from "../../domain/entities/User.js";
import type { IEventPublisher } from "../ports/IEventPublisher.js";

export class ChangeUserRoleUseCase {
    constructor(
        private readonly authDomainService: AuthDomainService,
        private readonly eventPublisher: IEventPublisher
    ){}

    async execute(userId: string, newRole: string): Promise<void> {
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
