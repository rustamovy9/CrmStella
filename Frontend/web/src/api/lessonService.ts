import axios from 'axios';

export interface LessonResponse {
    id: number;
    groupId: number;
    groupName: string;
    weekNumber: number;
    orderIndex: number;
    title: string;
    description?: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
    isCompleted: boolean;
}

export interface CreateLessonRequest {
    groupId: number;
    weekNumber: number;
    orderIndex: number;
    title: string;
    description?: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
}

export const lessonService = {
    getByGroupId: (groupId: number) => 
        axios.get<{ data: LessonResponse[] }>(`/api/lessons/group/${groupId}`),
    
    create: (request: CreateLessonRequest) => 
        axios.post<{ data: LessonResponse }>('/api/lessons', request),
        
    delete: (id: number) => 
        axios.delete(`/api/lessons/${id}`)
};