import { GetAllUsersUseCase } from '../../../src/application/use-cases/GetAllUsersUseCase.js';
import { UserDomainService } from '../../../src/domain/services/UserDomainService.js';
import { UserProfile } from '../../../src/domain/entities/UserProfile.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import type { IUserProfileRepository } from '../../../src/domain/repositories/IUserProfileRepository.js';

describe('GetAllUsersUseCase', () => {
  let getAllUsersUseCase: GetAllUsersUseCase;
  let mockUserDomainService: jest.Mocked<UserDomainService>;
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
    jest.spyOn(mockUserDomainService, 'getAllProfiles');

    getAllUsersUseCase = new GetAllUsersUseCase(mockUserDomainService);
  });

  it('should return all user profiles', async () => {
    const profile1 = UserProfile.create('user-1', Email.create('user1@example.com'), 'John', 'Doe');
    const profile2 = UserProfile.create('user-2', Email.create('user2@example.com'), 'Jane', 'Smith');
    
    mockUserProfileRepository.findAll.mockResolvedValue([profile1, profile2]);

    const result = await getAllUsersUseCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'user-1',
      email: 'user1@example.com',
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(result[1]).toMatchObject({
      id: 'user-2',
      email: 'user2@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
    });
    expect(mockUserDomainService.getAllProfiles).toHaveBeenCalled();
  });

  it('should return empty array when no profiles exist', async () => {
    mockUserProfileRepository.findAll.mockResolvedValue([]);

    const result = await getAllUsersUseCase.execute();

    expect(result).toEqual([]);
  });
});
