import type { GetAuditLogsQueryDTO, GetAuditLogsResponseDTO } from '../dto/GetAuditLogsDTO.js';
import type { IAuditLogRepository } from '../../domain/repositories/IAuditLogRepository.js';

export class GetAuditLogsUseCase {
    constructor(
        private readonly auditLogRepository: IAuditLogRepository
    ) {}

    async execute(query: GetAuditLogsQueryDTO): Promise<GetAuditLogsResponseDTO> {
        const limit = Math.min(query.limit ?? 100, 1000);
        const offset = query.offset ?? 0;

        const filters: { userId?: string; entityType?: string; entityId?: string; action?: string } = {};
        if (query.userId) filters.userId = query.userId;
        if (query.entityType) filters.entityType = query.entityType;
        if (query.entityId) filters.entityId = query.entityId;
        if (query.action) filters.action = query.action;

        const logs = await this.auditLogRepository.findWithFilters(filters, limit, offset);

        const total = await this.auditLogRepository.count(filters);

        return {
            logs: logs.map(log => ({
                id: log.getId(),
                userId: log.getUserId(),
                action: log.getAction(),
                entityType: log.getEntityType(),
                entityId: log.getEntityId(),
                details: log.getDetails(),
                ipAddress: log.getIpAddress(),
                userAgent: log.getUserAgent(),
                timestamp: log.getTimestamp(),
            })),
            total,
            limit,
            offset,
        };
    }
}
