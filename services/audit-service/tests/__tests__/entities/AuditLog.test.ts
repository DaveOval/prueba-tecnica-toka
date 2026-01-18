import { AuditLog } from '../../../src/domain/entities/AuditLog.js';
import { Action } from '../../../src/domain/value-objects/Action.js';
import { EntityType } from '../../../src/domain/value-objects/EntityType.js';

describe('AuditLog', () => {
  describe('create', () => {
    it('should create an audit log with all fields', () => {
      const timestamp = new Date('2024-01-01');
      const auditLog = AuditLog.create(
        'log-123',
        'user-123',
        Action.CREATE,
        EntityType.USER,
        'entity-123',
        { key: 'value' },
        '192.168.1.1',
        'Mozilla/5.0',
        timestamp
      );

      expect(auditLog.getId()).toBe('log-123');
      expect(auditLog.getUserId()).toBe('user-123');
      expect(auditLog.getAction()).toBe(Action.CREATE);
      expect(auditLog.getEntityType()).toBe(EntityType.USER);
      expect(auditLog.getEntityId()).toBe('entity-123');
      expect(auditLog.getDetails()).toEqual({ key: 'value' });
      expect(auditLog.getIpAddress()).toBe('192.168.1.1');
      expect(auditLog.getUserAgent()).toBe('Mozilla/5.0');
      expect(auditLog.getTimestamp()).toEqual(timestamp);
    });

    it('should create an audit log with minimal fields', () => {
      const auditLog = AuditLog.create(
        'log-123',
        null,
        Action.READ,
        EntityType.SYSTEM,
        null
      );

      expect(auditLog.getId()).toBe('log-123');
      expect(auditLog.getUserId()).toBeNull();
      expect(auditLog.getAction()).toBe(Action.READ);
      expect(auditLog.getEntityType()).toBe(EntityType.SYSTEM);
      expect(auditLog.getEntityId()).toBeNull();
      expect(auditLog.getDetails()).toBeNull();
      expect(auditLog.getIpAddress()).toBeNull();
      expect(auditLog.getUserAgent()).toBeNull();
      expect(auditLog.getTimestamp()).toBeInstanceOf(Date);
    });

    it('should use current timestamp by default', () => {
      const before = new Date();
      const auditLog = AuditLog.create(
        'log-123',
        'user-123',
        Action.LOGIN,
        EntityType.AUTH,
        null
      );
      const after = new Date();

      expect(auditLog.getTimestamp().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(auditLog.getTimestamp().getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should create audit log with different actions', () => {
      const actions = [Action.CREATE, Action.UPDATE, Action.DELETE, Action.LOGIN];
      
      actions.forEach(action => {
        const auditLog = AuditLog.create(
          `log-${action}`,
          'user-123',
          action,
          EntityType.USER,
          null
        );
        expect(auditLog.getAction()).toBe(action);
      });
    });

    it('should create audit log with different entity types', () => {
      const entityTypes = [EntityType.USER, EntityType.AUTH, EntityType.DOCUMENT];
      
      entityTypes.forEach(entityType => {
        const auditLog = AuditLog.create(
          `log-${entityType}`,
          'user-123',
          Action.READ,
          entityType,
          null
        );
        expect(auditLog.getEntityType()).toBe(entityType);
      });
    });
  });

  describe('getters', () => {
    it('should return correct values from getters', () => {
      const timestamp = new Date('2024-01-01');
      const auditLog = AuditLog.create(
        'log-123',
        'user-123',
        Action.UPDATE,
        EntityType.DOCUMENT,
        'doc-123',
        { field: 'updated' },
        '10.0.0.1',
        'Chrome',
        timestamp
      );

      expect(auditLog.getId()).toBe('log-123');
      expect(auditLog.getUserId()).toBe('user-123');
      expect(auditLog.getAction()).toBe(Action.UPDATE);
      expect(auditLog.getEntityType()).toBe(EntityType.DOCUMENT);
      expect(auditLog.getEntityId()).toBe('doc-123');
      expect(auditLog.getDetails()).toEqual({ field: 'updated' });
      expect(auditLog.getIpAddress()).toBe('10.0.0.1');
      expect(auditLog.getUserAgent()).toBe('Chrome');
      expect(auditLog.getTimestamp()).toEqual(timestamp);
    });
  });
});
