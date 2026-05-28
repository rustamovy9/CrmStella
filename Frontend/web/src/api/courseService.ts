import agent from './agent';
import type { ApiResult } from '../types/auth';
import type { CourseListItemResponse, CreateCourseData, PagedResult } from '../types/admin';

export interface CourseDetailResponse extends CourseListItemResponse {
    groupsCount: number;
    activeGroupsCount: number;
    totalStudentsCount: number;
}

export interface CourseQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean | null;
}

const courseService = {
    // ✅ Фильтрация и пагинация на бэкенде
    getAll: (params?: CourseQueryParams) =>
        agent.get<ApiResult<PagedResult<CourseListItemResponse>>>('/courses', {
            params: {
                Page: params?.page ?? 1,
                PageSize: params?.pageSize ?? 10,
                Search: params?.search || undefined,
                IsActive: params?.isActive ?? undefined
            }
        }),

    getById: (id: number) =>
        agent.get<ApiResult<CourseDetailResponse>>(`/courses/${id}`),

    create: (data: CreateCourseData) => {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        if (data.price !== undefined) formData.append('price', data.price.toString());
        if (data.durationWeeks !== undefined) formData.append('durationWeeks', data.durationWeeks.toString());
        if (data.icon) formData.append('icon', data.icon);

        return agent.post<ApiResult<CourseDetailResponse>>('/courses', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    setStatus: (id: number, isActive: boolean) =>
        agent.patch<ApiResult<boolean>>(`/courses/${id}/status`, { isActive }),

    update: (id: number, data: { name: string; description?: string; price: number; durationWeeks: number }) =>
        agent.put<ApiResult<CourseDetailResponse>>(`/courses/${id}`, data),

    updateIcon: (id: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return agent.patch<ApiResult<CourseDetailResponse>>(`/courses/${id}/icon`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export default courseService;