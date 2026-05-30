import React from 'react';
import { UserMinus, MoveRight, ArrowRightLeft } from 'lucide-react';

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
}

interface StudentTableProps {
    students: GroupStudentResponse[];
    onRemove: (groupStudentId: number) => void;
    onTransfer: (id: number) => void;
}

// ✅ Определяем тип ухода по removeReason
const getLeaveType = (s: GroupStudentResponse) => {
    if (s.isActive) return 'active';
    if (s.isTransferred) return 'transferred';  // ✅ Точный флаг с бэкенда
    return 'removed';
};

export const StudentTable: React.FC<StudentTableProps> = ({ students, onRemove, onTransfer }) => {

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? dateStr : parsed.toLocaleDateString('ru-RU');
    };

    return (
        <div style={st.wrapper}>
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
                            <td colSpan={6} style={st.empty}>В этой секции студентов не найдено</td>
                        </tr>
                    ) : (
                        students.map((s) => {
                            const leaveType = getLeaveType(s);
                            return (
                                <tr key={s.id} style={st.tr}>
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

                                    <td style={st.td}>{s.studentEmail || '—'}</td>

                                    <td style={st.td}>{formatDate(s.joinedAt)}</td>

                                    {/* ✅ Статус с тремя вариантами */}
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

                                    {/* ✅ Причина с понятным текстом для переведённых */}
                                    <td style={{ ...st.td, color: '#70757a', fontStyle: 'italic' }}>
                                        {leaveType === 'transferred'
                                            ? `Переведён ${formatDate(s.leftAt)}`
                                            : leaveType === 'removed'
                                                ? s.removeReason || '—'
                                                : '—'}
                                    </td>

                                    {/* ✅ Действия */}
                                    <td style={st.td}>
                                        <div style={st.actions}>
                                            {leaveType === 'active' ? (
                                                <>
                                                    <button
                                                        style={{ ...st.btn, color: '#EF4444', backgroundColor: '#FEF2F2' }}
                                                        title="Исключить"
                                                        onClick={() => onRemove(s.id)}
                                                    >
                                                        <UserMinus size={15} />
                                                    </button>
                                                    <button
                                                        style={{ ...st.btn, color: '#3B82F6', backgroundColor: '#EFF6FF' }}
                                                        title="Перевести в другую группу"
                                                        onClick={() => onTransfer(s.id)}
                                                    >
                                                        <MoveRight size={15} />
                                                    </button>
                                                </>
                                            ) : leaveType === 'transferred' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <ArrowRightLeft size={14} color="#3B82F6" />
                                                    <span style={{ ...st.sub, color: '#3B82F6' }}>Переведён</span>
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
    wrapper: { overflowX: 'auto' as const, backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
    table: { width: '100%', borderCollapse: 'collapse' as const, textAlign: 'left' as const },
    thRow: { backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
    th: { padding: '16px 20px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    tr: { borderBottom: '1px solid #F1F5F9' },
    td: { padding: '16px 20px', fontSize: '14px', color: '#334155', verticalAlign: 'middle' },
    studentCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' },
    name: { fontWeight: 600, color: '#0F172A' },
    sub: { fontSize: '11px', color: '#94A3B8' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 },
    actions: { display: 'flex', gap: '8px', justifyContent: 'center' },
    btn: { border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    empty: { padding: '32px', textAlign: 'center' as const, color: '#94A3B8', fontSize: '14px' }
};