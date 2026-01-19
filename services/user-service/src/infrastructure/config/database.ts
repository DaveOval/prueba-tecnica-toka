import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
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

    /**
     * Crea la base de datos si no existe
     */
    private static async ensureDatabaseExists(): Promise<void> {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        // Parsear la URL de conexión PostgreSQL
        // Formato: postgresql://user:password@host:port/database?params
        const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
        
        if (!match) {
            throw new Error('Invalid DATABASE_URL format');
        }

        const [, user, password, host, port, databaseName] = match;

        // Crear una conexión a la base de datos por defecto (postgres) para crear la base de datos
        const adminConnectionString = `postgresql://${user}:${password}@${host}:${port}/postgres`;
        const adminPool = new Pool({ connectionString: adminConnectionString });

        try {
            // Verificar si la base de datos existe
            const result = await adminPool.query(
                'SELECT 1 FROM pg_database WHERE datname = $1',
                [databaseName]
            );

            // Si no existe, crearla
            if (result.rows.length === 0) {
                logger.info({ 
                    message: 'Creating database',
                    databaseName 
                });
                await adminPool.query(`CREATE DATABASE "${databaseName}"`);
                logger.info({ 
                    message: 'Database created successfully',
                    databaseName 
                });
            } else {
                logger.info({ 
                    message: 'Database already exists',
                    databaseName 
                });
            }
        } catch (error) {
            logger.error({ 
                message: 'Error ensuring database exists',
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        } finally {
            await adminPool.end();
        }
    }

    static async initialize(): Promise<void> {
        // Asegurar que la base de datos existe antes de conectarse
        await this.ensureDatabaseExists();
        
        const client = this.getClient();
        await client.$connect();
    }

    static async close(): Promise<void> {
        if (this.client) {
            await this.client.$disconnect();
        }
    }
}
