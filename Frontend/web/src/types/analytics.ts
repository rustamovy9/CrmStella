export interface UsersByRoleResponse {
    role: string;
    count: number;
}

// Лента / агрегаты аудита (из AuditLogService)
export interface AuditLogResponse {
    id: number;
    userId: number | null;
    userName: string | null;
    action: string;
    entityName: string;
    entityId: number | null;
    oldValues: string | null;
    newValues: string | null;
    ipAddress: string | null;
    createdAt: string;
}

export interface AuditLogQueryParams {
    userId?: number;
    entityName?: string;
    entityId?: number;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}