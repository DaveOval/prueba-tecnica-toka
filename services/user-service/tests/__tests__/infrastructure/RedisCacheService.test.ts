import { RedisCacheService } from '../../../src/infrastructure/cache/RedisCacheService.js';

const mockRedisClient = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  exists: jest.fn(),
  flushdb: jest.fn(),
};

jest.mock('../../../src/infrastructure/config/redis.js', () => ({
  getRedisClient: jest.fn(() => mockRedisClient),
}));

describe('RedisCacheService', () => {
  let cacheService: RedisCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = new RedisCacheService();
  });

  describe('get', () => {
    it('should get a value from cache', async () => {
      const cachedValue = JSON.stringify({ id: 'user-123', name: 'John' });
      mockRedisClient.get.mockResolvedValue(cachedValue);

      const result = await cacheService.get<{ id: string; name: string }>('user:profile:user-123');

      expect(result).toEqual({ id: 'user-123', name: 'John' });
      expect(mockRedisClient.get).toHaveBeenCalledWith('user:profile:user-123');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get('user:profile:non-existent');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('user:profile:user-123');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set a value in cache with TTL', async () => {
      const value = { id: 'user-123', name: 'John' };
      
      await cacheService.set('user:profile:user-123', value, 1800);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'user:profile:user-123',
        1800,
        JSON.stringify(value)
      );
    });

    it('should use default TTL when not provided', async () => {
      const value = { id: 'user-123', name: 'John' };
      
      await cacheService.set('user:profile:user-123', value);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'user:profile:user-123',
        3600,
        JSON.stringify(value)
      );
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.setex.mockRejectedValue(new Error('Redis error'));

      await expect(
        cacheService.set('user:profile:user-123', { id: 'user-123' })
      ).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a key from cache', async () => {
      await cacheService.delete('user:profile:user-123');

      expect(mockRedisClient.del).toHaveBeenCalledWith('user:profile:user-123');
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      await expect(
        cacheService.delete('user:profile:user-123')
      ).resolves.not.toThrow();
    });
  });

  describe('deletePattern', () => {
    it('should delete keys matching pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['user:profile:1', 'user:profile:2']);

      await cacheService.deletePattern('user:profile:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('user:profile:*');
      expect(mockRedisClient.del).toHaveBeenCalled();
    });

    it('should handle empty pattern results', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      await cacheService.deletePattern('user:profile:*');

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      await expect(
        cacheService.deletePattern('user:profile:*')
      ).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await cacheService.exists('user:profile:user-123');

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalled();
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await cacheService.exists('user:profile:non-existent');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRedisClient.exists.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.exists('user:profile:user-123');

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache', async () => {
      mockRedisClient.flushdb.mockResolvedValue(undefined);
      
      await cacheService.clear();

      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.flushdb.mockRejectedValue(new Error('Redis error'));

      await expect(cacheService.clear()).resolves.not.toThrow();
    });
  });
});
