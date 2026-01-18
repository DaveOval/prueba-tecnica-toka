import { EntityType, EntityTypeVO } from '../../../src/domain/value-objects/EntityType.js';

describe('EntityType', () => {
  describe('EntityTypeVO.create', () => {
    it('should create EntityTypeVO with valid entity type', () => {
      const entityTypeVO = EntityTypeVO.create(EntityType.USER);
      expect(entityTypeVO.getValue()).toBe(EntityType.USER);
    });

    it('should create EntityTypeVO with all valid entity types', () => {
      Object.values(EntityType).forEach(entityType => {
        const entityTypeVO = EntityTypeVO.create(entityType);
        expect(entityTypeVO.getValue()).toBe(entityType);
      });
    });

    it('should throw error for invalid entity type', () => {
      expect(() => EntityTypeVO.create('INVALID_TYPE')).toThrow('Invalid entity type: INVALID_TYPE');
      expect(() => EntityTypeVO.create('')).toThrow('Invalid entity type: ');
      expect(() => EntityTypeVO.create('user')).toThrow('Invalid entity type: user');
    });

    it('should accept string entity type values', () => {
      const entityTypeVO = EntityTypeVO.create('USER');
      expect(entityTypeVO.getValue()).toBe(EntityType.USER);
    });
  });

  describe('EntityTypeVO.getValue', () => {
    it('should return the entity type value', () => {
      const entityTypeVO = EntityTypeVO.create(EntityType.AUTH);
      expect(entityTypeVO.getValue()).toBe(EntityType.AUTH);
    });
  });

  describe('EntityType enum', () => {
    it('should have all expected entity type values', () => {
      expect(EntityType.USER).toBe('USER');
      expect(EntityType.USER_PROFILE).toBe('USER_PROFILE');
      expect(EntityType.AUTH).toBe('AUTH');
      expect(EntityType.SYSTEM).toBe('SYSTEM');
      expect(EntityType.DOCUMENT).toBe('DOCUMENT');
      expect(EntityType.PROMPT).toBe('PROMPT');
    });
  });
});
