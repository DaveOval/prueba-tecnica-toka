import type { AuditLogResponseDTO } from './CreateAuditLogDTO.js';

export interface GetAuditLogsQueryDTO {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    limit?: number;
    offset?: number;
}

export interface GetAuditLogsResponseDTO {
    logs: AuditLogResponseDTO[];
    total: number;
    limit: number;
    offset: number;
}
