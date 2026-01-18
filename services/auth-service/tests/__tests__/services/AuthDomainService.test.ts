import { AuthDomainService } from '../../../src/domain/services/AuthDomainService.js';
import { User, UserRole } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { Password } from '../../../src/domain/value-objects/Password.js';
import type { IUserRepository } from '../../../src/domain/repositories/IUserRepository.js';

describe('AuthDomainService', () => {
  let authDomainService: AuthDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      existByEmail: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    authDomainService = new AuthDomainService(mockUserRepository);
  });

  describe('registerUser', () => {
    it('should register a new user', async () => {
      const email = Email.create('newuser@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const user = await authDomainService.registerUser(email, password, UserRole.USER, false);

      expect(user.getEmail().getValue()).toBe('newuser@example.com');
      expect(user.getRole()).toBe(UserRole.USER);
      expect(user.isActive()).toBe(false);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const email = Email.create('existing@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      
      const existingUser = User.create('user-123', email, password);
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        authDomainService.registerUser(email, password, UserRole.USER, false)
      ).rejects.toThrow('User with this email already exists');

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('activateUser', () => {
    it('should activate a user', async () => {
      const userId = 'user-123';
      const email = Email.create('test@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      const user = User.create(userId, email, password, UserRole.USER, false);
      
      mockUserRepository.findById.mockResolvedValue(user);

      const activatedUser = await authDomainService.activateUser(userId);

      expect(activatedUser.isActive()).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        authDomainService.activateUser('non-existent')
      ).rejects.toThrow('User not found');

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const userId = 'user-123';
      const email = Email.create('test@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      const user = User.create(userId, email, password, UserRole.USER, true);
      
      mockUserRepository.findById.mockResolvedValue(user);

      const deactivatedUser = await authDomainService.deactivateUser(userId);

      expect(deactivatedUser.isActive()).toBe(false);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        authDomainService.deactivateUser('non-existent')
      ).rejects.toThrow('User not found');
    });
  });

  describe('changeUserRole', () => {
    it('should change user role to admin', async () => {
      const userId = 'user-123';
      const email = Email.create('test@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      const user = User.create(userId, email, password, UserRole.USER, true);
      
      mockUserRepository.findById.mockResolvedValue(user);

      const updatedUser = await authDomainService.changeUserRole(userId, UserRole.ADMIN);

      expect(updatedUser.getRole()).toBe(UserRole.ADMIN);
      expect(updatedUser.isAdmin()).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should change user role to user', async () => {
      const userId = 'admin-123';
      const email = Email.create('admin@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      const user = User.create(userId, email, password, UserRole.ADMIN, true);
      
      mockUserRepository.findById.mockResolvedValue(user);

      const updatedUser = await authDomainService.changeUserRole(userId, UserRole.USER);

      expect(updatedUser.getRole()).toBe(UserRole.USER);
      expect(updatedUser.isAdmin()).toBe(false);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        authDomainService.changeUserRole('non-existent', UserRole.ADMIN)
      ).rejects.toThrow('User not found');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      const email = Email.create('test@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      const user = User.create('user-123', email, password, UserRole.USER, true);
      
      mockUserRepository.findByEmail.mockResolvedValue(user);
      
      const mockPassword = user.getPassword();
      jest.spyOn(mockPassword, 'compare').mockResolvedValue(true);

      const authenticatedUser = await authDomainService.authenticateUser(email, 'password123');

      expect(authenticatedUser.getId()).toBe('user-123');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw error for invalid email', async () => {
      const email = Email.create('nonexistent@example.com');
      
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authDomainService.authenticateUser(email, 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const email = Email.create('test@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      const user = User.create('user-123', email, password, UserRole.USER, true);
      
      mockUserRepository.findByEmail.mockResolvedValue(user);
      
      const mockPassword = user.getPassword();
      jest.spyOn(mockPassword, 'compare').mockResolvedValue(false);

      await expect(
        authDomainService.authenticateUser(email, 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      const email = Email.create('test@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      const user = User.create('user-123', email, password, UserRole.USER, false);
      
      mockUserRepository.findByEmail.mockResolvedValue(user);
      
      const mockPassword = user.getPassword();
      jest.spyOn(mockPassword, 'compare').mockResolvedValue(true);

      await expect(
        authDomainService.authenticateUser(email, 'password123')
      ).rejects.toThrow('User account is not active');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userId = 'user-123';
      const email = Email.create('test@example.com');
      const password = Password.fromHash('$2b$10$hashedpassword');
      const user = User.create(userId, email, password);
      
      mockUserRepository.findById.mockResolvedValue(user);

      await authDomainService.deleteUser(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        authDomainService.deleteUser('non-existent')
      ).rejects.toThrow('User not found');

      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
  });
});
