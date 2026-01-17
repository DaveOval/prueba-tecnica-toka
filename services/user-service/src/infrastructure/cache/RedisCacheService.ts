import type { ICacheService } from '../../application/ports/ICacheService.js';
import { getRedisClient } from '../config/redis.js';

export class RedisCacheService implements ICacheService {
    private client = getRedisClient();
    private defaultTTL = 3600; // 1 hora por defecto

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            if (!value) {
                return null;
            }
            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`Error getting cache key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            const ttl = ttlSeconds ?? this.defaultTTL;
            await this.client.setex(key, ttl, serialized);
        } catch (error) {
            console.error(`Error setting cache key ${key}:`, error);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`Error deleting cache key ${key}:`, error);
        }
    }

    async deletePattern(pattern: string): Promise<void> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error) {
            console.error(`Error deleting cache pattern ${pattern}:`, error);
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Error checking cache key ${key}:`, error);
            return false;
        }
    }

    async clear(): Promise<void> {
        try {
            await this.client.flushdb();
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}
