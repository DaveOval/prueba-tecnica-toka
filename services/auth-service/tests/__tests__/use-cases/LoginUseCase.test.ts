import { LoginUseCase } from '../../../src/application/use-cases/LoginUseCase.js';
import { AuthDomainService } from '../../../src/domain/services/AuthDomainService.js';
import { JwtTokenService } from '../../../src/infrastructure/service/JwtTokenService.js';
import { User, UserRole } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { Password } from '../../../src/domain/value-objects/Password.js';
import type { IEventPublisher } from '../../../src/application/ports/IEventPublisher.js';
import type { IUserRepository } from '../../../src/domain/repositories/IUserRepository.js';

jest.mock('../../../src/infrastructure/service/JwtTokenService.js');

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockAuthDomainService: jest.Mocked<AuthDomainService>;
  let mockTokenService: jest.Mocked<JwtTokenService>;
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
    jest.spyOn(mockAuthDomainService, 'authenticateUser');

    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyToken: jest.fn(),
    } as any;

    mockEventPublisher = {
      publish: jest.fn(),
    } as any;

    loginUseCase = new LoginUseCase(mockAuthDomainService, mockTokenService, mockEventPublisher);
  });

  it('should login user successfully', async () => {
    const email = Email.create('test@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const user = User.create('user-123', email, password, UserRole.USER, true);
    
    jest.spyOn(mockAuthDomainService, 'authenticateUser').mockResolvedValue(user);
    mockTokenService.generateAccessToken.mockReturnValue('access-token');
    mockTokenService.generateRefreshToken.mockReturnValue('refresh-token');

    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const result = await loginUseCase.execute(dto);

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.id).toBe('user-123');
    expect(result.user.email).toBe('test@example.com');
    expect(mockAuthDomainService.authenticateUser).toHaveBeenCalledWith(
      expect.any(Email),
      'password123'
    );
    expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
      'user-123',
      'test@example.com',
      'user'
    );
    expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith('user-123');
    expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2);
  });

  it('should publish events with correct data', async () => {
    const email = Email.create('test@example.com');
    const password = Password.fromHash('$2b$10$hashedpassword');
    const user = User.create('user-123', email, password, UserRole.USER, true);
    
    jest.spyOn(mockAuthDomainService, 'authenticateUser').mockResolvedValue(user);
    mockTokenService.generateAccessToken.mockReturnValue('access-token');
    mockTokenService.generateRefreshToken.mockReturnValue('refresh-token');

    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };

    await loginUseCase.execute(dto);

    const loggedInCall = mockEventPublisher.publish.mock.calls.find(
      call => call[0] === 'user.loggedIn'
    );
    expect(loggedInCall).toBeDefined();
    expect(loggedInCall![1]).toMatchObject({
      userId: 'user-123',
      email: 'test@example.com',
    });

    const auditCall = mockEventPublisher.publish.mock.calls.find(
      call => call[0] === 'audit.event'
    );
    expect(auditCall).toBeDefined();
    expect(auditCall![1]).toMatchObject({
      userId: 'user-123',
      action: 'LOGIN',
      entityType: 'AUTH',
      entityId: 'user-123',
    });
  });

  it('should throw error for invalid credentials', async () => {
    jest.spyOn(mockAuthDomainService, 'authenticateUser').mockRejectedValue(
      new Error('Invalid credentials')
    );

    const dto = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    await expect(loginUseCase.execute(dto)).rejects.toThrow('Invalid credentials');
    expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
