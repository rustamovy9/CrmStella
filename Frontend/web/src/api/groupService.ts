import agent from './agent';
import type { ApiResult } from '../types/auth';
import type { PagedResult } from '../types/admin';
import type { CreateGroupRequest, GroupListItemResponse, GroupResponse, UpdateGroupRequest } from '../types/group';

export interface GroupQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    courseId?: number | null;
    mentorId?: number | null;
    status?: string | null;
}

const groupService = {
    // Фильтрация и пагинация на бэкенде
    getAll: (params?: GroupQueryParams) =>
        agent.get<ApiResult<PagedResult<GroupListItemResponse>>>('/groups', {
            params: {
                Page: params?.page ?? 1,
                PageSize: params?.pageSize ?? 10,
                Search: params?.search || undefined,
                CourseId: params?.courseId || undefined,
                MentorId: params?.mentorId || undefined,
                Status: params?.status || undefined
            }
        }),

    // Получение одной группы по ID
    getById: (id: number) =>
        agent.get<ApiResult<GroupResponse>>(`/groups/${id}`),

    create: (data: CreateGroupRequest) =>
        agent.post<ApiResult<GroupResponse>>('/groups', data),

    update: (id: number, data: UpdateGroupRequest) =>
        agent.put<ApiResult<GroupResponse>>(`/groups/${id}`, data),

    setStatus: (id: number, status: number) =>
        agent.patch<ApiResult<boolean>>(`/groups/${id}/status`, { status })
};

export default groupService;