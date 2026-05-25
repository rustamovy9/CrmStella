import agent from './agent';
import type { ApiResult } from '../types/auth';
import type { StudentListItemResponse, MentorListItemResponse, UserResponse, PagedResult } from '../types/admin';

const adminService = {
    registerUser: async (data: { firstName: string; lastName: string; email: string; phoneNumber: string; roleId: number }) => {
        return await agent.post('/auth/register', data);
    },
    getStudents: (
        page: number = 1,
        pageSize: number = 10,
        search?: string,
        isActive?: boolean | null,
        groupId?: number
    ) => {
        return agent.get<ApiResult<PagedResult<StudentListItemResponse>>>('/students', {
            params: {
                Page: page,
                PageSize: pageSize,
                Search: search || undefined,
                IsActive: isActive,
                GroupId: groupId
            }
        });
    },

    getMentors: (
        page: number = 1,
        pageSize: number = 10,
        search?: string,
        isActive?: boolean | null,
        specialization?: string
    ) => {
        return agent.get<ApiResult<PagedResult<MentorListItemResponse>>>('/mentors', {
            params: {
                Page: page,
                PageSize: pageSize,
                Search: search || undefined,
                IsActive: isActive,
                Specialization: specialization || undefined
            }
        });
    },


    getUsers: () =>
        agent.get<ApiResult<UserResponse[]>>('/users'),

    // Изменить статус активности студента
    setStudentStatus: (id: number, isActive: boolean) =>
        agent.patch<ApiResult<boolean>>(`/students/${id}/status`, { isActive }),

    // Изменить статус активности ментора
    setMentorStatus: (id: number, isActive: boolean) =>
        agent.patch<ApiResult<boolean>>(`/mentors/${id}/status`, { isActive }),

    // [НОВОЕ] Изменить статус активности общего пользователя
    setUserStatus: (id: number, isActive: boolean) =>
        agent.patch<ApiResult<boolean>>(`/users/${id}/status`, { isActive }),

    // [НОВОЕ] Удалить пользователя из системы
    deleteUser: (id: number) =>
        agent.delete<ApiResult<boolean>>(`/users/${id}`),

};

export default adminService;