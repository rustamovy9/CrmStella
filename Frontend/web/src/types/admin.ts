export interface StudentListItemResponse {
    id: number;
    userId: number;
    fullName: string;
    email: string;
    balance: number;
    isActive: boolean;
    avatarUrl?: string | null;
    enrolledAt: string;
}

export interface MentorListItemResponse {
    id: number;
    userId: number;
    fullName: string;
    email: string;
    specialization: string;
    experienceYears: number;
    isActive: boolean;
    avatarUrl?: string | null;
}

export interface PagedResult<T> {
    data: import("./group").GroupListItemResponse[];
    items: T[];
    totalCount: number;
    totalPages: number; 
    page: number;
    pageSize: number;
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

export interface UserDetailResponse {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    role: string;
    isActive: boolean;
    isPasswordSet: boolean;
    createdAt: string;
    updatedAt: string | null;

    avatarUrl?: string | null;
    aboutMe?: string | null;
    telegramUsername?: string | null;
    githubUrl?: string | null;

    studentId?: number | null;
    mentorId?: number | null;

    balance?: number | null;
    enrolledAt?: string | null;

    specialization?: string | null;
    experienceYears?: number | null;
    hireDate?: string | null;
}

// Запросы на обновление (DTOs)
export interface UpdateUserRequest {
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
}

export interface UpdateStudentRequest {
    balance?: number;
    enrolledAt?: string;
}

export interface UpdateMentorRequest {
    specialization?: string;
    experienceYears?: number;
    hireDate?: string;
}

export interface CourseListItemResponse {
    studentsCount: number;
    id: number;
    name: string;
    description: string | null;
    price: number;
    iconUrl: string | null;
    durationWeeks: number;
    isActive: boolean;
    groupsCount: number;
    activeGroupsCount: number;
    totalStudentsCount: number;
    createdAt: string;
}

export interface CreateCourseData {
    name: string;
    description?: string;
    price: number;
    durationWeeks: number;
    icon?: File | null;
}