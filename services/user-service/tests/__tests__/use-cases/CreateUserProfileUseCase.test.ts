import { CreateUserProfileUseCase } from '../../../src/application/use-cases/CreateUserProfileUseCase.js';
import { UserDomainService } from '../../../src/domain/services/UserDomainService.js';
import { UserProfile } from '../../../src/domain/entities/UserProfile.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import type { IUserProfileRepository } from '../../../src/domain/repositories/IUserProfileRepository.js';
import type { ICacheService } from '../../../src/application/ports/ICacheService.js';
import type { IEventPublisher } from '../../../src/application/ports/IEventPublisher.js';

describe('CreateUserProfileUseCase', () => {
  let createUserProfileUseCase: CreateUserProfileUseCase;
  let mockUserDomainService: jest.Mocked<UserDomainService>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
  let mockUserProfileRepository: jest.Mocked<IUserProfileRepository>;

  beforeEach(() => {
    mockUserProfileRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockUserDomainService = new UserDomainService(mockUserProfileRepository) as jest.Mocked<UserDomainService>;
    jest.spyOn(mockUserDomainService, 'createProfile');

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
      exists: jest.fn(),
      clear: jest.fn(),
    } as any;

    mockEventPublisher = {
      publish: jest.fn(),
    } as any;

    createUserProfileUseCase = new CreateUserProfileUseCase(
      mockUserDomainService,
      mockCacheService,
      mockEventPublisher
    );
  });

  it('should create a user profile successfully', async () => {
    const email = Email.create('newuser@example.com');
    const profile = UserProfile.create('user-123', email, 'John', 'Doe', '1234567890', '123 Main St');
    
    mockUserProfileRepository.findByEmail.mockResolvedValue(null);
    jest.spyOn(mockUserDomainService, 'createProfile').mockResolvedValue(profile);

    const dto = {
      id: 'user-123',
      email: 'newuser@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      address: '123 Main St',
    };

    const result = await createUserProfileUseCase.execute(dto);

    expect(result.id).toBe('user-123');
    expect(result.email).toBe('newuser@example.com');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(mockUserDomainService.createProfile).toHaveBeenCalledWith(
      'user-123',
      expect.any(Email),
      'John',
      'Doe',
      '1234567890',
      '123 Main St'
    );
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'user:profile:user-123',
      expect.any(Object),
      3600
    );
    expect(mockEventPublisher.publish).toHaveBeenCalledWith('audit.event', expect.any(Object));
  });

  it('should create profile without cache service', async () => {
    const email = Email.create('newuser@example.com');
    const profile = UserProfile.create('user-123', email);
    
    mockUserProfileRepository.findByEmail.mockResolvedValue(null);
    jest.spyOn(mockUserDomainService, 'createProfile').mockResolvedValue(profile);

    const useCaseWithoutCache = new CreateUserProfileUseCase(
      mockUserDomainService,
      undefined,
      mockEventPublisher
    );

    const dto = {
      id: 'user-123',
      email: 'newuser@example.com',
    };

    const result = await useCaseWithoutCache.execute(dto);

    expect(result.id).toBe('user-123');
    expect(mockCacheService.set).not.toHaveBeenCalled();
  });

  it('should create profile without event publisher', async () => {
    const email = Email.create('newuser@example.com');
    const profile = UserProfile.create('user-123', email);
    
    mockUserProfileRepository.findByEmail.mockResolvedValue(null);
    jest.spyOn(mockUserDomainService, 'createProfile').mockResolvedValue(profile);

    const useCaseWithoutPublisher = new CreateUserProfileUseCase(
      mockUserDomainService,
      mockCacheService,
      undefined
    );

    const dto = {
      id: 'user-123',
      email: 'newuser@example.com',
    };

    const result = await useCaseWithoutPublisher.execute(dto);

    expect(result.id).toBe('user-123');
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
