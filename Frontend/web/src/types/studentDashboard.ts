import type { GroupListItemResponse } from "./group";

export interface StudentDashboardScoreResponse {
    lessonName: string;
    score: number;
    comment: string | null;
    date: string;
}

export interface StudentDashboardResponse {
    averageScore: number;
    attendancePercent: number;

    activeGroups: number;
    completedGroups: number;

    absences: number;
    lateMinutes: number;
    totalGroups: number;

    recentScores: StudentDashboardScoreResponse[];
    groups: GroupListItemResponse[];
}