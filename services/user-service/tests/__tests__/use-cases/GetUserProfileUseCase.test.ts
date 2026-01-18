import { GetUserProfileUseCase } from '../../../src/application/use-cases/GetUserProfileUseCase.js';
import { UserDomainService } from '../../../src/domain/services/UserDomainService.js';
import { UserProfile } from '../../../src/domain/entities/UserProfile.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import type { IUserProfileRepository } from '../../../src/domain/repositories/IUserProfileRepository.js';
import type { ICacheService } from '../../../src/application/ports/ICacheService.js';

describe('GetUserProfileUseCase', () => {
  let getUserProfileUseCase: GetUserProfileUseCase;
  let mockUserDomainService: jest.Mocked<UserDomainService>;
  let mockCacheService: jest.Mocked<ICacheService>;
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
    jest.spyOn(mockUserDomainService, 'getProfile');

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
      exists: jest.fn(),
      clear: jest.fn(),
    } as any;

    getUserProfileUseCase = new GetUserProfileUseCase(mockUserDomainService, mockCacheService);
  });

  it('should get user profile from cache', async () => {
    const cachedProfile = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      address: '123 Main St',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCacheService.get.mockResolvedValue(cachedProfile);

    const result = await getUserProfileUseCase.execute('user-123');

    expect(result).toEqual(cachedProfile);
    expect(mockCacheService.get).toHaveBeenCalledWith('user:profile:user-123');
    expect(mockUserDomainService.getProfile).not.toHaveBeenCalled();
  });

  it('should get user profile from database when not in cache', async () => {
    const email = Email.create('test@example.com');
    const profile = UserProfile.create('user-123', email, 'John', 'Doe');
    
    mockCacheService.get.mockResolvedValue(null);
    jest.spyOn(mockUserDomainService, 'getProfile').mockResolvedValue(profile);

    const result = await getUserProfileUseCase.execute('user-123');

    expect(result.id).toBe('user-123');
    expect(result.email).toBe('test@example.com');
    expect(mockUserDomainService.getProfile).toHaveBeenCalledWith('user-123');
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'user:profile:user-123',
      expect.any(Object),
      3600
    );
  });

  it('should get profile without cache service', async () => {
    const email = Email.create('test@example.com');
    const profile = UserProfile.create('user-123', email, 'John', 'Doe');
    
    jest.spyOn(mockUserDomainService, 'getProfile').mockResolvedValue(profile);

    const useCaseWithoutCache = new GetUserProfileUseCase(mockUserDomainService, undefined);

    const result = await useCaseWithoutCache.execute('user-123');

    expect(result.id).toBe('user-123');
    expect(mockCacheService.get).not.toHaveBeenCalled();
    expect(mockCacheService.set).not.toHaveBeenCalled();
  });
});
