export interface GroupListItemResponse {
    id: number;
    name: string;
    courseId: number;
    courseName: string;
    mentorId: number;
    mentorName: string;
    startDate: string;
    endDate: string;
    maxStudents: number;
    activeStudentsCount: number;
    freeSlots: number;
    status: string; // Обычно 'Active', 'Completed', и т.д.
    createdAt: string;
}

// Добавь это в твой файл типов ../types/group
export interface GroupResponse {
    id: number;
    name: string;
    courseId: number;
    courseName: string;
    mentorId: number;
    mentorName: string;
    startDate: string;
    endDate: string;
    maxStudents: number;
    activeStudentsCount: number;
    freeSlots: number;
    status: string;
    createdAt: string;
    schedule?: string | null; // Для кнопки расписания
}

export interface CreateGroupRequest {
    name: string;
    courseId: number;
    mentorId: number;
    startDate: string;
    endDate: string;
    maxStudents: number;
}

export interface UpdateGroupRequest {
    name?: string;
    mentorId?: number;
    startDate?: string;
    endDate?: string;
    maxStudents?: number;
}