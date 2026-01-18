import { ChangeUserRoleUseCase } from '../../../src/application/use-cases/ChangeUserRoleUseCase.js';
import { AuthDomainService } from '../../../src/domain/services/AuthDomainService.js';
import { User, UserRole } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { Password } from '../../../src/domain/value-objects/Password.js';
import type { IEventPublisher } from '../../../src/application/ports/IEventPublisher.js';
import type { IUserRepository } from '../../../src/domain/repositories/IUserRepository.js';

describe('ChangeUserRoleUseCase', () => {
  let changeUserRoleUseCase: ChangeUserRoleUseCase;
  let mockAuthDomainService: jest.Mocked<AuthDomainService>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
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

    mockAuthDomainService = new AuthDomainService(mockUserRepository) as jest.Mocked<AuthDomainService>;
    jest.spyOn(mockAuthDomainService, 'changeUserRole');

    mockEventPublisher = {
      publish: jest.fn(),
    } as any;

    changeUserRoleUseCase = new ChangeUserRoleUseCase(
      mockAuthDomainService,
      mockUserRepository,
      mockEventPublisher
    );
  });

  it('should change user role to admin', async () => {
    const email = Email.create('test@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const user = User.create('user-123', email, password, UserRole.USER, true);
    const updatedUser = User.create('user-123', email, password, UserRole.ADMIN, true);
    
    mockUserRepository.findById.mockResolvedValue(user);
    jest.spyOn(mockAuthDomainService, 'changeUserRole').mockResolvedValue(updatedUser);

    await changeUserRoleUseCase.execute('user-123', 'admin');

    expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
    expect(mockAuthDomainService.changeUserRole).toHaveBeenCalledWith('user-123', UserRole.ADMIN);
    expect(mockEventPublisher.publish).toHaveBeenCalledWith('audit.event', {
      userId: 'user-123',
      action: 'UPDATE',
      entityType: 'AUTH',
      entityId: 'user-123',
      details: {
        email: 'test@example.com',
        newRole: 'admin',
      },
    });
  });

  it('should change user role to admin (from user)', async () => {
    const email = Email.create('test@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const user = User.create('user-123', email, password, UserRole.USER, true);
    const updatedUser = User.create('user-123', email, password, UserRole.ADMIN, true);
    
    mockUserRepository.findById.mockResolvedValue(user);
    jest.spyOn(mockAuthDomainService, 'changeUserRole').mockResolvedValue(updatedUser);

    await changeUserRoleUseCase.execute('user-123', 'admin');

    expect(mockAuthDomainService.changeUserRole).toHaveBeenCalledWith('user-123', UserRole.ADMIN);
  });

  it('should throw error if user not found', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(changeUserRoleUseCase.execute('non-existent', 'admin')).rejects.toThrow(
      'User not found'
    );
    expect(mockAuthDomainService.changeUserRole).not.toHaveBeenCalled();
  });

  it('should throw error if trying to remove admin role from admin', async () => {
    const email = Email.create('admin@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const adminUser = User.create('admin-123', email, password, UserRole.ADMIN, true);
    
    mockUserRepository.findById.mockResolvedValue(adminUser);

    await expect(changeUserRoleUseCase.execute('admin-123', 'user')).rejects.toThrow(
      'Cannot remove admin role from admin users'
    );
    expect(mockAuthDomainService.changeUserRole).not.toHaveBeenCalled();
  });
});
