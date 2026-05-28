import React from 'react';
import { UserMinus, MoveRight } from 'lucide-react';

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
    removeReason: string | null;
}

interface StudentTableProps {
    students: GroupStudentResponse[];
    onRemove: (groupStudentId: number) => void;
    onTransfer: (id: number) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({ students, onRemove, onTransfer }) => {
    
    // Безопасный парсер дат, чтобы некорректный формат с бэкенда не ломал UI
    const formatDate = (dateStr: string) => {
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
                            <td colSpan={6} style={st.empty}>
                                В этой секции студентов не найдено
                            </td>
                        </tr>
                    ) : (
                        students.map((s) => (
                            <tr key={s.id} style={st.tr}>
                                <td style={st.td}>
                                    <div style={st.studentCell}>
                                        <div style={st.avatar}>
                                            {s.studentName ? s.studentName.trim().charAt(0).toUpperCase() : 'S'}
                                        </div>
                                        <div>
                                            {/* Защита на случай, если бэкенд вернул null/undefined в полях */}
                                            <div style={st.name}>{s.studentName || 'Без имени'}</div>
                                            <div style={st.sub}>ID Студента: #{s.studentId || s.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={st.td}>{s.studentEmail || '—'}</td>
                                <td style={st.td}>{formatDate(s.joinedAt)}</td>
                                <td style={st.td}>
                                    <span style={{ 
                                        ...st.badge, 
                                        backgroundColor: s.isActive ? '#E6F4EA' : '#FCE8E6', 
                                        color: s.isActive ? '#137333' : '#C5221F' 
                                    }}>
                                        {s.isActive ? 'Активен' : 'Исключен'}
                                    </span>
                                </td>
                                <td style={{ ...st.td, color: '#70757a', fontStyle: 'italic' }}>
                                    {s.removeReason || '—'}
                                </td>
                                <td style={st.td}>
                                    <div style={st.actions}>
                                        {s.isActive ? (
                                            <>
                                                <button 
                                                    style={{ ...st.btn, color: '#EF4444', backgroundColor: '#FEF2F2' }} 
                                                    title="Исключить (RemoveAsync)" 
                                                    onClick={() => onRemove(s.id)}
                                                >
                                                    <UserMinus size={15} />
                                                </button>
                                                <button 
                                                    style={{ ...st.btn, color: '#3B82F6', backgroundColor: '#EFF6FF' }} 
                                                    title="Перевести (TransferAsync)" 
                                                    onClick={() => onTransfer(s.id)}
                                                >
                                                    <MoveRight size={15} />
                                                </button>
                                            </>
                                        ) : (
                                            <span style={st.sub}>
                                                Удалён {formatDate(s.leftAt || '')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
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
    tr: { borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s' },
    td: { padding: '16px 20px', fontSize: '14px', color: '#334155', verticalAlign: 'middle' },
    studentCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' },
    name: { fontWeight: 600, color: '#0F172A' },
    sub: { fontSize: '11px', color: '#94A3B8' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 },
    actions: { display: 'flex', gap: '8px', justifyContent: 'center' },
    btn: { border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.1s, opacity 0.2s' },
    empty: { padding: '32px', textAlign: 'center' as const, color: '#94A3B8', fontSize: '14px' }
};