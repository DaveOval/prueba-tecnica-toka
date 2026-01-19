import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import logger from './logger.js';

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

    static async initialize(): Promise<{ adminId: string; adminEmail: string } | null> {
        const client = this.getClient();
        await client.$connect();
        
        // Inicializar usuario admin si no existe y retornar info si se creó
        return await this.initializeAdminUser();
    }

    private static async initializeAdminUser(): Promise<{ adminId: string; adminEmail: string } | null> {
        const client = this.getClient();
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        try {
            // Verificar si ya existe un admin
            const existingAdmin = await client.user.findFirst({
                where: {
                    role: 'admin',
                },
            });

            if (existingAdmin) {
                logger.info({ message: 'Admin user already exists' });
                return null;
            }

            // Crear usuario admin
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const adminId = crypto.randomUUID();

            await client.user.create({
                data: {
                    id: adminId,
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin',
                    active: true,
                },
            });

            logger.info({ 
                message: 'Admin user created',
                adminEmail 
            });
            return { adminId, adminEmail };
        } catch (error) {
            logger.error({ 
                message: 'Error initializing admin user',
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            // No lanzar error para no bloquear el inicio de la aplicación
            return null;
        }
    }

    static async close(): Promise<void> {
        if (this.client) {
            await this.client.$disconnect();
        }
    }
}