import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export class Database {
    private static client: PrismaClient;

    static getClient(): PrismaClient {
        if (!this.client) {
            const connectionString = process.env.DATABASE_URL;
            if (!connectionString) {
                throw new Error('DATABASE_URL environment variable is not set');
            }

            const pool = new Pool({ connectionString });
            const adapter = new PrismaPg(pool);

            this.client = new PrismaClient({
                adapter,
                log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
            });
        }

        return this.client;
    }

    static async initialize(): Promise<void> {
        const client = this.getClient();
        await client.$connect();
    }

    static async close(): Promise<void> {
        if (this.client) {
            await this.client.$disconnect();
        }
    }
}