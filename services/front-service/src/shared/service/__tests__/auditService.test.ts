import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../auditService';
import { auditApi } from '../../api/apiClient';

// Mock del apiClient
vi.mock('../../api/apiClient', () => ({
  auditApi: {
    get: vi.fn(),
  },
}));

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('debe obtener los logs de auditoría', async () => {
      const mockResponse = {
        data: {
          logs: [
            {
              id: '1',
              userId: 'user-1',
              action: 'CREATE',
              entityType: 'USER',
              entityId: 'user-1',
              details: {},
              ipAddress: null,
              userAgent: null,
              timestamp: '2024-01-01T00:00:00Z',
            },
          ],
          total: 1,
          limit: 10,
          offset: 0,
        },
      };

      vi.mocked(auditApi.get).mockResolvedValue(mockResponse);

      const result = await auditService.getAuditLogs();

      expect(auditApi.get).toHaveBeenCalledWith('?');
      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('debe obtener logs con filtros', async () => {
      const mockResponse = {
        data: {
          logs: [],
          total: 0,
          limit: 10,
          offset: 0,
        },
      };

      vi.mocked(auditApi.get).mockResolvedValue(mockResponse);

      const result = await auditService.getAuditLogs({
        userId: 'user-1',
        action: 'CREATE',
      });

      expect(auditApi.get).toHaveBeenCalledWith('?userId=user-1&action=CREATE');
      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
