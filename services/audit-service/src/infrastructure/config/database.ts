import mongoose from 'mongoose';

export class Database {
    static async connect(): Promise<void> {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        try {
            await mongoose.connect(mongoUri);
            console.log('MongoDB connected');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    static async disconnect(): Promise<void> {
        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
}
