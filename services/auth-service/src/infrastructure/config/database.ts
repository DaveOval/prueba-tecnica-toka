import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

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
        
        // Inicializar usuario admin si no existe
        await this.initializeAdminUser();
    }

    private static async initializeAdminUser(): Promise<void> {
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
                console.log('Admin user already exists');
                return;
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

            console.log(`Admin user created: ${adminEmail}`);
        } catch (error) {
            console.error('Error initializing admin user:', error);
            // No lanzar error para no bloquear el inicio de la aplicación
        }
    }

    static async close(): Promise<void> {
        if (this.client) {
            await this.client.$disconnect();
        }
    }
}