export interface UserInfo {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
    avatarUrl: string | null;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: UserInfo;
}

export interface ApiResult<T> {
    items: ApiResult<import("./admin").PagedResult<import("./admin").StudentListItemResponse>>;
    iconUrl: any;
    isSuccess: boolean;
    data: T;         
    error?: string | null;
    message?: string | null;
}