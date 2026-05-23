export interface StudentListItemResponse {
    name: any;
    status: string;
    id: number;
    userId: number;
    fullName: string;
    email: string;
    balance: number;
    isActive: boolean;
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