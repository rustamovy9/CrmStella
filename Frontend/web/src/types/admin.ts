export interface StudentListItemResponse {
    name: any;
    status: string;
    id: number;
    userId: number;
    fullName: string;
    email: string;
    balance: number;
    isActive: boolean;
    avatarUrl ?: string | null;
}

export interface MentorListItemResponse {
    name: any;
    id: number;
    userId: number;
    fullName: string;
    email: string;
    specialization: string;
    experienceYears: number;
    isActive: boolean;
    avatarUrl ?: string | null;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface UserResponse {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}