import React from 'react';
import { Clock, MapPin, Calendar, Users, Edit3, Trash2 } from 'lucide-react';
import type { ScheduleResponse } from '../../types/schedule';

interface ScheduleCardProps {
    item: ScheduleResponse;
    onEdit: (item: ScheduleResponse) => void;
    onDelete: (id: number, groupName: string) => void;
    onNavigateToGroup: (groupId: number) => void;
}

// Карта для конфигурации дней недели (строка -> данные для UI)
const DAY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; iconBg: string }> = {
    Monday: { label: 'Понедельник', bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', iconBg: '#0284C7' },
    Tuesday: { label: 'Вторник', bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF', iconBg: '#8B5CF6' },
    Wednesday: { label: 'Среда', bg: '#E2F0D9', text: '#385723', border: '#C5E0B4', iconBg: '#4CAF50' },
    Thursday: { label: 'Четверг', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', iconBg: '#D97706' },
    Friday: { label: 'Пятница', bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8', iconBg: '#EC4899' },
    Saturday: { label: 'Суббота', bg: '#E0F2F1', text: '#004D40', border: '#B2DFDB', iconBg: '#009688' },
    Sunday: { label: 'Воскресенье', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', iconBg: '#EF4444' }
};

const ScheduleCard: React.FC<ScheduleCardProps> = ({ item, onEdit, onDelete, onNavigateToGroup }) => {
    
    const formatTime = (timeStr: string) => {
        if (!timeStr) return '—';
        return timeStr.substring(0, 5); // Отрезаем секунды "10:00:00" -> "10:00"
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('ru-RU');
    };

    // Берем конфиг для текущего дня или дефолтный, если придет что-то странное
    const dayStyle = DAY_CONFIG[item.dayOfWeek] || { 
        label: item.dayOfWeek, bg: '#F1F5F9', text: '#334155', border: '#E2E8F0', iconBg: '#64748B' 
    };

    return (
        <div style={styles.card} className="premium-schedule-card">
            <style>{`
                @keyframes smoothFadeIn {
                    from { opacity: 0; transform: scale(0.96) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .premium-schedule-card {
                    animation: smoothFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
                .premium-schedule-card:hover {
                    transform: translateY(-6px) scale(1.01);
                    border-color: #CBD5E1 !important;
                    box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.04) !important;
                }
                .btn-schedule-action {
                    transition: all 0.2s ease;
                }
                .btn-schedule-action:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }
            `}</style>

            {/* Top row */}
            <div style={styles.topSection}>
                <span style={{
                    ...styles.categoryBadge,
                    backgroundColor: dayStyle.bg,
                    color: dayStyle.text,
                    border: `1px solid ${dayStyle.border}`
                }}>
                    {dayStyle.label}
                </span>
                <span style={styles.idBadge}>#{item.id}</span>
            </div>

            {/* Avatar + Title */}
            <div style={styles.mainContentRow}>
                <div style={{ ...styles.groupAvatar, backgroundColor: dayStyle.iconBg }}>
                    <Clock size={24} color="#ffffff" />
                </div>
                <div style={styles.metaContainer}>
                    <h4 style={styles.groupTitle}>{item.groupName || `Группа #${item.groupId}`}</h4>
                    <p style={styles.courseName}>
                        <MapPin size={13} color="#94A3B8" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        {item.room || 'Кабинет не указан'}
                    </p>
                </div>
            </div>

            {/* Info rows */}
            <div style={styles.infoSection}>
                <div style={styles.infoGrid}>
                    <div style={styles.infoRow}>
                        <Clock size={14} color="#4F46E5" />
                        <span style={styles.infoText}>
                            Время занятий: <strong style={{ color: '#4F46E5' }}>{formatTime(item.startTime)} — {formatTime(item.endTime)}</strong>
                        </span>
                    </div>
                </div>

                {/* Dates Box */}
                <div style={styles.datesBox}>
                    <div style={styles.dateItem}>
                        <Calendar size={13} color="#94A3B8" />
                        <div>
                            <div style={styles.dateLabel}>ПЕРИОД С</div>
                            <div style={styles.dateValue}>{formatDate(item.recurringFrom)}</div>
                        </div>
                    </div>
                    <div style={styles.dateDivider} />
                    <div style={styles.dateItem}>
                        <Calendar size={13} color="#94A3B8" />
                        <div>
                            <div style={styles.dateLabel}>ОКОНЧАНИЕ</div>
                            <div style={styles.dateValue}>
                                {item.recurringTo ? formatDate(item.recurringTo) : 'Бессрочно'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div style={styles.bottomSection}>
                <button
                    className="btn-schedule-action"
                    style={styles.groupButton}
                    onClick={() => onNavigateToGroup(item.groupId)}
                >
                    <Users size={14} style={{ marginRight: '6px' }} />
                    Группа
                </button>

                <div style={styles.actionButtonsGroup}>
                    <button
                        className="btn-schedule-action"
                        style={styles.editButton}
                        onClick={() => onEdit(item)}
                        title="Редактировать"
                    >
                        <Edit3 size={14} color="#4F46E5" />
                    </button>
                    <button
                        className="btn-schedule-action"
                        style={styles.deleteButton}
                        onClick={() => onDelete(item.id, item.groupName)}
                        title="Удалить"
                    >
                        <Trash2 size={14} color="#EF4444" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    card: { background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', boxSizing: 'border-box' as const, gap: '4px' },
    topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    categoryBadge: { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '8px', letterSpacing: '0.02em', textTransform: 'uppercase' as const },
    idBadge: { fontSize: '12px', fontWeight: 600, color: '#94A3B8' },
    mainContentRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
    groupAvatar: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    metaContainer: { display: 'flex', flexDirection: 'column' as const, gap: '4px', flex: 1 },
    groupTitle: { margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A', lineHeight: '1.3' },
    courseName: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center' },
    infoSection: { display: 'flex', flexDirection: 'column' as const, gap: '14px', marginBottom: '20px', flex: 1 },
    infoGrid: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    infoText: { fontSize: '13px', fontWeight: 500, color: '#64748B' },
    datesBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px 14px', border: '1px solid #F1F5F9' },
    dateItem: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
    dateDivider: { width: '1px', height: '28px', backgroundColor: '#E2E8F0' },
    dateLabel: { fontSize: '9px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.5px' },
    dateValue: { fontSize: '12px', fontWeight: 600, color: '#334155', marginTop: '2px' },
    bottomSection: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #F8FAFC', gap: '10px' },
    groupButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF', color: '#4F46E5', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
    actionButtonsGroup: { display: 'flex', gap: '8px' },
    editButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF', border: 'none', borderRadius: '10px', width: '34px', height: '34px', cursor: 'pointer' },
    deleteButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', border: 'none', borderRadius: '10px', width: '34px', height: '34px', cursor: 'pointer' }
};

export default ScheduleCard;