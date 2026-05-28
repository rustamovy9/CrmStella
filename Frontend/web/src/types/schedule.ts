export interface ScheduleResponse {
    id: number;
    groupId: number;
    groupName: string;
    dayOfWeek: string;        // "Monday", "Tuesday"...
    startTime: string;        // "10:00:00"
    endTime: string;          // "12:00:00"
    room: string | null;
    recurringFrom: string;    // ISO дата
    recurringTo: string | null;
}

export interface CreateScheduleRequest {
    groupId: number;
    dayOfWeek: number;     
    startTime: string;
    endTime: string;
    room?: string;
    recurringFrom: string;
    recurringTo?: string;
}

export interface UpdateScheduleRequest {
    dayOfWeek: number;      
    startTime: string;
    endTime: string;
    room?: string;
    recurringTo?: string;
}