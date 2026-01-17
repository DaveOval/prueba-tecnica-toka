import mongoose, { Schema } from 'mongoose';
import type { IAuditLogRepository } from '../../domain/repositories/IAuditLogRepository.js';
import { AuditLog } from '../../domain/entities/AuditLog.js';
import { Action } from '../../domain/value-objects/Action.js';
import { EntityType } from '../../domain/value-objects/EntityType.js';

interface AuditLogDocument extends mongoose.Document {
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

const AuditLogSchema = new Schema<AuditLogDocument>({
    _id: { type: String },
    userId: { type: String, required: false, index: true },
    action: { type: String, required: true, enum: Object.values(Action), index: true },
    entityType: { type: String, required: true, enum: Object.values(EntityType), index: true },
    entityId: { type: String, required: false, index: true },
    details: { type: Schema.Types.Mixed, required: false },
    ipAddress: { type: String, required: false },
    userAgent: { type: String, required: false },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
}, {
    _id: true,
    timestamps: true,
});

const AuditLogModel = mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);

export class MongoAuditLogRepository implements IAuditLogRepository {
    async save(auditLog: AuditLog): Promise<void> {
        try {
            const doc = new AuditLogModel({
                _id: auditLog.getId(),
                userId: auditLog.getUserId(),
                action: auditLog.getAction(),
                entityType: auditLog.getEntityType(),
                entityId: auditLog.getEntityId(),
                details: auditLog.getDetails(),
                ipAddress: auditLog.getIpAddress(),
                userAgent: auditLog.getUserAgent(),
                timestamp: auditLog.getTimestamp(),
            });

            await doc.save();
        } catch (error: any) {
            // Si el documento ya existe (duplicado), no es un error crítico para auditoría
            if (error.code === 11000) {
                console.warn(`Audit log with id ${auditLog.getId()} already exists`);
                return;
            }
            throw error;
        }
    }

    async findByUserId(userId: string, limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
        const docs = await AuditLogModel.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset)
            .exec();

        return docs.map(doc => this.toDomain(doc));
    }

    async findByEntityType(entityType: string, limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
        const docs = await AuditLogModel.find({ entityType })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset)
            .exec();

        return docs.map(doc => this.toDomain(doc));
    }

    async findByEntityId(entityId: string, limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
        const docs = await AuditLogModel.find({ entityId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset)
            .exec();

        return docs.map(doc => this.toDomain(doc));
    }

    async findAll(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
        const docs = await AuditLogModel.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset)
            .exec();

        return docs.map(doc => this.toDomain(doc));
    }

    async count(filters?: { userId?: string; entityType?: string; entityId?: string }): Promise<number> {
        const query: any = {};
        if (filters?.userId) query.userId = filters.userId;
        if (filters?.entityType) query.entityType = filters.entityType;
        if (filters?.entityId) query.entityId = filters.entityId;

        return AuditLogModel.countDocuments(query).exec();
    }

    private toDomain(doc: AuditLogDocument): AuditLog {
        const id = typeof doc._id === 'string' ? doc._id : doc._id.toString();
        return AuditLog.create(
            id,
            doc.userId,
            doc.action as Action,
            doc.entityType as EntityType,
            doc.entityId,
            doc.details,
            doc.ipAddress,
            doc.userAgent,
            doc.timestamp,
        );
    }
}
