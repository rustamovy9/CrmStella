// api/scheduleService.ts
import agent from './agent';
import type { ApiResult } from '../types/auth';
import type { PagedResult } from '../types/admin';
import type { ScheduleResponse, CreateScheduleRequest, UpdateScheduleRequest } from '../types/schedule';

export interface ScheduleQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    dayOfWeek?: number | string | null;
    groupId?: number | null;
}

const scheduleService = {
    getAll: (params?: ScheduleQueryParams) =>
        agent.get<ApiResult<PagedResult<ScheduleResponse>>>('/schedules', {
            params: {
                Page: params?.page ?? 1,
                PageSize: params?.pageSize ?? 6,
                Search: params?.search || undefined,
                DayOfWeek: params?.dayOfWeek ?? undefined,
                GroupId: params?.groupId || undefined
            }
        }),

    // ─── НОВЫЙ МЕТОД ДЛЯ ПОЛУЧЕНИЯ РАСПИСАНИЯ ПО ID ГРУППЫ ───
    // Обрати внимание: в URL добавляем /group/, как требует твой бэкенд
    getByGroupId: (groupId: number) => 
        agent.get<ApiResult<ScheduleResponse[]>>(`/schedules/group/${groupId}`),

    getById: (id: number) => agent.get<ApiResult<ScheduleResponse>>(`/schedules/${id}`),
    create: (data: CreateScheduleRequest) => agent.post<ApiResult<ScheduleResponse>>('/schedules', data),
    update: (id: number, data: UpdateScheduleRequest) => agent.put<ApiResult<ScheduleResponse>>(`/schedules/${id}`, data),
    delete: (id: number) => agent.delete<ApiResult<boolean>>(`/schedules/${id}`)
};

export default scheduleService;