import agent from './agent';
import type { ApiResult } from '../types/auth';

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const authService = {
    changePassword: (data: ChangePasswordRequest) =>
        agent.put<ApiResult<boolean>>('/auth/change-password', data),
};