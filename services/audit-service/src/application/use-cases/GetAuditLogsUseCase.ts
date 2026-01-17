import type { GetAuditLogsQueryDTO, GetAuditLogsResponseDTO } from '../dto/GetAuditLogsDTO.js';
import type { IAuditLogRepository } from '../../domain/repositories/IAuditLogRepository.js';

export class GetAuditLogsUseCase {
    constructor(
        private readonly auditLogRepository: IAuditLogRepository
    ) {}

    async execute(query: GetAuditLogsQueryDTO): Promise<GetAuditLogsResponseDTO> {
        const limit = Math.min(query.limit ?? 100, 1000);
        const offset = query.offset ?? 0;

        let logs;
        if (query.userId) {
            logs = await this.auditLogRepository.findByUserId(query.userId, limit, offset);
        } else if (query.entityType) {
            logs = await this.auditLogRepository.findByEntityType(query.entityType, limit, offset);
        } else if (query.entityId) {
            logs = await this.auditLogRepository.findByEntityId(query.entityId, limit, offset);
        } else {
            logs = await this.auditLogRepository.findAll(limit, offset);
        }

        const total = await this.auditLogRepository.count({
            userId: query.userId,
            entityType: query.entityType,
            entityId: query.entityId,
        });

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
