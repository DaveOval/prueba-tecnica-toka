import { CreateAuditLogUseCase } from '../../../src/application/use-cases/CreateAuditLogUseCase.js';
import { AuditLog } from '../../../src/domain/entities/AuditLog.js';
import { Action } from '../../../src/domain/value-objects/Action.js';
import { EntityType } from '../../../src/domain/value-objects/EntityType.js';
import type { IAuditLogRepository } from '../../../src/domain/repositories/IAuditLogRepository.js';

describe('CreateAuditLogUseCase', () => {
  let createAuditLogUseCase: CreateAuditLogUseCase;
  let mockAuditLogRepository: jest.Mocked<IAuditLogRepository>;

  beforeEach(() => {
    mockAuditLogRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByEntityType: jest.fn(),
      findByEntityId: jest.fn(),
      findAll: jest.fn(),
      findWithFilters: jest.fn(),
      count: jest.fn(),
    } as any;

    createAuditLogUseCase = new CreateAuditLogUseCase(mockAuditLogRepository);
  });

  it('should create an audit log successfully', async () => {
    const dto = {
      userId: 'user-123',
      action: Action.CREATE,
      entityType: EntityType.USER,
      entityId: 'entity-123',
      details: { name: 'John Doe' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    const result = await createAuditLogUseCase.execute(dto);

    expect(result.userId).toBe('user-123');
    expect(result.action).toBe(Action.CREATE);
    expect(result.entityType).toBe(EntityType.USER);
    expect(result.entityId).toBe('entity-123');
    expect(result.details).toEqual({ name: 'John Doe' });
    expect(result.ipAddress).toBe('192.168.1.1');
    expect(result.userAgent).toBe('Mozilla/5.0');
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(mockAuditLogRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should create audit log with null optional fields', async () => {
    const dto = {
      userId: null,
      action: Action.READ,
      entityType: EntityType.SYSTEM,
      entityId: null,
      details: null,
      ipAddress: null,
      userAgent: null,
    };

    const result = await createAuditLogUseCase.execute(dto);

    expect(result.userId).toBeNull();
    expect(result.entityId).toBeNull();
    expect(result.details).toBeNull();
    expect(result.ipAddress).toBeNull();
    expect(result.userAgent).toBeNull();
    expect(mockAuditLogRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should generate unique ID for each audit log', async () => {
    const dto = {
      userId: 'user-123',
      action: Action.CREATE,
      entityType: EntityType.USER,
    };

    const result1 = await createAuditLogUseCase.execute(dto);
    const result2 = await createAuditLogUseCase.execute(dto);

    expect(result1.id).not.toBe(result2.id);
  });

  it('should create audit log with different actions', async () => {
    const actions = [Action.CREATE, Action.UPDATE, Action.DELETE, Action.LOGIN];

    for (const action of actions) {
      const dto = {
        userId: 'user-123',
        action,
        entityType: EntityType.USER,
      };

      const result = await createAuditLogUseCase.execute(dto);
      expect(result.action).toBe(action);
    }
  });
});
