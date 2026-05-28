import React, { useState } from 'react';
import { UserPlus, BookOpen, Calendar, GraduationCap, Plus } from 'lucide-react';

export interface GroupDto {
    id: number;
    name: string;
    courseId?: number;
    courseName?: string;
    status?: string;
    mentorName?: string;
    schedule?: string | null;
    startDate?: string;
    endDate?: string;
}

interface ActionCardsProps {
    group: GroupDto;
    onNavigate: (path: string) => void;
    onEnrollClick: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({ group, onNavigate, onEnrollClick }) => {
    // Проверка наличия расписания
    const hasSchedule = !!(group.schedule || (group.startDate && group.endDate));

    // Функция для форматирования дат без лишних миллисекунд (как на скриншоте Flutter 1)
    const formatScheduleDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('ru-RU');
    };

    return (
        <div style={sc.grid}>
            {/* Карточка 1: Зачислить */}
            <CardWrapper onClick={onEnrollClick} hoverColor="#4F46E5">
                <div className="icon-box" style={{ ...sc.iconBox, backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                    <UserPlus size={22} />
                </div>
                <div style={sc.cardContent}>
                    <h4 style={sc.cardTitle}>Зачислить студента</h4>
                    <p style={sc.cardDesc}>Быстрое добавление в поток по ID аккаунта</p>
                </div>
            </CardWrapper>

            {/* Карточка 2: Журнал */}
            <CardWrapper onClick={() => onNavigate(`/admin/groups/${group.id}/journal`)} hoverColor="#10B981">
                <div className="icon-box" style={{ ...sc.iconBox, backgroundColor: '#E6F4EA', color: '#10B981' }}>
                    <BookOpen size={22} />
                </div>
                <div style={sc.cardContent}>
                    <h4 style={sc.cardTitle}>Журнал группы</h4>
                    <p style={sc.cardDesc}>{group.courseName || 'Успеваемость и посещаемость'}</p>
                </div>
            </CardWrapper>

            {/* Карточка 3: Расписание занятия */}
            <CardWrapper 
                onClick={hasSchedule ? () => onNavigate(`/admin/groups/${group.id}/schedule`) : undefined} 
                hoverColor="#F59E0B"
                style={!hasSchedule ? { cursor: 'default' } : {}}
            >
                <div className="icon-box" style={{ ...sc.iconBox, backgroundColor: '#FFF7ED', color: '#F59E0B' }}>
                    <Calendar size={22} />
                </div>
                <div style={sc.cardContent}>
                    <h4 style={sc.cardTitle}>Расписание занятий</h4>
                    {hasSchedule ? (
                        <p style={sc.cardDesc}>
                            {group.schedule || `${formatScheduleDate(group.startDate)} - ${formatScheduleDate(group.endDate)}`}
                        </p>
                    ) : (
                        <button 
                            style={sc.addScheduleBtn}
                            onClick={(e) => {
                                e.stopPropagation(); // Предотвращаем клик по карточке
                                onNavigate(`/admin/groups/${group.id}/schedule/create`);
                            }}
                        >
                            <Plus size={14} /> Добавить расписание
                        </button>
                    )}
                </div>
            </CardWrapper>

            {/* Карточка 4: Преподаватель */}
            <CardWrapper onClick={() => onNavigate(`/admin/mentors`)} hoverColor="#8B5CF6">
                <div className="icon-box" style={{ ...sc.iconBox, backgroundColor: '#F5F3FF', color: '#8B5CF6' }}>
                    <GraduationCap size={22} />
                </div>
                <div style={sc.cardContent}>
                    <h4 style={sc.cardTitle}>Преподаватель</h4>
                    <p style={sc.cardDesc}>{group.mentorName || 'Ментор не назначен'}</p>
                </div>
            </CardWrapper>
        </div>
    );
};

/* Вспомогательный мини-компонент оболочки карточки 
  для реализации чистых анимаций наведения без внешних CSS файлов
*/
const CardWrapper: React.FC<{ onClick?: () => void; hoverColor: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ onClick, hoverColor, children, style }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                ...sc.card,
                ...(hovered ? {
                    transform: 'translateY(-4px)',
                    borderColor: hoverColor,
                    boxShadow: '0 12px 20px -8px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.01)'
                } : {}),
                ...style
            }}
        >
            {children}
        </div>
    );
};

// --- СТИЛИ ПОВЫШЕННОЙ КРАСОТЫ ---
const sc = {
    // Широкая адаптивная сетка (минимум 260px для каждой карточки)
    grid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '20px', 
        margin: '24px 0' 
    },
    // Просторная карточка с мягкими углами и плавным переходом анимации
    card: { 
        backgroundColor: '#FFFFFF', 
        border: '1px solid #E2E8F0', 
        borderRadius: '16px', 
        padding: '20px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '18px', 
        cursor: 'pointer', 
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', 
        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.02)' 
    },
    // Увеличенные боксы иконок
    iconBox: { 
        width: '48px', 
        height: '48px', 
        borderRadius: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        transition: 'transform 0.2s ease'
    },
    cardContent: { 
        display: 'flex', 
        flexDirection: 'column' as const, 
        gap: '4px', 
        flex: 1 
    },
    cardTitle: { 
        margin: 0, 
        fontSize: '16px', 
        fontWeight: 700, 
        color: '#0F172A',
        letterSpacing: '-0.01em'
    },
    cardDesc: { 
        margin: 0, 
        fontSize: '13px', 
        color: '#64748B', 
        lineHeight: '1.45',
        fontWeight: 400
    },
    // Стильная оранжевая кнопка создания расписания
    addScheduleBtn: {
        marginTop: '6px',
        border: 'none',
        backgroundColor: '#FFEDD5',
        color: '#EA580C',
        padding: '6px 14px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        width: 'fit-content',
        transition: 'all 0.15s ease',
    }
};