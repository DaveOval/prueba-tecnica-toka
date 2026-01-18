import type { Request, Response } from 'express';
import { CreateAuditLogUseCase } from '../../application/use-cases/CreateAuditLogUseCase.js';
import { GetAuditLogsUseCase } from '../../application/use-cases/GetAuditLogsUseCase.js';
import type { CreateAuditLogDTO } from '../../application/dto/CreateAuditLogDTO.js';
import type { GetAuditLogsQueryDTO } from '../../application/dto/GetAuditLogsDTO.js';
import { AppError } from '../middlewares/errorHandler.js';

export class AuditController {
    constructor(
        private readonly createAuditLogUseCase: CreateAuditLogUseCase,
        private readonly getAuditLogsUseCase: GetAuditLogsUseCase
    ) {}

    async create(req: Request, res: Response, next: any): Promise<void> {
        try {
            const dto: CreateAuditLogDTO = {
                userId: req.body.userId ?? null,
                action: req.body.action,
                entityType: req.body.entityType,
                entityId: req.body.entityId ?? null,
                details: req.body.details ?? null,
                ipAddress: req.ip || req.headers['x-forwarded-for'] as string || null,
                userAgent: req.headers['user-agent'] || null,
            };

            const result = await this.createAuditLogUseCase.execute(dto);
            res.status(201).json(result);
        } catch (error) {
            if (error instanceof Error) {
                next(new AppError(400, error.message));
                return;
            }
            next(new AppError(500, 'Failed to create audit log'));
        }
    }

    async getAll(req: Request, res: Response, next: any): Promise<void> {
        try {
            const query: GetAuditLogsQueryDTO = {};
            
            if (req.query.userId) {
                query.userId = req.query.userId as string;
            }
            if (req.query.entityType) {
                query.entityType = req.query.entityType as string;
            }
            if (req.query.entityId) {
                query.entityId = req.query.entityId as string;
            }
            if (req.query.action) {
                query.action = req.query.action as string;
            }
            if (req.query.limit) {
                query.limit = parseInt(req.query.limit as string, 10);
            }
            if (req.query.offset) {
                query.offset = parseInt(req.query.offset as string, 10);
            }

            const result = await this.getAuditLogsUseCase.execute(query);
            res.status(200).json(result);
        } catch (error) {
            if (error instanceof Error) {
                next(new AppError(400, error.message));
                return;
            }
            next(new AppError(500, 'Failed to get audit logs'));
        }
    }
}
