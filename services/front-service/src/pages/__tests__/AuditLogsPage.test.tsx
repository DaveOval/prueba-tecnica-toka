import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, waitFor } from '../../test/utils';
import AuditLogsPage from '../AuditLogsPage';
import * as useAuthModule from '../../shared/hooks/useAuth';
import * as auditServiceModule from '../../shared/service/auditService';

// Mock de los hooks y servicios
vi.mock('../../shared/hooks/useAuth');
vi.mock('../../shared/service/auditService');

describe('AuditLogsPage', () => {
  const mockAdminUser = {
    id: '1',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockUseAuth = {
    user: mockAdminUser,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth);
    vi.mocked(auditServiceModule.auditService.getAuditLogs).mockResolvedValue({
      logs: [],
      total: 0,
      limit: 20,
      offset: 0,
    });
  });

  it('debe renderizar el componente correctamente', async () => {
    const { getByText } = renderWithProviders(<AuditLogsPage />);

    await waitFor(() => {
      expect(auditServiceModule.auditService.getAuditLogs).toHaveBeenCalled();
    });

    expect(getByText(/Logs de Auditoría/i)).toBeInTheDocument();
  });

  it('debe cargar los logs de auditoría al montar', async () => {
    const mockLogs = [
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
    ];

    vi.mocked(auditServiceModule.auditService.getAuditLogs).mockResolvedValue({
      logs: mockLogs,
      total: 1,
      limit: 20,
      offset: 0,
    });

    renderWithProviders(<AuditLogsPage />);

    await waitFor(() => {
      expect(auditServiceModule.auditService.getAuditLogs).toHaveBeenCalled();
    });
  });

  it('no debe cargar logs si el usuario no es admin', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      ...mockUseAuth,
      user: {
        id: '2',
        email: 'user@example.com',
        role: 'user',
      },
    });

    renderWithProviders(<AuditLogsPage />);

    expect(auditServiceModule.auditService.getAuditLogs).not.toHaveBeenCalled();
  });
});
