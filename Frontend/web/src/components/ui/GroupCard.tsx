// components/ui/GroupCard.tsx
import React from 'react';
import { Users, Calendar, Clock, CheckCircle2, BookOpen, GraduationCap } from 'lucide-react';
import type { GroupListItemResponse } from '../../types/group';

interface GroupCardProps {
    group: GroupListItemResponse;
    onDetails: (id: number) => void;
    onStatusToggle: (id: number, currentStatus: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onDetails, onStatusToggle }) => {
    const isActive = group.status === 'Active';
    const freeSlots = (group.maxStudents ?? 0) - (group.activeStudentsCount ?? 0);

    return (
        <div style={styles.card} className="premium-group-card">
            <style>{`
                @keyframes smoothFadeIn {
                    from { opacity: 0; transform: scale(0.96) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .premium-group-card {
                    animation: smoothFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
                .premium-group-card:hover {
                    transform: translateY(-6px) scale(1.01);
                    border-color: #CBD5E1 !important;
                    box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.04) !important;
                }
                .btn-group-manage {
                    transition: all 0.2s ease;
                }
                .btn-group-manage:hover {
                    background-color: #4F46E5 !important;
                    color: #ffffff !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
                }
            `}</style>

            {/* Top row */}
            <div style={styles.topSection}>
                <span style={styles.categoryBadge}>Группа</span>
                <span style={styles.idBadge}>#{group.id}</span>
            </div>

            {/* Avatar + Title */}
            <div style={styles.mainContentRow}>
                <div style={styles.groupAvatar}>
                    <GraduationCap size={26} color="#ffffff" />
                </div>
                <div style={styles.metaContainer}>
                    <h4 style={styles.groupTitle}>{group.name}</h4>
                    <p style={styles.courseName}>{group.courseName || 'Курс не указан'}</p>
                </div>
            </div>

            {/* Info rows */}
            <div style={styles.infoSection}>
                <div style={styles.infoGrid}>
                    <div style={styles.infoRow}>
                        <Users size={14} color="#94A3B8" />
                        <span style={styles.infoText}>
                            Ментор: <strong>{group.mentorName || 'Не назначен'}</strong>
                        </span>
                    </div>

                    <div style={styles.infoRow}>
                        <CheckCircle2 size={14} color="#94A3B8" />
                        <span style={styles.infoText}>
                            Студенты: <strong>{group.activeStudentsCount} / {group.maxStudents}</strong>
                            <span style={{
                                marginLeft: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: freeSlots > 0 ? '#10B981' : '#EF4444'
                            }}>
                                ({freeSlots} своб.)
                            </span>
                        </span>
                    </div>
                </div>

                {/* Dates */}
                <div style={styles.datesBox}>
                    <div style={styles.dateItem}>
                        <Calendar size={13} color="#94A3B8" />
                        <div>
                            <div style={styles.dateLabel}>СТАРТ</div>
                            <div style={styles.dateValue}>
                                {group.startDate
                                    ? new Date(group.startDate).toLocaleDateString('ru-RU')
                                    : '—'}
                            </div>
                        </div>
                    </div>
                    <div style={styles.dateDivider} />
                    <div style={styles.dateItem}>
                        <Clock size={13} color="#94A3B8" />
                        <div>
                            <div style={styles.dateLabel}>ВЫПУСК</div>
                            <div style={styles.dateValue}>
                                {group.endDate
                                    ? new Date(group.endDate).toLocaleDateString('ru-RU')
                                    : '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div style={styles.bottomSection}>
                <div style={styles.statusWrapper}>
                    <div style={{ ...styles.statusDot, backgroundColor: isActive ? '#10B981' : '#F59E0B' }} />
                    <span style={styles.statusLabel}>{isActive ? 'Активна' : 'Архив'}</span>
                </div>

                <label style={styles.switch}>
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => onStatusToggle(group.id, group.status)}
                        style={styles.switchInput}
                    />
                    <span style={{ ...styles.slider, backgroundColor: isActive ? '#10B981' : '#CBD5E1' }}>
                        <span style={{ ...styles.sliderCircle, transform: isActive ? 'translateX(16px)' : 'translateX(0px)' }} />
                    </span>
                </label>

                <button
                    className="btn-group-manage"
                    style={styles.manageButton}
                    onClick={() => onDetails(group.id)}
                >
                    <BookOpen size={14} style={{ marginRight: '6px' }} />
                    Детали
                </button>
            </div>
        </div>
    );
};

const styles = {
    card: { background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', boxSizing: 'border-box' as const, gap: '4px' },
    topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    categoryBadge: { fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', backgroundColor: '#EEF2FF', color: '#4F46E5' },
    idBadge: { fontSize: '12px', fontWeight: 600, color: '#94A3B8' },
    mainContentRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
    groupAvatar: { width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', flexShrink: 0 },
    metaContainer: { display: 'flex', flexDirection: 'column' as const, gap: '4px', flex: 1 },
    groupTitle: { margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A', lineHeight: '1.3' },
    courseName: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: 500 },
    infoSection: { display: 'flex', flexDirection: 'column' as const, gap: '14px', marginBottom: '20px', flex: 1 },
    infoGrid: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    infoText: { fontSize: '13px', fontWeight: 500, color: '#64748B' },
    datesBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '12px 14px' },
    dateItem: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
    dateDivider: { width: '1px', height: '28px', backgroundColor: '#E2E8F0' },
    dateLabel: { fontSize: '10px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    dateValue: { fontSize: '13px', fontWeight: 600, color: '#334155' },
    bottomSection: { display: 'flex', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #F8FAFC', gap: '10px' },
    statusWrapper: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
    statusLabel: { fontSize: '13px', fontWeight: 600, color: '#334155' },
    switch: { position: 'relative' as const, display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer', flexShrink: 0 },
    switchInput: { opacity: 0, width: 0, height: 0 },
    slider: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, borderRadius: '34px', transition: '0.2s', display: 'flex', alignItems: 'center', padding: '0 3px' },
    sliderCircle: { height: '16px', width: '16px', borderRadius: '50%', backgroundColor: 'white', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
    manageButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }
};

export default GroupCard;