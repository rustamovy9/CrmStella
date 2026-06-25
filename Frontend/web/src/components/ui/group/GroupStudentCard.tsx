import React from 'react';
import {
    Users,
    Calendar,
    Clock,
    CheckCircle2,
    BookOpen,
    GraduationCap,
} from 'lucide-react';
import type { GroupListItemResponse } from '../../../types/group';

interface GroupCardProps {
    group: GroupListItemResponse;
    onDetails: (id: number) => void;
}

const GroupStudentCard: React.FC<GroupCardProps> = ({
    group,
    onDetails,
}) => {
    const isActive = group.status === 'Active';

    return (
        <div style={styles.card} className="premium-group-card">
            <style>{`
                @keyframes smoothFadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.98) translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .premium-group-card {
                    animation: smoothFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }

                .premium-group-card:hover {
                    transform: translateY(-4px);
                    border-color: #E2E8F0 !important;
                    box-shadow:
                        0 12px 20px -4px rgba(79, 70, 229, 0.08),
                        0 4px 8px -4px rgba(79, 70, 229, 0.04) !important;
                }

                .btn-group-manage {
                    transition: all 0.2s ease;
                }

                .btn-group-manage:hover {
                    background-color: #4F46E5 !important;
                    color: #FFFFFF !important;
                    border-color: #4F46E5 !important;
                }
            `}</style>

            {/* Top */}
            <div style={styles.topSection}>
                <span style={styles.categoryBadge}>
                    Группа
                </span>

                <span style={styles.idBadge}>
                    #{group.id}
                </span>
            </div>

            {/* Avatar + Title */}
            <div style={styles.mainContentRow}>
                <div style={styles.groupAvatar}>
                    <GraduationCap
                        size={24}
                        color="#FFFFFF"
                    />
                </div>

                <div style={styles.metaContainer}>
                    <h4 style={styles.groupTitle}>
                        {group.name}
                    </h4>

                    <p style={styles.courseName}>
                        {group.courseName ??
                            'Курс не указан'}
                    </p>
                </div>
            </div>

            {/* Info */}
            <div style={styles.infoSection}>
                <div style={styles.infoGrid}>
                    <div style={styles.infoRow}>
                        <Users
                            size={14}
                            color="#94A3B8"
                        />

                        <span style={styles.infoText}>
                            Ментор:{' '}
                            <strong>
                                {group.mentorName ??
                                    'Не назначен'}
                            </strong>
                        </span>
                    </div>

                    <div style={styles.infoRow}>
                        <CheckCircle2
                            size={14}
                            color="#94A3B8"
                        />

                        <span style={styles.infoText}>
                            Студентов:{' '}
                            <strong>
                                {group.activeStudentsCount}
                            </strong>
                        </span>
                    </div>
                </div>

                {/* Dates */}
                <div style={styles.datesBox}>
                    <div style={styles.dateItem}>
                        <Calendar
                            size={13}
                            color="#94A3B8"
                        />

                        <div>
                            <div style={styles.dateLabel}>
                                СТАРТ
                            </div>

                            <div style={styles.dateValue}>
                                {group.startDate
                                    ? new Date(
                                          group.startDate
                                      ).toLocaleDateString(
                                          'ru-RU'
                                      )
                                    : '—'}
                            </div>
                        </div>
                    </div>

                    <div style={styles.dateDivider} />

                    <div style={styles.dateItem}>
                        <Clock
                            size={13}
                            color="#94A3B8"
                        />

                        <div>
                            <div style={styles.dateLabel}>
                                ВЫПУСК
                            </div>

                            <div style={styles.dateValue}>
                                {group.endDate
                                    ? new Date(
                                          group.endDate
                                      ).toLocaleDateString(
                                          'ru-RU'
                                      )
                                    : '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div style={styles.bottomSection}>
                <div
                    style={{
                        ...styles.statusBadge,
                        backgroundColor:
                            isActive
                                ? '#ECFDF5'
                                : '#F8FAFC',
                        color: isActive
                            ? '#059669'
                            : '#64748B',
                        border: isActive
                            ? '1px solid #A7F3D0'
                            : '1px solid #E2E8F0',
                    }}
                >
                    {isActive
                        ? 'Активная'
                        : 'Архив'}
                </div>

                <button
                    className="btn-group-manage"
                    style={styles.manageButton}
                    onClick={() =>
                        onDetails(group.id)
                    }
                >
                    <BookOpen
                        size={14}
                        style={{
                            marginRight: '6px',
                        }}
                    />
                    Подробнее
                </button>
            </div>
        </div>
    );
};

const styles = {
    card: {
        background: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        boxShadow:
            '0 4px 6px -1px rgba(0,0,0,0.01)',
        boxSizing: 'border-box' as const,
        gap: '4px',
    },

    topSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },

    categoryBadge: {
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '20px',
        backgroundColor: '#EEF2FF',
        color: '#4F46E5',
    },

    idBadge: {
        fontSize: '12px',
        fontWeight: 600,
        color: '#94A3B8',
    },

    mainContentRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '14px',
    },

    groupAvatar: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        flexShrink: 0,
    },

    metaContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
        flex: 1,
    },

    groupTitle: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 700,
        color: '#0F172A',
        lineHeight: '1.3',
    },

    courseName: {
        margin: 0,
        fontSize: '13px',
        color: '#64748B',
        fontWeight: 500,
    },

    infoSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
        marginBottom: '16px',
        flex: 1,
    },

    infoGrid: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '6px',
    },

    infoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },

    infoText: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#64748B',
    },

    datesBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#F8FAFC',
        borderRadius: '12px',
        padding: '10px 12px',
    },

    dateItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
    },

    dateDivider: {
        width: '1px',
        height: '24px',
        backgroundColor: '#E2E8F0',
    },

    dateLabel: {
        fontSize: '9px',
        fontWeight: 600,
        color: '#94A3B8',
        letterSpacing: '0.5px',
    },

    dateValue: {
        fontSize: '12px',
        fontWeight: 600,
        color: '#334155',
    },

    bottomSection: {
        display: 'flex',
        alignItems: 'center',
        paddingTop: '14px',
        borderTop: '1px solid #F1F5F9',
        gap: '8px',
    },

    statusBadge: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 14px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
    },

    manageButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        color: '#4F46E5',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '8px 16px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        flexShrink: 0,
    },
};

export default GroupStudentCard;