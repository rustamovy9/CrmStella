// api/groupStudentService.ts
import agent from './agent'; 
import type { ApiResult } from '../types/auth';
import type { GroupStudentResponse } from '../types/groupStudent';

const API_URL = '/group-students'; 

export const groupStudentService = {
    getById: async (groupId: number): Promise<GroupStudentResponse[]> => {
        const response = await agent.get<ApiResult<GroupStudentResponse[]>>(`${API_URL}/group/${groupId}`);
        return response.data.data || []; 
    },

    enrollStudent: async (groupId: number, studentId: number): Promise<boolean> => {
        const response = await agent.post<ApiResult<boolean>>(`${API_URL}/enroll`, {
            groupId,
            studentId
        });
        return response.data.isSuccess;
    },

    removeStudent: async (groupStudentId: number, removeReason: string): Promise<boolean> => {
        const response = await agent.post<ApiResult<boolean>>(`${API_URL}/remove`, {
            groupStudentId,
            removeReason
        });
        return response.data.isSuccess;
    },

    // 🚀 ДОБАВЛЕНО: Трансфер (перевод) студента в другую группу
    transferStudent: async (groupStudentId: number, targetGroupId: number): Promise<boolean> => {
        const response = await agent.post<ApiResult<boolean>>(`${API_URL}/transfer`, {
            groupStudentId,
            targetGroupId
        });
        return response.data.isSuccess;
    }
};