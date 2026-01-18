import { DeleteUserUseCase } from '../../../src/application/use-cases/DeleteUserUseCase.js';
import { AuthDomainService } from '../../../src/domain/services/AuthDomainService.js';
import { User, UserRole } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { Password } from '../../../src/domain/value-objects/Password.js';
import type { IEventPublisher } from '../../../src/application/ports/IEventPublisher.js';
import type { IUserRepository } from '../../../src/domain/repositories/IUserRepository.js';

describe('DeleteUserUseCase', () => {
  let deleteUserUseCase: DeleteUserUseCase;
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
    jest.spyOn(mockAuthDomainService, 'deleteUser');

    mockEventPublisher = {
      publish: jest.fn(),
    } as any;

    deleteUserUseCase = new DeleteUserUseCase(
      mockAuthDomainService,
      mockUserRepository,
      mockEventPublisher
    );
  });

  it('should delete a user successfully', async () => {
    const email = Email.create('test@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const user = User.create('user-123', email, password, UserRole.USER, true);
    
    mockUserRepository.findById.mockResolvedValue(user);
    jest.spyOn(mockAuthDomainService, 'deleteUser').mockResolvedValue();

    await deleteUserUseCase.execute('user-123');

    expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
    expect(mockAuthDomainService.deleteUser).toHaveBeenCalledWith('user-123');
    expect(mockEventPublisher.publish).toHaveBeenCalledWith('audit.event', {
      userId: 'user-123',
      action: 'DELETE',
      entityType: 'AUTH',
      entityId: 'user-123',
    });
  });

  it('should throw error if user not found', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(deleteUserUseCase.execute('non-existent')).rejects.toThrow('User not found');
    expect(mockAuthDomainService.deleteUser).not.toHaveBeenCalled();
  });

  it('should throw error if trying to delete admin user', async () => {
    const email = Email.create('admin@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const adminUser = User.create('admin-123', email, password, UserRole.ADMIN, true);
    
    mockUserRepository.findById.mockResolvedValue(adminUser);

    await expect(deleteUserUseCase.execute('admin-123')).rejects.toThrow(
      'Cannot delete admin users'
    );
    expect(mockAuthDomainService.deleteUser).not.toHaveBeenCalled();
  });
});
