import agent from './agent';
import type { ApiResult } from '../types/auth';

export interface ProfileResponse {
    id: number;
    userId: number;
    fullName?: string;
    email?: string;
    avatarUrl?: string;
    dateOfBirth?: string;
    address?: string;
    telegramUsername?: string;
    linkedInUrl?: string;
    githubUrl?: string;
    aboutMe?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateProfileRequest {
    aboutMe?: string;
    dateOfBirth?: string;
    address?: string;
    telegramUsername?: string;
    linkedInUrl?: string;
    githubUrl?: string;
}

export const profileService = {
    getMe: () =>
        agent.get<ApiResult<ProfileResponse>>('/profiles/me'),

    getByUserId: (userId: number) =>
        agent.get<ApiResult<ProfileResponse>>(`/profiles/${userId}`),

    create: (data: UpdateProfileRequest) =>
        agent.post<ApiResult<ProfileResponse>>('/profiles', data),

    update: (data: UpdateProfileRequest) =>
        agent.put<ApiResult<ProfileResponse>>('/profiles', data),

    setAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return agent.patch<ApiResult<ProfileResponse>>('/profiles/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};