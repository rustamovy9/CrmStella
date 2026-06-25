export interface GroupStudentResponse {
    id: number;
    groupId: number;
    groupName: string;
    studentId: number;
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    joinedAt: string;
    leftAt: string | null;
    isActive: boolean;
    isTransferred: boolean;
    removeReason: string | null;
    lastBilledAt: string | null;       // ← добавь
    nextBillingDate: string | null;    // ← добавь
}


export interface StudentGroupDetailsResponse {
    id: number;
    name: string;

    courseId: number;
    courseName: string;

    mentorId: number;
    mentorUserId: number;
    mentorName: string;

    startDate: string;
    endDate: string;

    maxStudents: number;
    activeStudentsCount: number;

    status: string;
    createdAt: string;

    scheduleSummary: string;

    students: GroupStudentResponse[];
}


export interface MentorGroupDetailsResponse {
    id: number;

    name: string;

    courseId: number;
    courseName: string;

    mentorId: number;
    mentorUserId: number;
    mentorName: string

    startDate: string;
    endDate: string;

    maxStudents: number;
    activeStudentsCount: number;

    status: string;
    createdAt: string;

    scheduleSummary: string;

    students: GroupStudentResponse[];
}
