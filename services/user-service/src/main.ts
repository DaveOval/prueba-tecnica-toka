import 'dotenv/config';
import express from 'express';
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

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => res.json({ message: 'OK' }));

// Initialize dependencies
async function initializeApp() {
    try {
        // Initialize database
        await Database.initialize();
        console.log('Database initialized');

        // Initialize Redis
        getRedisClient();
        console.log('Redis initialized');

        // Initialize Kafka consumer
        const eventConsumer = await initializeKafka();
        console.log('Kafka consumer initialized');

        // Initialize Kafka publisher
        const eventPublisher = await initializeKafkaPublisher();
        console.log('Kafka publisher initialized');

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
                console.log("Received user.registered event:", message);
                const { userId, email } = message;
                
                if (userId && email) {
                    await createUserProfileUseCase.execute({
                        id: userId,
                        email: email,
                    });
                    console.log(`Created user profile for user: ${userId}`);
                }
            } catch (error) {
                console.error("Error processing user.registered event:", error);
            }
        });

        // Error handling middleware
        app.use(errorHandler);

        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`User service running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await Database.close();
    await closeKafka();
    await closeRedis();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await Database.close();
    await closeKafka();
    await closeRedis();
    process.exit(0);
});

initializeApp();
