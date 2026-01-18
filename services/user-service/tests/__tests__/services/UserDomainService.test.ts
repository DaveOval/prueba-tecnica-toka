import { UserDomainService } from '../../../src/domain/services/UserDomainService.js';
import { UserProfile } from '../../../src/domain/entities/UserProfile.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import type { IUserProfileRepository } from '../../../src/domain/repositories/IUserProfileRepository.js';

describe('UserDomainService', () => {
  let userDomainService: UserDomainService;
  let mockUserProfileRepository: jest.Mocked<IUserProfileRepository>;

  beforeEach(() => {
    mockUserProfileRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    userDomainService = new UserDomainService(mockUserProfileRepository);
  });

  describe('createProfile', () => {
    it('should create a new user profile', async () => {
      const email = Email.create('newuser@example.com');
      
      mockUserProfileRepository.findByEmail.mockResolvedValue(null);

      const profile = await userDomainService.createProfile(
        'user-123',
        email,
        'John',
        'Doe',
        '1234567890',
        '123 Main St'
      );

      expect(profile.getEmail().getValue()).toBe('newuser@example.com');
      expect(profile.getFirstName()).toBe('John');
      expect(profile.getLastName()).toBe('Doe');
      expect(mockUserProfileRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUserProfileRepository.save).toHaveBeenCalled();
    });

    it('should throw error if profile already exists', async () => {
      const email = Email.create('existing@example.com');
      const existingProfile = UserProfile.create('user-456', email);
      
      mockUserProfileRepository.findByEmail.mockResolvedValue(existingProfile);

      await expect(
        userDomainService.createProfile('user-123', email)
      ).rejects.toThrow('User profile with this email already exists');

      expect(mockUserProfileRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update a user profile', async () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create('user-123', email, 'John', 'Doe');
      
      mockUserProfileRepository.findById.mockResolvedValue(profile);

      const updatedProfile = await userDomainService.updateProfile('user-123', {
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(updatedProfile.getFirstName()).toBe('Jane');
      expect(updatedProfile.getLastName()).toBe('Smith');
      expect(mockUserProfileRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockUserProfileRepository.save).toHaveBeenCalled();
    });

    it('should throw error if profile not found', async () => {
      mockUserProfileRepository.findById.mockResolvedValue(null);

      await expect(
        userDomainService.updateProfile('non-existent', { firstName: 'Jane' })
      ).rejects.toThrow('User profile not found');

      expect(mockUserProfileRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should get a user profile', async () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create('user-123', email, 'John', 'Doe');
      
      mockUserProfileRepository.findById.mockResolvedValue(profile);

      const result = await userDomainService.getProfile('user-123');

      expect(result.getId()).toBe('user-123');
      expect(result.getFirstName()).toBe('John');
      expect(mockUserProfileRepository.findById).toHaveBeenCalledWith('user-123');
    });

    it('should throw error if profile not found', async () => {
      mockUserProfileRepository.findById.mockResolvedValue(null);

      await expect(
        userDomainService.getProfile('non-existent')
      ).rejects.toThrow('User profile not found');
    });
  });

  describe('getAllProfiles', () => {
    it('should get all user profiles', async () => {
      const profile1 = UserProfile.create('user-1', Email.create('user1@example.com'));
      const profile2 = UserProfile.create('user-2', Email.create('user2@example.com'));
      
      mockUserProfileRepository.findAll.mockResolvedValue([profile1, profile2]);

      const result = await userDomainService.getAllProfiles();

      expect(result).toHaveLength(2);
      expect(mockUserProfileRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no profiles exist', async () => {
      mockUserProfileRepository.findAll.mockResolvedValue([]);

      const result = await userDomainService.getAllProfiles();

      expect(result).toEqual([]);
    });
  });

  describe('deleteProfile', () => {
    it('should delete a user profile', async () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create('user-123', email);
      
      mockUserProfileRepository.findById.mockResolvedValue(profile);

      await userDomainService.deleteProfile('user-123');

      expect(mockUserProfileRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockUserProfileRepository.delete).toHaveBeenCalledWith('user-123');
    });

    it('should throw error if profile not found', async () => {
      mockUserProfileRepository.findById.mockResolvedValue(null);

      await expect(
        userDomainService.deleteProfile('non-existent')
      ).rejects.toThrow('User profile not found');

      expect(mockUserProfileRepository.delete).not.toHaveBeenCalled();
    });
  });
});
