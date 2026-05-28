import agent from './agent'; 
import type { ApiResult } from '../types/auth';
import type { GroupStudentResponse } from '../types/groupStudent'; // Импортируем тип студента группы

const API_URL = '/group-students'; 

export const groupStudentService = {
    // 🛠️ ИСПРАВЛЕНО: Запрос идет на /group-students/group/{id} и возвращает массив студентов
    getById: async (groupId: number): Promise<GroupStudentResponse[]> => {
        const response = await agent.get<ApiResult<GroupStudentResponse[]>>(`${API_URL}/group/${groupId}`);
        // Возвращаем массив студентов, распаковывая ApiResult
        return response.data.data || []; 
    },

    // [HttpPost("enroll")] — ЗАЧИСЛЕНИЕ СТУДЕНТА
    enrollStudent: async (groupId: number, studentId: number): Promise<boolean> => {
        const response = await agent.post<ApiResult<boolean>>(`${API_URL}/enroll`, {
            groupId,
            studentId
        });
        return response.data.isSuccess;
    },

    // [HttpPost("remove")]
    removeStudent: async (groupStudentId: number, removeReason: string): Promise<boolean> => {
        const response = await agent.post<ApiResult<boolean>>(`${API_URL}/remove`, {
            groupStudentId,
            removeReason
        });
        return response.data.isSuccess;
    }
};