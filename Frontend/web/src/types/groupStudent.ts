export interface GroupStudentResponse {
    id: number;
    groupId: number;
    groupName: string;
    studentId: number;
    studentName: string;
    studentEmail: string;
    joinedAt: string;
    leftAt: string | null;
    isActive: boolean;
    removeReason: string | null;
}