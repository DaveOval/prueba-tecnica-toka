import { User, UserRole } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { Password } from '../../../src/domain/value-objects/Password.js';

jest.mock('bcrypt');

describe('User', () => {
  let mockEmail: Email;
  let mockPassword: Password;

  beforeEach(async () => {
    mockEmail = Email.create('test@example.com');
    mockPassword = Password.fromHash('$2b$10$hashedpassword');
  });

  describe('create', () => {
    it('should create a user with default role USER and inactive', () => {
      const userId = 'user-123';
      const user = User.create(userId, mockEmail, mockPassword);

      expect(user.getId()).toBe(userId);
      expect(user.getEmail().getValue()).toBe('test@example.com');
      expect(user.getRole()).toBe(UserRole.USER);
      expect(user.isActive()).toBe(false);
      expect(user.isAdmin()).toBe(false);
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create an admin user as active by default', () => {
      const userId = 'admin-123';
      const user = User.create(userId, mockEmail, mockPassword, UserRole.ADMIN);

      expect(user.getRole()).toBe(UserRole.ADMIN);
      expect(user.isActive()).toBe(true);
      expect(user.isAdmin()).toBe(true);
    });

    it('should create a user with custom active status', () => {
      const userId = 'user-123';
      const user = User.create(userId, mockEmail, mockPassword, UserRole.USER, true);

      expect(user.isActive()).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a user from database data', () => {
      const userId = 'user-123';
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const user = User.reconstitute(
        userId,
        'test@example.com',
        '$2b$10$hashedpassword',
        'user',
        true,
        createdAt,
        updatedAt
      );

      expect(user.getId()).toBe(userId);
      expect(user.getEmail().getValue()).toBe('test@example.com');
      expect(user.getRole()).toBe(UserRole.USER);
      expect(user.isActive()).toBe(true);
      expect(user.getCreatedAt()).toEqual(createdAt);
      expect(user.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should reconstitute an admin user', () => {
      const user = User.reconstitute(
        'admin-123',
        'admin@example.com',
        '$2b$10$hashedpassword',
        'admin',
        true,
        new Date(),
        new Date()
      );

      expect(user.getRole()).toBe(UserRole.ADMIN);
      expect(user.isAdmin()).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const user = User.create('user-123', mockEmail, mockPassword);
      const newPassword = Password.fromHash('$2b$10$newhashedpassword');

      await user.changePassword(newPassword);

      expect(user.getPassword().getHashedValue()).toBe('$2b$10$newhashedpassword');
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('activate', () => {
    it('should activate an inactive user', () => {
      const user = User.create('user-123', mockEmail, mockPassword, UserRole.USER, false);
      
      expect(user.isActive()).toBe(false);
      
      user.activate();
      
      expect(user.isActive()).toBe(true);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active user', () => {
      const user = User.create('user-123', mockEmail, mockPassword, UserRole.USER, true);
      
      expect(user.isActive()).toBe(true);
      
      user.deactivate();
      
      expect(user.isActive()).toBe(false);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('getters', () => {
    it('should return correct values from getters', () => {
      const userId = 'user-123';
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const user = User.reconstitute(
        userId,
        'test@example.com',
        '$2b$10$hashedpassword',
        'user',
        true,
        createdAt,
        updatedAt
      );

      expect(user.getId()).toBe(userId);
      expect(user.getEmail()).toBeInstanceOf(Email);
      expect(user.getPassword()).toBeInstanceOf(Password);
      expect(user.getRole()).toBe(UserRole.USER);
      expect(user.getCreatedAt()).toEqual(createdAt);
      expect(user.getUpdatedAt()).toEqual(updatedAt);
    });
  });
});
