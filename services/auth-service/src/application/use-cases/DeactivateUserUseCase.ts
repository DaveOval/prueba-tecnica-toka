import { AuthDomainService } from "../../domain/services/AuthDomainService.js";
import type { IEventPublisher } from "../ports/IEventPublisher.js";

export class DeactivateUserUseCase {
    constructor(
        private readonly authDomainService: AuthDomainService,
        private readonly eventPublisher: IEventPublisher
    ){}

    async execute(userId: string): Promise<void> {
        const user = await this.authDomainService.deactivateUser(userId);

        // publish audit event
        await this.eventPublisher.publish("audit.event", {
            userId: user.getId(),
            action: "DEACTIVATE",
            entityType: "AUTH",
            entityId: user.getId(),
            details: { email: user.getEmail().getValue() },
        });
    }
}
