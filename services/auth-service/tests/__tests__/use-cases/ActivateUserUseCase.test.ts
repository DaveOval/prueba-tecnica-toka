import { ActivateUserUseCase } from '../../../src/application/use-cases/ActivateUserUseCase.js';
import { AuthDomainService } from '../../../src/domain/services/AuthDomainService.js';
import { User, UserRole } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { Password } from '../../../src/domain/value-objects/Password.js';
import type { IEventPublisher } from '../../../src/application/ports/IEventPublisher.js';
import type { IUserRepository } from '../../../src/domain/repositories/IUserRepository.js';

describe('ActivateUserUseCase', () => {
  let activateUserUseCase: ActivateUserUseCase;
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
    jest.spyOn(mockAuthDomainService, 'activateUser');

    mockEventPublisher = {
      publish: jest.fn(),
    } as any;

    activateUserUseCase = new ActivateUserUseCase(mockAuthDomainService, mockEventPublisher);
  });

  it('should activate a user successfully', async () => {
    const email = Email.create('test@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const user = User.create('user-123', email, password, UserRole.USER, false);
    
    mockUserRepository.findById.mockResolvedValue(user);
    jest.spyOn(mockAuthDomainService, 'activateUser').mockResolvedValue(user);

    await activateUserUseCase.execute('user-123');

    expect(mockAuthDomainService.activateUser).toHaveBeenCalledWith('user-123');
    expect(mockEventPublisher.publish).toHaveBeenCalledWith('audit.event', {
      userId: 'user-123',
      action: 'ACTIVATE',
      entityType: 'AUTH',
      entityId: 'user-123',
      details: { email: 'test@example.com' },
    });
  });
});
