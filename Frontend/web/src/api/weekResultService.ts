import axios from 'axios';

export interface WeekResultResponse {
    id: number;
    studentId: number;
    studentName: string;
    groupId: number;
    groupName: string;
    weekNumber: number;
    lessonAverageScore: number;
    homeworkAverageScore: number;
    attendanceScore: number;
    bonusScore: number;
    examScore: number;
    totalScore: number;
    mentorComment?: string;
}

export interface RecalculateWeekRequest {
    studentId: number;
    groupId: number;
    weekNumber: number;
}

export const weekResultService = {
    getByGroupAndWeek: (groupId: number, weekNumber: number) =>
        axios.get<{ data: WeekResultResponse[] }>(`/api/week-results/group/${groupId}/week/${weekNumber}`),
        
    recalculate: (request: RecalculateWeekRequest) =>
        axios.post<{ data: WeekResultResponse }>('/api/week-results/recalculate', request),
        
    setComment: (id: number, comment: string) =>
        axios.patch<{ data: WeekResultResponse }>(`/api/week-results/${id}/comment`, { comment })
};