export interface Lead {
    id: number;
    fullName: string;
    phone: string;
    email: string | null;
    source: string;
    status: string;
    interestedCourseId: number | null;
    interestedCourseName: string | null;
    assignedManagerId: number | null;
    assignedManagerName: string | null;
    notes: string | null;
    nextFollowUpAt: string | null;
    convertedToStudentId: number | null;
    lostReason: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface LeadActivity {
    id: number;
    userId: number;
    userFullName: string;
    type: string;
    description: string;
    createdAt: string;
}

export interface LeadDetails extends Lead {
    activities: LeadActivity[];
}

export interface CreateLeadRequest {
    fullName: string;
    phone: string;
    email?: string;
    source: number;
    interestedCourseId?: number;
    notes?: string;
}

export interface UpdateLeadRequest {
    fullName?: string;
    phone?: string;
    email?: string;
    source?: number;
    interestedCourseId?: number;
    notes?: string;
    nextFollowUpAt?: string;
}

export interface ChangeLeadStatusRequest {
    status: number;
    comment?: string;
    lostReason?: string;
}

export interface LeadQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: number | null;
    source?: number | null;
    managerId?: number | null;
}

export const LEAD_STATUS = {
    New: 1,
    Contacted: 2,
    Qualified: 3,
    TrialScheduled: 4,
    TrialCompleted: 5,
    Converted: 6,
    Lost: 7,
} as const;

export const LEAD_SOURCE = {
    Instagram: 1,
    Website: 2,
    Telegram: 3,
    Referral: 4,
    WalkIn: 5,
    Phone: 6,
    Other: 99,
} as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
    New: 'Новый',
    Contacted: 'Связались',
    Qualified: 'Квалифицирован',
    TrialScheduled: 'Записан на пробное',
    TrialCompleted: 'Прошёл пробное',
    Converted: 'Стал студентом',
    Lost: 'Потерян',
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
    Instagram: 'Instagram',
    Website: 'Сайт',
    Telegram: 'Telegram',
    Referral: 'По рекомендации',
    WalkIn: 'Пришёл сам',
    Phone: 'Звонок',
    Other: 'Другое',
};

export const LEAD_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    New: { bg: '#EEF2FF', color: '#4F46E5' },
    Contacted: { bg: '#E0F2FE', color: '#0369A1' },
    Qualified: { bg: '#FEF3C7', color: '#D97706' },
    TrialScheduled: { bg: '#FCE7F3', color: '#BE185D' },
    TrialCompleted: { bg: '#DDD6FE', color: '#7C3AED' },
    Converted: { bg: '#D1FAE5', color: '#065F46' },
    Lost: { bg: '#FEE2E2', color: '#B91C1C' },
};