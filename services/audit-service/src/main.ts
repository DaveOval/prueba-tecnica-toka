import 'dotenv/config';
import express from 'express';
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

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => res.json({ message: 'OK' }));

// Initialize dependencies
async function initializeApp() {
    try {
        // Initialize MongoDB
        await Database.connect();
        console.log('MongoDB initialized');

        // Initialize Kafka consumer
        const eventConsumer = await initializeKafka();
        console.log('Kafka consumer initialized');

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
                console.log("Received audit event:", message);
                const { userId, action, entityType, entityId, details, ipAddress, userAgent } = message;
                
                if (action && entityType) {
                    // Validar que action y entityType sean valores válidos
                    if (!Object.values(Action).includes(action as Action)) {
                        console.error(`Invalid action: ${action}`);
                        return;
                    }
                    if (!Object.values(EntityType).includes(entityType as EntityType)) {
                        console.error(`Invalid entityType: ${entityType}`);
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
                    console.log(`Audit log created: ${action} on ${entityType}`);
                } else {
                    console.error("Missing required fields: action and entityType");
                }
            } catch (error) {
                console.error("Error processing audit event:", error);
            }
        });

        // Error handling middleware
        app.use(errorHandler);

        const PORT = process.env.PORT || 3002;
        app.listen(PORT, () => {
            console.log(`Audit service running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await Database.disconnect();
    await closeKafka();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await Database.disconnect();
    await closeKafka();
    process.exit(0);
});

initializeApp();
