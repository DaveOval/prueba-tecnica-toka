import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Database } from './infrastructure/config/database.js';
import { initializeKafka, initializeKafkaPublisher, closeKafka } from './infrastructure/config/kafka.js';
import { getRedisClient, closeRedis } from './infrastructure/config/redis.js';
import { PostgresUserProfileRepository } from './infrastructure/persistence/PostgresUserProfileRepository.js';
import { RedisCacheService } from './infrastructure/cache/RedisCacheService.js';
import { UserDomainService } from './domain/services/UserDomainService.js';
import { CreateUserProfileUseCase } from './application/use-cases/CreateUserProfileUseCase.js';
import { GetUserProfileUseCase } from './application/use-cases/GetUserProfileUseCase.js';
import { UpdateUserProfileUseCase } from './application/use-cases/UpdateUserProfileUseCase.js';
import { GetAllUsersUseCase } from './application/use-cases/GetAllUsersUseCase.js';
import { DeleteUserProfileUseCase } from './application/use-cases/DeleteUserProfileUseCase.js';
import { UserController } from './presentation/controllers/UserController.js';
import { createUserRoutes } from './presentation/routes/user.routes.js';
import { errorHandler } from './presentation/middlewares/errorHandler.js';
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
        // Initialize database
        await Database.initialize();
        logger.info({ message: 'Database initialized' });

        // Initialize Redis
        getRedisClient();
        logger.info({ message: 'Redis initialized' });

        // Initialize Kafka consumer
        const eventConsumer = await initializeKafka();
        logger.info({ message: 'Kafka consumer initialized' });

        // Initialize Kafka publisher
        const eventPublisher = await initializeKafkaPublisher();
        logger.info({ message: 'Kafka publisher initialized' });

        // Initialize infrastructure services
        const userProfileRepository = new PostgresUserProfileRepository();
        const cacheService = new RedisCacheService();

        // Initialize domain services
        const userDomainService = new UserDomainService(userProfileRepository);

        // Create use cases
        const createUserProfileUseCase = new CreateUserProfileUseCase(userDomainService, cacheService, eventPublisher);
        const getUserProfileUseCase = new GetUserProfileUseCase(userDomainService, cacheService);
        const updateUserProfileUseCase = new UpdateUserProfileUseCase(userDomainService, cacheService, eventPublisher);
        const getAllUsersUseCase = new GetAllUsersUseCase(userDomainService);
        const deleteUserProfileUseCase = new DeleteUserProfileUseCase(userDomainService, cacheService, eventPublisher);

        // Create controller
        const userController = new UserController(
            createUserProfileUseCase,
            getUserProfileUseCase,
            updateUserProfileUseCase,
            getAllUsersUseCase,
            deleteUserProfileUseCase
        );

        // Create routes
        app.use("/api/users", createUserRoutes(userController));

        // Subscribe to user.registered events from auth-service
        await eventConsumer.subscribe("user.registered", async (message) => {
            try {
                logger.info({ 
                    message: 'Received user.registered event',
                    event: message 
                });
                const { userId, email } = message;
                
                if (userId && email) {
                    await createUserProfileUseCase.execute({
                        id: userId,
                        email: email,
                    });
                    logger.info({ 
                        message: 'Created user profile',
                        userId 
                    });
                }
            } catch (error) {
                logger.error({ 
                    message: 'Error processing user.registered event',
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
            }
        });

        // Error handling middleware
        app.use(errorHandler);

        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            logger.info({ 
                message: 'User service started',
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
    await Database.close();
    await closeKafka();
    await closeRedis();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info({ message: 'SIGINT received, shutting down gracefully' });
    await Database.close();
    await closeKafka();
    await closeRedis();
    process.exit(0);
});

initializeApp();
