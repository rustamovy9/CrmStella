// api/journalService.ts
import agent from './agent';
import type { ApiResult } from '../types/auth';
import type {
    LessonResponse,
    AttendanceResponse,
    LessonScoreResponse,
    WeekResultResponse
} from '../types/journal';

export const journalService = {
    getLessonsByGroup: (groupId: number) =>
        agent.get<ApiResult<LessonResponse[]>>(`/lessons/group/${groupId}`),

    getAttendanceByLesson: (lessonId: number) =>
        agent.get<ApiResult<AttendanceResponse[]>>(`/attendances/lesson/${lessonId}`),

    getScoresByLesson: (lessonId: number) =>
        agent.get<ApiResult<LessonScoreResponse[]>>(`/lesson-scores/lesson/${lessonId}`),

    getWeekResults: (groupId: number, weekNumber: number) =>
        agent.get<ApiResult<WeekResultResponse[]>>(`/week-results/group/${groupId}/week/${weekNumber}`),

    createAttendance: (data: {
        lessonId: number;
        studentId: number;
        status: number;
        absenceReason?: string;
        mentorNote?: string;
    }) => agent.post<ApiResult<AttendanceResponse>>('/attendances', data),

    updateAttendance: (id: number, data: {
        status: number;
        absenceReason?: string;
        mentorNote?: string;
    }) => agent.put<ApiResult<AttendanceResponse>>(`/attendances/${id}`, data),

    createLessonScore: (data: {
        lessonId: number;
        studentId: number;
        score: number;
        mentorFeedback?: string;
    }) => agent.post<ApiResult<LessonScoreResponse>>('/lesson-scores', data),

    updateLessonScore: (id: number, data: {
        score: number;
        mentorFeedback?: string;
    }) => agent.put<ApiResult<LessonScoreResponse>>(`/lesson-scores/${id}`, data),

    recalculateWeekResult: (data: {
        studentId: number;
        groupId: number;
        weekNumber: number;
    }) => agent.post<ApiResult<WeekResultResponse>>('/week-results/recalculate', data),
};