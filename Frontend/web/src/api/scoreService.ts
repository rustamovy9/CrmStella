import axios from 'axios';

export interface LessonScoreResponse {
    id: number;
    lessonId: number;
    studentId: number;
    score?: number;
    mentorFeedback?: string;
}

export const scoreService = {
    getByLessonId: (lessonId: number) => 
        axios.get<{ data: LessonScoreResponse[] }>(`/api/scores/lesson/${lessonId}`),
        
    saveScore: (request: { lessonId: number; studentId: number; score: number; mentorFeedback?: string }) => 
        axios.post('/api/scores', request) // Вызывает CreateAsync (внутри проверка на Exists)
};