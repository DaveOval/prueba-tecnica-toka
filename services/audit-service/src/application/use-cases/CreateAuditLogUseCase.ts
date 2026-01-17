import { randomUUID } from 'crypto';
import type { CreateAuditLogDTO, AuditLogResponseDTO } from '../dto/CreateAuditLogDTO.js';
import type { IAuditLogRepository } from '../../domain/repositories/IAuditLogRepository.js';
import { AuditLog } from '../../domain/entities/AuditLog.js';

export class CreateAuditLogUseCase {
    constructor(
        private readonly auditLogRepository: IAuditLogRepository
    ) {}

    async execute(dto: CreateAuditLogDTO): Promise<AuditLogResponseDTO> {
        const auditLog = AuditLog.create(
            randomUUID(),
            dto.userId ?? null,
            dto.action,
            dto.entityType,
            dto.entityId ?? null,
            dto.details ?? null,
            dto.ipAddress ?? null,
            dto.userAgent ?? null,
        );

        await this.auditLogRepository.save(auditLog);

        return {
            id: auditLog.getId(),
            userId: auditLog.getUserId(),
            action: auditLog.getAction(),
            entityType: auditLog.getEntityType(),
            entityId: auditLog.getEntityId(),
            details: auditLog.getDetails(),
            ipAddress: auditLog.getIpAddress(),
            userAgent: auditLog.getUserAgent(),
            timestamp: auditLog.getTimestamp(),
        };
    }
}
