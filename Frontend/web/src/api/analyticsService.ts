// services/analyticsService.ts
import agent from './agent';
import type { ApiResult } from '../types/auth';
import type {
    UsersByRoleResponse,
    AuditLogResponse,
    AuditLogQueryParams,
} from '../types/analytics';

// локальный тип под /users (UserService.GetAllAsync → UserResponse[])
interface UserRow {
    id: number;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

const analyticsService = {
    getAuditLogs: (params?: AuditLogQueryParams) =>
        agent.get<ApiResult<AuditLogResponse[]>>('/audit-logs', {
            params: {
                UserId: params?.userId ?? undefined,
                EntityName: params?.entityName || undefined,
                EntityId: params?.entityId ?? undefined,
                FromDate: params?.fromDate || undefined,
                ToDate: params?.toDate || undefined,
                Page: params?.page ?? 1,
                PageSize: params?.pageSize ?? 50,
            },
        }),

    // ⚠️ агрегата на бэке нет — берём /users одним запросом и группируем тут
    getUsersByRole: async (): Promise<UsersByRoleResponse[]> => {
        const res = await agent.get<ApiResult<UserRow[]>>('/users');
        if (!res.data.isSuccess || !res.data.data) return [];

        const map = new Map<string, number>();
        for (const u of res.data.data) {
            const role = u.role || 'Без роли';
            map.set(role, (map.get(role) ?? 0) + 1);
        }
        return [...map.entries()].map(([role, count]) => ({ role, count }));
    },
};

export default analyticsService;