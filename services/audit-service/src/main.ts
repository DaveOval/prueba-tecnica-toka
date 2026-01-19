import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Database } from './infrastructure/config/database.js';
import { initializeKafka, closeKafka } from './infrastructure/config/kafka.js';
import { MongoAuditLogRepository } from './infrastructure/persistence/MongoAuditLogRepository.js';
import { CreateAuditLogUseCase } from './application/use-cases/CreateAuditLogUseCase.js';
import { GetAuditLogsUseCase } from './application/use-cases/GetAuditLogsUseCase.js';
import { AuditController } from './presentation/controllers/AuditController.js';
import { createAuditRoutes } from './presentation/routes/audit.routes.js';
import { errorHandler } from './presentation/middlewares/errorHandler.js';
import { Action } from './domain/value-objects/Action.js';
import { EntityType } from './domain/value-objects/EntityType.js';
import logger from './infrastructure/config/logger.js';

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => res.json({ message: 'OK' }));

// Initialize dependencies
async function initializeApp() {
    try {
        // Initialize MongoDB
        await Database.connect();
        logger.info({ message: 'MongoDB initialized' });

        // Initialize Kafka consumer
        const eventConsumer = await initializeKafka();
        logger.info({ message: 'Kafka consumer initialized' });

        // Initialize infrastructure services
        const auditLogRepository = new MongoAuditLogRepository();

        // Create use cases
        const createAuditLogUseCase = new CreateAuditLogUseCase(auditLogRepository);
        const getAuditLogsUseCase = new GetAuditLogsUseCase(auditLogRepository);

        // Create controller
        const auditController = new AuditController(
            createAuditLogUseCase,
            getAuditLogsUseCase
        );

        // Create routes
        app.use("/api/audit", createAuditRoutes(auditController));

        // Subscribe to audit events from other services
        await eventConsumer.subscribe("audit.event", async (message) => {
            try {
                logger.info({ 
                    message: 'Received audit event',
                    event: message 
                });
                const { userId, action, entityType, entityId, details, ipAddress, userAgent } = message;
                
                if (action && entityType) {
                    // Validar que action y entityType sean valores válidos
                    if (!Object.values(Action).includes(action as Action)) {
                        logger.error({ 
                            message: 'Invalid action',
                            action 
                        });
                        return;
                    }
                    if (!Object.values(EntityType).includes(entityType as EntityType)) {
                        logger.error({ 
                            message: 'Invalid entityType',
                            entityType 
                        });
                        return;
                    }
                    
                    await createAuditLogUseCase.execute({
                        userId: userId ?? null,
                        action: action as Action,
                        entityType: entityType as EntityType,
                        entityId: entityId ?? null,
                        details: details ?? null,
                        ipAddress: ipAddress ?? null,
                        userAgent: userAgent ?? null,
                    });
                    logger.info({ 
                        message: 'Audit log created',
                        action,
                        entityType 
                    });
                } else {
                    logger.error({ 
                        message: 'Missing required fields: action and entityType',
                        event: message 
                    });
                }
            } catch (error) {
                logger.error({ 
                    message: 'Error processing audit event',
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
            }
        });

        // Error handling middleware
        app.use(errorHandler);

        const PORT = process.env.PORT || 3002;
        app.listen(PORT, () => {
            logger.info({ 
                message: 'Audit service started',
                port: PORT 
            });
        });
    } catch (error) {
        logger.error({ 
            message: 'Failed to initialize application',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    logger.info({ message: 'SIGTERM received, shutting down gracefully' });
    await Database.disconnect();
    await closeKafka();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info({ message: 'SIGINT received, shutting down gracefully' });
    await Database.disconnect();
    await closeKafka();
    process.exit(0);
});

initializeApp();
