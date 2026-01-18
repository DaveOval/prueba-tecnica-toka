import { GetAuditLogsUseCase } from '../../../src/application/use-cases/GetAuditLogsUseCase.js';
import { AuditLog } from '../../../src/domain/entities/AuditLog.js';
import { Action } from '../../../src/domain/value-objects/Action.js';
import { EntityType } from '../../../src/domain/value-objects/EntityType.js';
import type { IAuditLogRepository } from '../../../src/domain/repositories/IAuditLogRepository.js';

describe('GetAuditLogsUseCase', () => {
  let getAuditLogsUseCase: GetAuditLogsUseCase;
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

    getAuditLogsUseCase = new GetAuditLogsUseCase(mockAuditLogRepository);
  });

  it('should get audit logs without filters', async () => {
    const auditLog1 = AuditLog.create('log-1', 'user-1', Action.CREATE, EntityType.USER, 'entity-1');
    const auditLog2 = AuditLog.create('log-2', 'user-2', Action.UPDATE, EntityType.USER, 'entity-2');

    mockAuditLogRepository.findWithFilters.mockResolvedValue([auditLog1, auditLog2]);
    mockAuditLogRepository.count.mockResolvedValue(2);

    const query = {};
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.logs).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.limit).toBe(100);
    expect(result.offset).toBe(0);
    expect(mockAuditLogRepository.findWithFilters).toHaveBeenCalledWith({}, 100, 0);
    expect(mockAuditLogRepository.count).toHaveBeenCalledWith({});
  });

  it('should get audit logs with userId filter', async () => {
    const auditLog = AuditLog.create('log-1', 'user-123', Action.CREATE, EntityType.USER, 'entity-1');

    mockAuditLogRepository.findWithFilters.mockResolvedValue([auditLog]);
    mockAuditLogRepository.count.mockResolvedValue(1);

    const query = { userId: 'user-123' };
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].userId).toBe('user-123');
    expect(mockAuditLogRepository.findWithFilters).toHaveBeenCalledWith(
      { userId: 'user-123' },
      100,
      0
    );
    expect(mockAuditLogRepository.count).toHaveBeenCalledWith({ userId: 'user-123' });
  });

  it('should get audit logs with entityType filter', async () => {
    const auditLog = AuditLog.create('log-1', 'user-123', Action.CREATE, EntityType.DOCUMENT, 'doc-1');

    mockAuditLogRepository.findWithFilters.mockResolvedValue([auditLog]);
    mockAuditLogRepository.count.mockResolvedValue(1);

    const query = { entityType: EntityType.DOCUMENT };
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].entityType).toBe(EntityType.DOCUMENT);
    expect(mockAuditLogRepository.findWithFilters).toHaveBeenCalledWith(
      { entityType: EntityType.DOCUMENT },
      100,
      0
    );
  });

  it('should get audit logs with entityId filter', async () => {
    const auditLog = AuditLog.create('log-1', 'user-123', Action.UPDATE, EntityType.USER, 'entity-123');

    mockAuditLogRepository.findWithFilters.mockResolvedValue([auditLog]);
    mockAuditLogRepository.count.mockResolvedValue(1);

    const query = { entityId: 'entity-123' };
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].entityId).toBe('entity-123');
    expect(mockAuditLogRepository.findWithFilters).toHaveBeenCalledWith(
      { entityId: 'entity-123' },
      100,
      0
    );
  });

  it('should get audit logs with action filter', async () => {
    const auditLog = AuditLog.create('log-1', 'user-123', Action.DELETE, EntityType.USER, 'entity-123');

    mockAuditLogRepository.findWithFilters.mockResolvedValue([auditLog]);
    mockAuditLogRepository.count.mockResolvedValue(1);

    const query = { action: Action.DELETE };
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].action).toBe(Action.DELETE);
    expect(mockAuditLogRepository.findWithFilters).toHaveBeenCalledWith(
      { action: Action.DELETE },
      100,
      0
    );
  });

  it('should get audit logs with multiple filters', async () => {
    const auditLog = AuditLog.create('log-1', 'user-123', Action.CREATE, EntityType.DOCUMENT, 'doc-1');

    mockAuditLogRepository.findWithFilters.mockResolvedValue([auditLog]);
    mockAuditLogRepository.count.mockResolvedValue(1);

    const query = {
      userId: 'user-123',
      entityType: EntityType.DOCUMENT,
      action: Action.CREATE,
    };
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.logs).toHaveLength(1);
    expect(mockAuditLogRepository.findWithFilters).toHaveBeenCalledWith(
      {
        userId: 'user-123',
        entityType: EntityType.DOCUMENT,
        action: Action.CREATE,
      },
      100,
      0
    );
  });

  it('should respect limit parameter', async () => {
    mockAuditLogRepository.findWithFilters.mockResolvedValue([]);
    mockAuditLogRepository.count.mockResolvedValue(0);

    const query = { limit: 50 };
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.limit).toBe(50);
    expect(mockAuditLogRepository.findWithFilters).toHaveBeenCalledWith({}, 50, 0);
  });

  it('should cap limit at 1000', async () => {
    mockAuditLogRepository.findWithFilters.mockResolvedValue([]);
    mockAuditLogRepository.count.mockResolvedValue(0);

    const query = { limit: 2000 };
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.limit).toBe(1000);
    expect(mockAuditLogRepository.findWithFilters).toHaveBeenCalledWith({}, 1000, 0);
  });

  it('should respect offset parameter', async () => {
    mockAuditLogRepository.findWithFilters.mockResolvedValue([]);
    mockAuditLogRepository.count.mockResolvedValue(0);

    const query = { offset: 10 };
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.offset).toBe(10);
    expect(mockAuditLogRepository.findWithFilters).toHaveBeenCalledWith({}, 100, 10);
  });

  it('should return empty array when no logs found', async () => {
    mockAuditLogRepository.findWithFilters.mockResolvedValue([]);
    mockAuditLogRepository.count.mockResolvedValue(0);

    const query = {};
    const result = await getAuditLogsUseCase.execute(query);

    expect(result.logs).toEqual([]);
    expect(result.total).toBe(0);
  });
});
