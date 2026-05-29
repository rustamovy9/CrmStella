import axios from 'axios';

export interface AttendanceListItemResponse {
    id: number;
    studentId: number;
    studentFullName: string;
    status: string; // "Present", "Absent", etc.
    markedAt: string;
}

export interface CreateAttendanceRequest {
    lessonId: number;
    studentId: number;
    status: number; // Enum на бэкенде
    absenceReason?: string;
    mentorNote?: string;
}

export const attendanceService = {
    getByLessonId: (lessonId: number) => 
        axios.get<{ data: AttendanceListItemResponse[] }>(`/api/attendances/lesson/${lessonId}`),
        
    createOrUpdate: (request: CreateAttendanceRequest) => 
        axios.post('/api/attendances', request), // Твой метод Create проверяет Exists внутри

    bulkCreate: (request: { lessonId: number; students: { studentId: number; status: number }[] }) =>
        axios.post('/api/attendances/bulk', request)
};