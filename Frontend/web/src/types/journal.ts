// Lesson от бэка
export interface LessonResponse {
  id: number;
  groupId: number;
  groupName: string;
  weekNumber: number;
  orderIndex: number;
  title: string;
  description?: string;
  lessonDate: string;      // "2026-04-23T00:00:00"
  startTime: string;       // "09:00:00"
  endTime: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Attendance от бэка
export interface AttendanceResponse {
  id: number;
  lessonId: number;
  lessonTitle: string;
  studentId: number;
  studentFullName: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  absenceReason?: string;
  mentorNote?: string;
  markedByMentorId?: number;
  markedByMentorName?: string;
  markedAt: string;
  updatedAt?: string;
}

// LessonScore от бэка
export interface LessonScoreResponse {
  id: number;
  lessonId: number;
  lessonTitle: string;
  studentId: number;
  studentName: string;
  homeworkSubmissionId?: number;
  score: number;
  mentorFeedback?: string;
  scoredByMentorId?: number;
  scoredByMentorName?: string;
  scoredAt: string;
  updatedAt?: string;
}

// WeekResult от бэка
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
  createdAt: string;
  updatedAt?: string;
}

// Состав группы (уже есть у тебя, добавь если нет)
export interface GroupStudentResponse {
  id: number;
  groupId: number;
  groupName: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  removeReason?: string;
}

// Внутренние типы для UI журнала
export interface JournalCell {
  attendanceId?: number;
  scoreId?: number;
  status?: AttendanceResponse['status'];
  absenceReason?: string;
  mentorNote?: string;
  score?: number;
}

// Строка таблицы — один студент
export interface JournalRow {
  studentId: number;
  studentName: string;
  cells: Record<number, JournalCell>; // lessonId -> данные ячейки
  weekResult?: WeekResultResponse;
}