import { UpdateUserProfileUseCase } from '../../../src/application/use-cases/UpdateUserProfileUseCase.js';
import { UserDomainService } from '../../../src/domain/services/UserDomainService.js';
import { UserProfile } from '../../../src/domain/entities/UserProfile.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import type { IUserProfileRepository } from '../../../src/domain/repositories/IUserProfileRepository.js';
import type { ICacheService } from '../../../src/application/ports/ICacheService.js';
import type { IEventPublisher } from '../../../src/application/ports/IEventPublisher.js';

describe('UpdateUserProfileUseCase', () => {
  let updateUserProfileUseCase: UpdateUserProfileUseCase;
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
    jest.spyOn(mockUserDomainService, 'updateProfile');

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

    updateUserProfileUseCase = new UpdateUserProfileUseCase(
      mockUserDomainService,
      mockCacheService,
      mockEventPublisher
    );
  });

  it('should update a user profile successfully', async () => {
    const email = Email.create('test@example.com');
    const profile = UserProfile.create('user-123', email, 'John', 'Doe');
    profile.updateProfile({ firstName: 'Jane', lastName: 'Smith' });
    
    jest.spyOn(mockUserDomainService, 'updateProfile').mockResolvedValue(profile);

    const dto = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    const result = await updateUserProfileUseCase.execute('user-123', dto);

    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Smith');
    expect(mockUserDomainService.updateProfile).toHaveBeenCalledWith('user-123', dto);
    expect(mockCacheService.delete).toHaveBeenCalledWith('user:profile:user-123');
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'user:profile:user-123',
      expect.any(Object),
      3600
    );
    expect(mockEventPublisher.publish).toHaveBeenCalledWith('audit.event', expect.any(Object));
  });

  it('should update profile without cache service', async () => {
    const email = Email.create('test@example.com');
    const profile = UserProfile.create('user-123', email);
    
    jest.spyOn(mockUserDomainService, 'updateProfile').mockResolvedValue(profile);

    const useCaseWithoutCache = new UpdateUserProfileUseCase(
      mockUserDomainService,
      undefined,
      mockEventPublisher
    );

    const dto = { firstName: 'Jane' };
    const result = await useCaseWithoutCache.execute('user-123', dto);

    expect(result.id).toBe('user-123');
    expect(mockCacheService.delete).not.toHaveBeenCalled();
  });

  it('should update profile without event publisher', async () => {
    const email = Email.create('test@example.com');
    const profile = UserProfile.create('user-123', email);
    
    jest.spyOn(mockUserDomainService, 'updateProfile').mockResolvedValue(profile);

    const useCaseWithoutPublisher = new UpdateUserProfileUseCase(
      mockUserDomainService,
      mockCacheService,
      undefined
    );

    const dto = { firstName: 'Jane' };
    const result = await useCaseWithoutPublisher.execute('user-123', dto);

    expect(result.id).toBe('user-123');
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
