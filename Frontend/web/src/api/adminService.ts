import agent from './agent';
import type { ApiResult } from '../types/auth';
import type {
    StudentListItemResponse,
    MentorListItemResponse,
    UserResponse,
    UserDetailResponse,
    PagedResult,
    UpdateUserRequest,
    UpdateStudentRequest,
    UpdateMentorRequest
} from '../types/admin';

const adminService = {
    // ================= AUTH / REGISTRATION =================
    registerUser: async (data: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        roleId: number
    }) => {
        return await agent.post('/auth/register', data);
    },

    // ================= USERS API =================
    getUsers: () =>
        agent.get<ApiResult<UserResponse[]>>('/users'),

    getUserById: (id: number) =>
        agent.get<ApiResult<UserDetailResponse>>(`/users/${id}`),

    updateUser: (id: number, data: UpdateUserRequest) =>
        agent.put<ApiResult<UserDetailResponse>>(`/users/${id}`, data),

    setUserActiveStatus: (id: number, isActive: boolean) =>
        agent.patch<ApiResult<boolean>>(`/users/${id}/set-active`, null, {
            params: { isActive }
        }),

    deleteUser: (id: number) =>
        agent.delete<ApiResult<boolean>>(`/users/${id}`),

    // ✅ Upload avatar через userId (Profile привязан к User)
    uploadAvatar: (_userId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return agent.patch<ApiResult<any>>(
            `/profiles/avatar`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );
    },

    // ================= STUDENTS API =================
    getStudents: (
        page = 1,
        pageSize = 10,
        search?: string,
        isActive?: boolean | null,
        groupId?: number
    ) => {
        return agent.get<ApiResult<PagedResult<StudentListItemResponse>>>('/students', {
            params: {
                Page: page,
                PageSize: pageSize,
                Search: search || undefined,
                IsActive: isActive ?? undefined,
                GroupId: groupId
            }
        });
    },

    getStudentById: (studentId: number) =>
        agent.get<ApiResult<any>>(`/students/${studentId}`),

    // ✅ studentId - это ID из таблицы Students, не userId!
    updateStudentBusinessData: (studentId: number, data: UpdateStudentRequest) =>
        agent.put<ApiResult<any>>(`/students/${studentId}`, data),

    // ✅ studentId - это ID из таблицы Students, не userId!
    setStudentStatus: (studentId: number, isActive: boolean) =>
        agent.patch<ApiResult<boolean>>(`/students/${studentId}/status`, { isActive }),

    // ================= MENTORS API =================
    getMentors: (
        page = 1,
        pageSize = 10,
        search?: string,
        isActive?: boolean | null,
        specialization?: string
    ) => {
        return agent.get<ApiResult<PagedResult<MentorListItemResponse>>>('/mentors', {
            params: {
                Page: page,
                PageSize: pageSize,
                Search: search || undefined,
                IsActive: isActive ?? undefined,
                Specialization: specialization || undefined
            }
        });
    },

    getMentorById: (mentorId: number) =>
        agent.get<ApiResult<any>>(`/mentors/${mentorId}`),

    // ✅ mentorId - это ID из таблицы Mentors, не userId!
    updateMentorBusinessData: (mentorId: number, data: UpdateMentorRequest) =>
        agent.put<ApiResult<any>>(`/mentors/${mentorId}`, data),

    // ✅ mentorId - это ID из таблицы Mentors, не userId!
    setMentorStatus: (mentorId: number, isActive: boolean) =>
        agent.patch<ApiResult<boolean>>(`/mentors/${mentorId}/status`, { isActive })
};

export default adminService;