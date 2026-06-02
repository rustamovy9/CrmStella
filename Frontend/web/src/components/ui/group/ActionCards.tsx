import React, { useState } from 'react';
import { UserPlus, BookOpen, Calendar, GraduationCap, ChevronRight, Plus, Clock } from 'lucide-react';

export interface GroupDto {
    id: number;
    name: string;
    courseId?: number;
    courseName?: string;
    status?: string;
    mentorId?: number;
    mentorUserId?: number;
    mentorName?: string;
    schedule?: string | null;
    startDate?: string;
    endDate?: string;
}

interface TodaySchedule {
    startTime: string;
    endTime: string;
    room?: string;
}

interface ActionCardsProps {
    group: GroupDto;
    todaySchedule?: TodaySchedule | null;
    todayDayName?: string;
    onNavigate: (path: string) => void;
    onEnrollClick: () => void;
    onAddScheduleClick: () => void;
}

interface CardProps {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle?: React.ReactNode;
    arrow?: boolean;
    onClick?: () => void;
    accent?: string;
}

const Card: React.FC<CardProps> = ({ icon, iconBg, iconColor, title, subtitle, arrow = true, onClick, accent = '#4F46E5' }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#fff',
                border: `1px solid ${hovered && onClick ? accent : '#E2E8F0'}`,
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: hovered && onClick
                    ? `0 8px 24px -6px ${accent}22`
                    : '0 1px 3px rgba(15,23,42,0.04)',
                transform: hovered && onClick ? 'translateY(-2px)' : 'none',
                flex: 1,
                minWidth: 0,
            }}
        >
            <div style={{
                width: 44, height: 44, borderRadius: '12px',
                background: iconBg, color: iconColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'transform 0.2s ease',
                transform: hovered && onClick ? 'scale(1.08)' : 'scale(1)',
            }}>
                {icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>
                    {title}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                    {subtitle}
                </div>
            </div>

            {arrow && onClick && (
                <ChevronRight size={16} color={hovered ? accent : '#CBD5E1'} style={{ flexShrink: 0, transition: 'color 0.2s ease' }} />
            )}
        </div>
    );
};

export const ActionCards: React.FC<ActionCardsProps> = ({
    group, todaySchedule,
    onNavigate, onEnrollClick, onAddScheduleClick
}) => {
    const hasSchedule = !!group.schedule && group.schedule.trim() !== '';
    const SHORT_DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const getTodayShort = () => SHORT_DAYS[new Date().getDay()];

    // Subtitle для карточки расписания
    let scheduleSubtitle: React.ReactNode;

    if (todaySchedule) {
        scheduleSubtitle = (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0F172A', fontWeight: 700 }}>
                <Clock size={11} color="#10B981" />
                {getTodayShort()} · {todaySchedule.startTime}–{todaySchedule.endTime}
                {todaySchedule.room && <span style={{ color: '#64748B', fontWeight: 500 }}> · {todaySchedule.room}</span>}
            </span>
        );
    } else {
        scheduleSubtitle = (
            <span
                onClick={(e) => {
                    e.stopPropagation();
                    onAddScheduleClick();
                }}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    color: '#EA580C', fontWeight: 600, cursor: 'pointer',
                    background: '#FFF7ED', padding: '2px 8px', borderRadius: '6px',
                    fontSize: '11px',
                }}
            >
                <Plus size={11} /> Добавить на сегодня
            </span>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            margin: '20px 0',
        }}>
            <Card
                icon={<UserPlus size={20} />}
                iconBg="#EEF2FF" iconColor="#4F46E5"
                title="Зачислить студента"
                subtitle="Быстрое добавление в поток по ID аккаунта"
                accent="#4F46E5"
                onClick={onEnrollClick}
            />
            <Card
                icon={<BookOpen size={20} />}
                iconBg="#ECFDF5" iconColor="#10B981"
                title="Журнал группы"
                subtitle={group.courseName || 'Успеваемость и посещаемость'}
                accent="#10B981"
                onClick={() => onNavigate(`/admin/groups/${group.id}/journal`)}
            />
            <Card
                icon={<Calendar size={20} />}
                iconBg="#FFF7ED" iconColor="#F59E0B"
                title="Расписание занятий"
                subtitle={scheduleSubtitle}
                accent="#F59E0B"
                onClick={hasSchedule ? () => onNavigate(`/admin/schedules`) : onAddScheduleClick}
                arrow={hasSchedule}
            />
            <Card
                icon={<GraduationCap size={20} />}
                iconBg="#F5F3FF" iconColor="#8B5CF6"
                title="Преподаватель"
                subtitle={group.mentorName || 'Ментор не назначен'}
                accent="#8B5CF6"
                onClick={() => {
                    if (group.mentorUserId) {
                        onNavigate(`/admin/users/${group.mentorUserId}`);
                    } else {
                        onNavigate('/admin/mentors');
                    }
                }}
            />
        </div>
    );
};