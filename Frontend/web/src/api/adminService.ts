import agent from './agent';
import type { ApiResult } from '../types/auth';
import type { StudentListItemResponse, MentorListItemResponse, UserResponse } from '../types/admin';

const adminService = {
    // Получить всех студентов
    getStudents: () => 
        agent.get<ApiResult<StudentListItemResponse[]>>('/students'),

    // Получить всех менторов
    getMentors: () => 
        agent.get<ApiResult<MentorListItemResponse[]>>('/mentors'),

    // Получить всех пользователей системы
    getUsers: () => 
        agent.get<ApiResult<UserResponse[]>>('/users'),

    // Изменить статус активности студента
    setStudentStatus: (id: number, isActive: boolean) => 
        agent.patch<ApiResult<boolean>>(`/students/${id}/status`, { isActive }),

    // [НОВОЕ] Изменить статус активности общего пользователя
    setUserStatus: (id: number, isActive: boolean) => 
        agent.patch<ApiResult<boolean>>(`/users/${id}/status`, { isActive }),

    // [НОВОЕ] Удалить пользователя из системы
    deleteUser: (id: number) => 
        agent.delete<ApiResult<boolean>>(`/users/${id}`),
};

export default adminService;