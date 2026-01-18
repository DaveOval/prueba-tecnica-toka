import { UserProfile } from '../../../src/domain/entities/UserProfile.js';
import { Email } from '../../../src/domain/value-objects/Email.js';

describe('UserProfile', () => {
  describe('create', () => {
    it('should create a user profile with all fields', () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create(
        'user-123',
        email,
        'John',
        'Doe',
        '1234567890',
        '123 Main St'
      );

      expect(profile.getId()).toBe('user-123');
      expect(profile.getEmail().getValue()).toBe('test@example.com');
      expect(profile.getFirstName()).toBe('John');
      expect(profile.getLastName()).toBe('Doe');
      expect(profile.getPhone()).toBe('1234567890');
      expect(profile.getAddress()).toBe('123 Main St');
      expect(profile.getCreatedAt()).toBeInstanceOf(Date);
      expect(profile.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create a user profile with minimal fields', () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create('user-123', email);

      expect(profile.getId()).toBe('user-123');
      expect(profile.getEmail().getValue()).toBe('test@example.com');
      expect(profile.getFirstName()).toBeNull();
      expect(profile.getLastName()).toBeNull();
      expect(profile.getPhone()).toBeNull();
      expect(profile.getAddress()).toBeNull();
    });

    it('should create a user profile with partial fields', () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create('user-123', email, 'John');

      expect(profile.getFirstName()).toBe('John');
      expect(profile.getLastName()).toBeNull();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a user profile from database data', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const profile = UserProfile.reconstitute(
        'user-123',
        'test@example.com',
        'John',
        'Doe',
        '1234567890',
        '123 Main St',
        createdAt,
        updatedAt
      );

      expect(profile.getId()).toBe('user-123');
      expect(profile.getEmail().getValue()).toBe('test@example.com');
      expect(profile.getFirstName()).toBe('John');
      expect(profile.getLastName()).toBe('Doe');
      expect(profile.getPhone()).toBe('1234567890');
      expect(profile.getAddress()).toBe('123 Main St');
      expect(profile.getCreatedAt()).toEqual(createdAt);
      expect(profile.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should reconstitute a user profile with null fields', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const profile = UserProfile.reconstitute(
        'user-123',
        'test@example.com',
        null,
        null,
        null,
        null,
        createdAt,
        updatedAt
      );

      expect(profile.getFirstName()).toBeNull();
      expect(profile.getLastName()).toBeNull();
      expect(profile.getPhone()).toBeNull();
      expect(profile.getAddress()).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create('user-123', email, 'John', 'Doe');

      profile.updateProfile({
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '0987654321',
        address: '456 Oak Ave',
      });

      expect(profile.getFirstName()).toBe('Jane');
      expect(profile.getLastName()).toBe('Smith');
      expect(profile.getPhone()).toBe('0987654321');
      expect(profile.getAddress()).toBe('456 Oak Ave');
      expect(profile.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should update only provided fields', () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create('user-123', email, 'John', 'Doe', '1234567890');

      profile.updateProfile({
        firstName: 'Jane',
      });

      expect(profile.getFirstName()).toBe('Jane');
      expect(profile.getLastName()).toBe('Doe');
      expect(profile.getPhone()).toBe('1234567890');
    });

    it('should set fields to null when provided as empty string', () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create('user-123', email, 'John', 'Doe');

      profile.updateProfile({
        firstName: '',
        lastName: '',
      });

      expect(profile.getFirstName()).toBeNull();
      expect(profile.getLastName()).toBeNull();
    });
  });

  describe('getters', () => {
    it('should return correct values from getters', () => {
      const email = Email.create('test@example.com');
      const profile = UserProfile.create('user-123', email, 'John', 'Doe');

      expect(profile.getId()).toBe('user-123');
      expect(profile.getEmail()).toBeInstanceOf(Email);
      expect(profile.getFirstName()).toBe('John');
      expect(profile.getLastName()).toBe('Doe');
      expect(profile.getCreatedAt()).toBeInstanceOf(Date);
      expect(profile.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });
});
