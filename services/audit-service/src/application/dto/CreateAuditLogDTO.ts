import { Action } from '../../domain/value-objects/Action.js';
import { EntityType } from '../../domain/value-objects/EntityType.js';

export interface CreateAuditLogDTO {
    userId?: string | null;
    action: Action;
    entityType: EntityType;
    entityId?: string | null;
    details?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export interface AuditLogResponseDTO {
    id: string;
    userId: string | null;
    action: Action;
    entityType: EntityType;
    entityId: string | null;
    details: Record<string, any> | null;
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: Date;
}
