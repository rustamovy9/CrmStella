import agent from './agent';
import type { ApiResult } from '../types/auth';
import type { PagedResult } from '../types/admin';
import type {
    Lead,
    LeadDetails,
    LeadActivity,
    CreateLeadRequest,
    UpdateLeadRequest,
    ChangeLeadStatusRequest,
    LeadQueryParams,
} from '../types/lead';

const leadService = {
    getAll: (params?: LeadQueryParams) =>
        agent.get<ApiResult<PagedResult<Lead>>>('/leads', {
            params: {
                Page: params?.page ?? 1,
                PageSize: params?.pageSize ?? 20,
                Search: params?.search || undefined,
                Status: params?.status || undefined,
                Source: params?.source || undefined,
                ManagerId: params?.managerId || undefined,
            },
        }),

    getById: (id: number) =>
        agent.get<ApiResult<LeadDetails>>(`/leads/${id}`),

    create: (data: CreateLeadRequest) =>
        agent.post<ApiResult<Lead>>('/leads', data),

    update: (id: number, data: UpdateLeadRequest) =>
        agent.put<ApiResult<Lead>>(`/leads/${id}`, data),

    changeStatus: (id: number, data: ChangeLeadStatusRequest) =>
        agent.patch<ApiResult<Lead>>(`/leads/${id}/status`, data),

    assignManager: (id: number, managerId: number) =>
        agent.patch<ApiResult<Lead>>(`/leads/${id}/assign`, { managerId }),

    addActivity: (id: number, type: string, description: string) =>
        agent.post<ApiResult<LeadActivity>>(`/leads/${id}/activities`, { type, description }),

    delete: (id: number) =>
        agent.delete<ApiResult<boolean>>(`/leads/${id}`),
};

export default leadService;