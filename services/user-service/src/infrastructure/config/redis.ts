import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redisClient) {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);

        redisClient = new Redis({
            host,
            port,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        redisClient.on('connect', () => {
            console.log('Redis connected');
        });

        redisClient.on('error', (error) => {
            console.error('Redis error:', error);
        });
    }

    return redisClient;
}

export async function closeRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}
