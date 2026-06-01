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
    isTransferred: boolean;
    removeReason: string | null;
    lastBilledAt: string | null;       // ← добавь
    nextBillingDate: string | null;    // ← добавь
}