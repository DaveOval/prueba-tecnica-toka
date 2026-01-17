import { Action, ActionVO } from '../value-objects/Action.js';
import { EntityType, EntityTypeVO } from '../value-objects/EntityType.js';

export class AuditLog {
    private constructor(
        private readonly id: string,
        private readonly userId: string | null,
        private readonly action: ActionVO,
        private readonly entityType: EntityTypeVO,
        private readonly entityId: string | null,
        private readonly details: Record<string, any> | null,
        private readonly ipAddress: string | null,
        private readonly userAgent: string | null,
        private readonly timestamp: Date,
    ) {}

    static create(
        id: string,
        userId: string | null,
        action: Action,
        entityType: EntityType,
        entityId: string | null,
        details: Record<string, any> | null = null,
        ipAddress: string | null = null,
        userAgent: string | null = null,
        timestamp: Date = new Date(),
    ): AuditLog {
        return new AuditLog(
            id,
            userId,
            ActionVO.create(action),
            EntityTypeVO.create(entityType),
            entityId,
            details,
            ipAddress,
            userAgent,
            timestamp,
        );
    }

    getId(): string {
        return this.id;
    }

    getUserId(): string | null {
        return this.userId;
    }

    getAction(): Action {
        return this.action.getValue();
    }

    getEntityType(): EntityType {
        return this.entityType.getValue();
    }

    getEntityId(): string | null {
        return this.entityId;
    }

    getDetails(): Record<string, any> | null {
        return this.details;
    }

    getIpAddress(): string | null {
        return this.ipAddress;
    }

    getUserAgent(): string | null {
        return this.userAgent;
    }

    getTimestamp(): Date {
        return this.timestamp;
    }
}
