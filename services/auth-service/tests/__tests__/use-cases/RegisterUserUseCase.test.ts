import { RegisterUserUseCase } from '../../../src/application/use-cases/RegisterUserUseCase.js';
import { AuthDomainService } from '../../../src/domain/services/AuthDomainService.js';
import { User, UserRole } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { Password } from '../../../src/domain/value-objects/Password.js';
import type { IEventPublisher } from '../../../src/application/ports/IEventPublisher.js';
import type { IUserRepository } from '../../../src/domain/repositories/IUserRepository.js';

describe('RegisterUserUseCase', () => {
  let registerUserUseCase: RegisterUserUseCase;
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
    jest.spyOn(mockAuthDomainService, 'registerUser');

    mockEventPublisher = {
      publish: jest.fn(),
    } as any;

    registerUserUseCase = new RegisterUserUseCase(mockAuthDomainService, mockEventPublisher);
  });

  it('should register a new user successfully', async () => {
    const email = Email.create('newuser@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const user = User.create('user-123', email, password, UserRole.USER, false);
    
    mockUserRepository.findByEmail.mockResolvedValue(null);
    jest.spyOn(mockAuthDomainService, 'registerUser').mockResolvedValue(user);

    const dto = {
      email: 'newuser@example.com',
      password: 'password123',
    };

    const result = await registerUserUseCase.execute(dto);

    expect(result.id).toBe('user-123');
    expect(result.email).toBe('newuser@example.com');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(mockAuthDomainService.registerUser).toHaveBeenCalledWith(
      expect.any(Email),
      expect.any(Password),
      UserRole.USER,
      false
    );
    expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2);
    expect(mockEventPublisher.publish).toHaveBeenCalledWith('user.registered', expect.any(Object));
    expect(mockEventPublisher.publish).toHaveBeenCalledWith('audit.event', expect.any(Object));
  });

  it('should publish events with correct data', async () => {
    const email = Email.create('newuser@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const user = User.create('user-123', email, password, UserRole.USER, false);
    
    mockUserRepository.findByEmail.mockResolvedValue(null);
    jest.spyOn(mockAuthDomainService, 'registerUser').mockResolvedValue(user);

    const dto = {
      email: 'newuser@example.com',
      password: 'password123',
    };

    await registerUserUseCase.execute(dto);

    const registeredCall = mockEventPublisher.publish.mock.calls.find(
      call => call[0] === 'user.registered'
    );
    expect(registeredCall).toBeDefined();
    expect(registeredCall![1]).toMatchObject({
      userId: 'user-123',
      email: 'newuser@example.com',
    });

    const auditCall = mockEventPublisher.publish.mock.calls.find(
      call => call[0] === 'audit.event'
    );
    expect(auditCall).toBeDefined();
    expect(auditCall![1]).toMatchObject({
      userId: 'user-123',
      action: 'REGISTER',
      entityType: 'AUTH',
      entityId: 'user-123',
    });
  });
});
