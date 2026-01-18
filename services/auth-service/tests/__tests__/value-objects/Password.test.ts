import { Password } from '../../../src/domain/value-objects/Password.js';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Password', () => {
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a password with valid length', async () => {
      const mockHash = '$2b$10$hashedpassword';
      mockBcrypt.hash.mockResolvedValue(mockHash as never);

      const password = await Password.create('password123');
      
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(password.getHashedValue()).toBe(mockHash);
    });

    it('should throw error for password shorter than 8 characters', async () => {
      await expect(Password.create('short')).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
    });

    it('should accept password with exactly 8 characters', async () => {
      const mockHash = '$2b$10$hashedpassword';
      mockBcrypt.hash.mockResolvedValue(mockHash as never);

      const password = await Password.create('12345678');
      expect(password.getHashedValue()).toBe(mockHash);
    });
  });

  describe('fromHash', () => {
    it('should create password from hash', () => {
      const hash = '$2b$10$hashedpassword';
      const password = Password.fromHash(hash);
      
      expect(password.getHashedValue()).toBe(hash);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const hash = '$2b$10$hashedpassword';
      const password = Password.fromHash(hash);
      
      mockBcrypt.compare.mockResolvedValue(true as never);
      
      const result = await password.compare('plainpassword');
      
      expect(mockBcrypt.compare).toHaveBeenCalledWith('plainpassword', hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const hash = '$2b$10$hashedpassword';
      const password = Password.fromHash(hash);
      
      mockBcrypt.compare.mockResolvedValue(false as never);
      
      const result = await password.compare('wrongpassword');
      
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });

  describe('getHashedValue', () => {
    it('should return the hashed value', () => {
      const hash = '$2b$10$hashedpassword';
      const password = Password.fromHash(hash);
      
      expect(password.getHashedValue()).toBe(hash);
    });
  });
});
