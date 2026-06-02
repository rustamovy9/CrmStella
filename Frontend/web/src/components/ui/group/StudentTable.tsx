import React from 'react';
import { UserMinus, MoveRight, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { ChargeStudentButton } from '../billing/ChargeStudentButton';

export interface GroupStudentResponse {
    id: number;
    groupId: number;
    groupName: string;
    studentId: number;
    studentName: string;
    studentEmail: string;
    joinedAt: string;
    leftAt: string | null;
    isActive: boolean;
    isTransferred: boolean;
    removeReason: string | null;
    lastBilledAt: string | null;
    nextBillingDate: string | null;
}

interface StudentTableProps {
    students: GroupStudentResponse[];
    groupId: number;
    groupStatus: string;
    onRemove: (id: number) => void;
    onTransfer: (id: number) => void;
    onCharged: () => void;
}

const getLeaveType = (s: GroupStudentResponse) => {
    if (s.isActive) return 'active';
    if (s.isTransferred) return 'transferred';
    return 'removed';
};

const isCoursePaid = (s: GroupStudentResponse): boolean => {
    if (!s.nextBillingDate) return false;
    return new Date(s.nextBillingDate) > new Date();
};

const getDaysUntilNextBilling = (s: GroupStudentResponse): number => {
    if (!s.nextBillingDate) return 0;
    return Math.ceil(
        (new Date(s.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
};

const canCharge = (s: GroupStudentResponse, groupStatus: string): boolean => {
    return (
        groupStatus === 'Active' &&
        s.isActive &&
        !s.leftAt &&
        !isCoursePaid(s)
    );
};

export const StudentTable: React.FC<StudentTableProps> = ({
    students,
    groupId,
    groupStatus,
    onRemove,
    onTransfer,
    onCharged,
}) => {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? dateStr : parsed.toLocaleDateString('ru-RU');
    };

    return (
        <div style={st.wrapper}>
            {/* Добавляем немного интерактивного лоска кнопкам через стили */}
            <style>{`
                .btn-action {
                    transition: all 0.2s ease;
                }
                .btn-action:hover:not(:disabled) {
                    transform: translateY(-1px);
                    filter: brightness(0.95);
                }
                .btn-action:disabled {
                    opacity: 0.6;
                }
            `}</style>

            <table style={st.table}>
                <thead>
                    <tr style={st.thRow}>
                        <th style={st.th}>Студент</th>
                        <th style={st.th}>Email</th>
                        <th style={st.th}>Дата зачисления</th>
                        <th style={st.th}>Статус</th>
                        <th style={st.th}>Причина ухода</th>
                        <th style={{ ...st.th, textAlign: 'center' }}>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={st.empty}>
                                В этой секции студентов не найдено
                            </td>
                        </tr>
                    ) : (
                        students.map((s) => {
                            const leaveType = getLeaveType(s);
                            const paid = isCoursePaid(s);
                            const daysLeft = paid ? getDaysUntilNextBilling(s) : 0;

                            return (
                                <tr key={s.id} style={st.tr}>
                                    {/* Студент */}
                                    <td style={st.td}>
                                        <div style={st.studentCell}>
                                            <div style={st.avatar}>
                                                {s.studentName?.trim().charAt(0).toUpperCase() ?? 'S'}
                                            </div>
                                            <div>
                                                <div style={st.name}>{s.studentName || 'Без имени'}</div>
                                                <div style={st.sub}>ID: #{s.studentId}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td style={st.td}>{s.studentEmail || '—'}</td>

                                    {/* Дата зачисления */}
                                    <td style={st.td}>{formatDate(s.joinedAt)}</td>

                                    {/* Статус */}
                                    <td style={st.td}>
                                        {leaveType === 'active' && (
                                            <span style={{ ...st.badge, backgroundColor: '#E6F4EA', color: '#137333' }}>
                                                Активен
                                            </span>
                                        )}
                                        {leaveType === 'transferred' && (
                                            <span style={{ ...st.badge, backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                                                Переведён
                                            </span>
                                        )}
                                        {leaveType === 'removed' && (
                                            <span style={{ ...st.badge, backgroundColor: '#FCE8E6', color: '#C5221F' }}>
                                                Исключён
                                            </span>
                                        )}
                                    </td>

                                    {/* Причина ухода */}
                                    <td style={{ ...st.td, color: '#70757a', fontStyle: 'italic' }}>
                                        {leaveType === 'transferred'
                                            ? s.removeReason || `Переведён ${formatDate(s.leftAt)}`
                                            : leaveType === 'removed'
                                                ? s.removeReason || 'Исключён из группы'
                                                : '—'}
                                    </td>

                                    {/* Действия */}
                                    <td style={st.td}>
                                        <div style={st.actions}>
                                            {leaveType === 'active' ? (
                                                <>
                                                    {/* Исключить */}
                                                    <button
                                                        className="btn-action"
                                                        style={{ ...st.btn, color: '#EF4444', backgroundColor: '#FEF2F2' }}
                                                        title="Исключить"
                                                        onClick={() => onRemove(s.id)}
                                                    >
                                                        <UserMinus size={15} />
                                                    </button>

                                                    {/* Перевести в другую группу (Блокируется, если не оплачен) */}
                                                    <button
                                                        className="btn-action"
                                                        style={{ 
                                                            ...st.btn, 
                                                            color: paid ? '#3B82F6' : '#94A3B8', 
                                                            backgroundColor: paid ? '#EFF6FF' : '#F1F5F9',
                                                            cursor: paid ? 'pointer' : 'not-allowed',
                                                            border: paid ? 'none' : '1px solid #E2E8F0'
                                                        }}
                                                        title={paid ? "Перевести в другую группу" : "Перевод заблокирован: курс не оплачен"}
                                                        onClick={() => paid && onTransfer(s.id)}
                                                        disabled={!paid}
                                                    >
                                                        <MoveRight size={15} />
                                                    </button>

                                                    {/* Оплата курса */}
                                                    {paid ? (
                                                        <div
                                                            style={st.paidBadge}
                                                            title={`Следующий платёж через ${daysLeft} дн. (${formatDate(s.nextBillingDate)})`}
                                                        >
                                                            <CheckCircle size={14} color="#15803D" />
                                                            <span style={st.paidText}>
                                                                Оплачен · {daysLeft}д
                                                            </span>
                                                        </div>
                                                    ) : canCharge(s, groupStatus) ? (
                                                        <ChargeStudentButton
                                                            studentId={s.studentId}
                                                            groupId={groupId}
                                                            studentName={s.studentName}
                                                            onCharged={onCharged}
                                                        />
                                                    ) : (
                                                        <span
                                                            style={st.sub}
                                                            title="Списание недоступно: группа завершена или срок истёк"
                                                        >
                                                            Недоступно
                                                        </span>
                                                    )}
                                                </>
                                            ) : leaveType === 'transferred' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <ArrowRightLeft size={14} color="#3B82F6" />
                                                    <span style={{ ...st.sub, color: '#3B82F6', fontWeight: 500 }}>Переведён</span>
                                                </div>
                                            ) : (
                                                <span style={st.sub}>
                                                    Удалён {formatDate(s.leftAt)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

const st = {
    wrapper: {
        overflowX: 'auto' as const,
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        textAlign: 'left' as const,
    },
    thRow: {
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
    },
    th: {
        padding: '16px 20px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#64748B',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    tr: { borderBottom: '1px solid #F1F5F9' },
    td: {
        padding: '16px 20px',
        fontSize: '14px',
        color: '#334155',
        verticalAlign: 'middle' as const,
    },
    studentCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatar: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#EEF2FF',
        color: '#4F46E5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: '14px',
        flexShrink: 0,
    },
    name: { fontWeight: 600, color: '#0F172A' },
    sub: { fontSize: '11px', color: '#94A3B8' },
    badge: {
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
    },
    actions: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btn: {
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paidBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 10px',
        backgroundColor: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: '8px',
        cursor: 'default',
    } as React.CSSProperties,
    paidText: {
        fontSize: '12px',
        fontWeight: 500,
        color: '#15803D',
        whiteSpace: 'nowrap' as const,
    },
    empty: {
        padding: '32px',
        textAlign: 'center' as const,
        color: '#94A3B8',
        fontSize: '14px',
    },
};