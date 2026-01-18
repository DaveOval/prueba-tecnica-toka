import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Database } from './infrastructure/config/database.js';
import { initializeKafka, closeKafka } from './infrastructure/config/kafka.js';
import { PostgresUserRepository } from './infrastructure/persistence/PostgresUserRepository.js';
import { JwtTokenService } from './infrastructure/service/JwtTokenService.js';
import { AuthDomainService } from './domain/services/AuthDomainService.js';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase.js';
import { LoginUseCase } from './application/use-cases/LoginUseCase.js';
import { ActivateUserUseCase } from './application/use-cases/ActivateUserUseCase.js';
import { GetAllUsersUseCase } from './application/use-cases/GetAllUsersUseCase.js';
import { AuthController } from './presentation/controllers/AuthController.js';
import { createAuthRoutes } from './presentation/routes/auth.routes.js';
import { errorHandler } from './presentation/middlewares/errorHandler.js';


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
        console.log('Database initialized');

        // Initialize Kafka (ya retorna el publisher conectado)
        const eventPublisher = await initializeKafka();
        console.log('Kafka initialized');

        // Initialize infrastructure services
        const userRepository = new PostgresUserRepository();
        const tokenService = new JwtTokenService();

        // Initialize domain services
        const authDomainService = new AuthDomainService(userRepository);

        // Create use cases
        const registerUserUseCase = new RegisterUserUseCase(authDomainService, eventPublisher);
        const loginUseCase = new LoginUseCase(authDomainService, tokenService, eventPublisher);
        const activateUserUseCase = new ActivateUserUseCase(authDomainService, eventPublisher);
        const getAllUsersUseCase = new GetAllUsersUseCase(userRepository);

        // Create controller
        const authController = new AuthController(registerUserUseCase, loginUseCase, activateUserUseCase, getAllUsersUseCase);

        // Create routes
        app.use("/api/auth", createAuthRoutes(authController));

        // Error handling middleware
        app.use(errorHandler);

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Auth service running on http://localhost:${PORT}`);
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
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await Database.close();
    await closeKafka();
    process.exit(0);
  });

  initializeApp();