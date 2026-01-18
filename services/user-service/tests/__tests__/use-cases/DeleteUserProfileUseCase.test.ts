import { DeleteUserProfileUseCase } from '../../../src/application/use-cases/DeleteUserProfileUseCase.js';
import { UserDomainService } from '../../../src/domain/services/UserDomainService.js';
import { UserProfile } from '../../../src/domain/entities/UserProfile.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import type { IUserProfileRepository } from '../../../src/domain/repositories/IUserProfileRepository.js';
import type { ICacheService } from '../../../src/application/ports/ICacheService.js';
import type { IEventPublisher } from '../../../src/application/ports/IEventPublisher.js';

describe('DeleteUserProfileUseCase', () => {
  let deleteUserProfileUseCase: DeleteUserProfileUseCase;
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
    jest.spyOn(mockUserDomainService, 'deleteProfile');

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

    deleteUserProfileUseCase = new DeleteUserProfileUseCase(
      mockUserDomainService,
      mockCacheService,
      mockEventPublisher
    );
  });

  it('should delete a user profile successfully', async () => {
    const email = Email.create('test@example.com');
    const profile = UserProfile.create('user-123', email);
    
    mockUserProfileRepository.findById.mockResolvedValue(profile);
    jest.spyOn(mockUserDomainService, 'deleteProfile').mockResolvedValue();

    await deleteUserProfileUseCase.execute('user-123');

    expect(mockUserDomainService.deleteProfile).toHaveBeenCalledWith('user-123');
    expect(mockCacheService.delete).toHaveBeenCalledWith('user:profile:user-123');
    expect(mockEventPublisher.publish).toHaveBeenCalledWith('audit.event', {
      userId: 'user-123',
      action: 'DELETE',
      entityType: 'USER_PROFILE',
      entityId: 'user-123',
    });
  });

  it('should delete profile without cache service', async () => {
    const email = Email.create('test@example.com');
    const profile = UserProfile.create('user-123', email);
    
    mockUserProfileRepository.findById.mockResolvedValue(profile);
    jest.spyOn(mockUserDomainService, 'deleteProfile').mockResolvedValue();

    const useCaseWithoutCache = new DeleteUserProfileUseCase(
      mockUserDomainService,
      undefined,
      mockEventPublisher
    );

    await useCaseWithoutCache.execute('user-123');

    expect(mockUserDomainService.deleteProfile).toHaveBeenCalledWith('user-123');
    expect(mockCacheService.delete).not.toHaveBeenCalled();
  });

  it('should delete profile without event publisher', async () => {
    const email = Email.create('test@example.com');
    const profile = UserProfile.create('user-123', email);
    
    mockUserProfileRepository.findById.mockResolvedValue(profile);
    jest.spyOn(mockUserDomainService, 'deleteProfile').mockResolvedValue();

    const useCaseWithoutPublisher = new DeleteUserProfileUseCase(
      mockUserDomainService,
      mockCacheService,
      undefined
    );

    await useCaseWithoutPublisher.execute('user-123');

    expect(mockUserDomainService.deleteProfile).toHaveBeenCalledWith('user-123');
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
