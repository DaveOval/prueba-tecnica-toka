import type { AuditLog } from '../entities/AuditLog.js';

export interface IAuditLogRepository {
    save(auditLog: AuditLog): Promise<void>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<AuditLog[]>;
    findByEntityType(entityType: string, limit?: number, offset?: number): Promise<AuditLog[]>;
    findByEntityId(entityId: string, limit?: number, offset?: number): Promise<AuditLog[]>;
    findAll(limit?: number, offset?: number): Promise<AuditLog[]>;
    count(filters?: { userId?: string; entityType?: string; entityId?: string }): Promise<number>;
}
