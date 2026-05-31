import agent from './agent';
import type { ApiResult } from '../types/auth';
import type { LessonResponse } from '../types/journal';

interface CreateLessonRequest {
    groupId: number;
    weekNumber: number;
    orderIndex: number;
    title: string;
    description: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
}

interface UpdateLessonRequest {
    id: number;
    groupId: number;
    weekNumber: number;
    orderIndex: number;
    title: string;
    description: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
    isCompleted: boolean;
}

export const lessonService = {
    getAll: () =>
        agent.get<ApiResult<LessonResponse[]>>('/lessons'),

    getById: (id: number) =>
        agent.get<ApiResult<LessonResponse>>(`/lessons/${id}`),

    getByGroup: (groupId: number) =>
        agent.get<ApiResult<LessonResponse[]>>(`/lessons/group/${groupId}`),

    create: (data: CreateLessonRequest) =>
        agent.post<ApiResult<LessonResponse>>('/lessons', data),

    update: (data: UpdateLessonRequest) =>
        agent.put<ApiResult<LessonResponse>>('/lessons', data),

    delete: (id: number) =>
        agent.delete<ApiResult<boolean>>(`/lessons/${id}`),
};