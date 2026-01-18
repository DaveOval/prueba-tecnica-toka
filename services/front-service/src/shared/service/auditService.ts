import { auditApi } from "../api/apiClient";

export interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    details: Record<string, any> | null;
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: string;
}

export interface GetAuditLogsParams {
    userId?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
    offset?: number;
}

export interface GetAuditLogsResponse {
    logs: AuditLog[];
    total: number;
    limit: number;
    offset: number;
}

export const auditService = {
    async getAuditLogs(params: GetAuditLogsParams = {}): Promise<GetAuditLogsResponse> {
        const queryParams = new URLSearchParams();
        if (params.userId) queryParams.append('userId', params.userId);
        if (params.entityType) queryParams.append('entityType', params.entityType);
        if (params.entityId) queryParams.append('entityId', params.entityId);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());

        const response = await auditApi.get<GetAuditLogsResponse>(`?${queryParams.toString()}`);
        return response.data;
    },
};
