import mongoose from 'mongoose';
import logger from './logger.js';

export class Database {
    static async connect(): Promise<void> {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        try {
            await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            logger.info({ message: 'MongoDB connected' });
        } catch (error) {
            logger.error({ 
                message: 'MongoDB connection error',
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    static async disconnect(): Promise<void> {
        await mongoose.disconnect();
        logger.info({ message: 'MongoDB disconnected' });
    }
}
