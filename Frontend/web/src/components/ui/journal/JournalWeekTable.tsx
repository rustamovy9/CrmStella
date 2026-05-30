import React from 'react';
import { MessageSquare } from 'lucide-react';
import type {
    LessonResponse,
    AttendanceResponse,
    LessonScoreResponse,
    WeekResultResponse,
} from '../../../types/journal';

interface Student {
    id: number;
    name: string;
}

interface Props {
    weekNumber: number;
    lessons: LessonResponse[];
    students: Student[];
    attLookup: Record<string, AttendanceResponse>;
    scoreLookup: Record<string, LessonScoreResponse>;
    weekResults: WeekResultResponse[];
    saving: string | null;
    onAttToggle: (lessonId: number, studentId: number) => void;
    onScoreChange: (lessonId: number, studentId: number, weekNumber: number, score: number) => void;
    onCommentOpen: (lessonId: number, studentId: number, att?: AttendanceResponse) => void;
}

const fmtDate = (d: string) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
};

// Фирменные цвета порогов успеваемости из Omuz CRM
const sumStyle = (score: number) => {
    if (score >= 86) return { bg: '#E2F5EA', color: '#10B981' }; // Отлично
    if (score >= 60) return { bg: '#FFF1E6', color: '#F2994A' }; // Хорошо/Удовл
    return { bg: '#FCEBEB', color: '#EB5757' }; // Неуд
};

// Стили чекбоксов посещаемости из Omuz CRM
const attStyle = (status: string) => {
    switch (status) {
        case 'Present': return { bg: '#3B82F6', border: '#3B82F6', icon: '#fff' };
        case 'Late':    return { bg: '#F2994A', border: '#F2994A', icon: '#fff' };
        case 'Excused': return { bg: '#10B981', border: '#10B981', icon: '#fff' };
        default:        return { bg: '#fff',    border: '#CBD5E1', icon: 'transparent' };
    }
};

const JournalWeekTable: React.FC<Props> = ({
    weekNumber, lessons, students, attLookup, scoreLookup, weekResults,
    saving, onAttToggle, onScoreChange, onCommentOpen,
}) => {
    return (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            {/* Дополнительная стилизация для CRM-эффекта */}
            <style>{`
                .jt-table th, .jt-table td {
                    border: 1px solid #EFF2F5 !important;
                }
                .jt-row:hover td { 
                    background: #F8FAFC !important; 
                }
                .jt-select {
                    appearance: none;
                    -webkit-appearance: none;
                    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                    background-size: 11px;
                    padding-right: 24px !important;
                }
                .jt-select:focus {
                    border-color: #6366F1 !important;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                    outline: none;
                }
                .jt-checkbox-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .jt-comment-btn:hover {
                    color: #4F46E5 !important;
                    background: #EEF2FF !important;
                }
            `}</style>

            <table className="jt-table" style={s.table}>
                <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                        <th style={s.thStudent}>Студенты</th>
                        {lessons.map(l => (
                            <th key={l.id} colSpan={2} style={s.thLesson}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                    {/* Дата проведения */}
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: '6px' }}>
                                        {fmtDate(l.lessonDate)}
                                    </span>
                                    {/* Название/Тема урока */}
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '150px' }} title={(l as any).title || 'Без темы'}>
                                        {(l as any).title || 'Урок ' + l.id}
                                    </span>
                                    {/* Время урока */}
                                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8' }}>
                                        {(l as any).time || '18:00-20:00'}
                                    </span>
                                </div>
                            </th>
                        ))}
                        <th colSpan={4} style={s.thEnd}>Итоги недели</th>
                    </tr>
                    <tr style={{ background: '#F8FAFC' }}>
                        <th style={s.thSubStudent} />
                        {lessons.map(l => (
                            <React.Fragment key={l.id}>
                                <th style={s.thSubLesson}>Пос.</th>
                                <th style={s.thSubLesson}>Балл</th>
                            </React.Fragment>
                        ))}
                        <th style={s.thSubEnd}>Пос. %</th>
                        <th style={s.thSubEnd}>Бонус</th>
                        <th style={s.thSubEnd}>Экз.</th>
                        <th style={s.thSubEnd}>Итог</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length === 0 ? (
                        <tr>
                            <td colSpan={2 + lessons.length * 2 + 4} style={s.empty}>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#94A3B8' }}>Студенты не найдены</div>
                                <div style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '4px' }}>Добавьте учащихся в эту группу</div>
                            </td>
                        </tr>
                    ) : students.map((student, idx) => {
                        const wr = weekResults.find(w => w.studentId === student.id);
                        const sum = wr ? Math.round(wr.totalScore) : null;
                        const sumSt = sum !== null ? sumStyle(sum) : null;

                        const presentCount = lessons.filter(l => {
                            const att = attLookup[`${l.id}-${student.id}`];
                            return att?.status === 'Present';
                        }).length;
                        
                        const attPct = lessons.length > 0
                            ? Math.round((presentCount / lessons.length) * 100)
                            : 0;

                        return (
                            <tr key={student.id} className="jt-row">
                                {/* Имя студента */}
                                <td style={s.tdStudent}>
                                    <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '14.5px' }}>
                                        {idx + 1}. {student.name}
                                    </span>
                                </td>

                                {/* Ячейки посещаемости и оценок */}
                                {lessons.map(lesson => {
                                    const aKey = `${lesson.id}-${student.id}`;
                                    const att = attLookup[aKey];
                                    const sc = scoreLookup[aKey];
                                    const isSavingAtt = saving === `att-${aKey}`;
                                    const isSavingScore = saving === `score-${aKey}`;
                                    const hasComment = !!att?.absenceReason;
                                    const attSt = attStyle(att?.status ?? '');

                                    return (
                                        <React.Fragment key={lesson.id}>
                                            {/* Чекбокс Посещаемости (Крупный, удобный) */}
                                            <td style={s.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    <button
                                                        className="jt-comment-btn"
                                                        style={{
                                                            ...s.commentBtn,
                                                            color: hasComment ? '#4F46E5' : '#94A3B8',
                                                            background: hasComment ? '#EEF2FF' : 'transparent',
                                                        }}
                                                        title={att?.absenceReason ?? 'Добавить комментарий'}
                                                        onClick={() => onCommentOpen(lesson.id, student.id, att)}
                                                    >
                                                        <MessageSquare size={15} />
                                                    </button>
                                                    <button
                                                        className="jt-checkbox-btn"
                                                        style={{
                                                            ...s.checkbox,
                                                            background: attSt.bg,
                                                            borderColor: attSt.border,
                                                            opacity: isSavingAtt ? 0.5 : 1,
                                                        }}
                                                        onClick={() => !saving && onAttToggle(lesson.id, student.id)}
                                                        disabled={!!saving}
                                                    >
                                                        {att && (
                                                            <svg width="14" height="12" viewBox="0 0 10 8" fill="none">
                                                                <path d="M1 4L3.5 6.5L9 1" stroke={attSt.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Оценка (Увеличенный селект) */}
                                            <td style={s.td}>
                                                <select
                                                    className="jt-select"
                                                    style={{
                                                        ...s.scoreSelect,
                                                        opacity: isSavingScore ? 0.5 : 1,
                                                        color: sc?.score ? '#0F172A' : '#94A3B8',
                                                        fontWeight: sc?.score ? 700 : 500,
                                                    }}
                                                    value={sc?.score ?? ''}
                                                    disabled={!!saving}
                                                    onChange={e => {
                                                        const v = Number(e.target.value);
                                                        if (v > 0) onScoreChange(lesson.id, student.id, weekNumber, v);
                                                    }}
                                                >
                                                    <option value="">—</option>
                                                    {[1, 2, 3, 4, 5].map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </React.Fragment>
                                    );
                                })}

                                {/* Блок итогов */}
                                <td style={s.td}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: attPct < 50 ? '#EF4444' : '#334155' }}>
                                        {lessons.length > 0 ? `${attPct}%` : '—'}
                                    </span>
                                </td>
                                <td style={s.td}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                                        {wr?.bonusScore ? Math.round(wr.bonusScore) : '0'}
                                    </span>
                                </td>
                                <td style={s.td}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                                        {wr?.examScore ? Math.round(wr.examScore) : '0'}
                                    </span>
                                </td>
                                <td style={s.td}>
                                    {sum !== null && sumSt ? (
                                        <span style={{
                                            ...s.sumPill,
                                            background: sumSt.bg,
                                            color: sumSt.color,
                                        }}>
                                            {sum}
                                        </span>
                                    ) : (
                                        <span style={{ ...s.sumPill, background: '#F1F5F9', color: '#94A3B8' }}>—</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const s = {
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '14px',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    },
    thStudent: {
        padding: '16px 20px',
        textAlign: 'left' as const,
        fontSize: '13px',
        fontWeight: 700,
        color: '#1E293B',
        textTransform: 'uppercase' as const,
        background: '#F8FAFC',
        minWidth: '260px',
    } as React.CSSProperties,
    thLesson: {
        padding: '14px 10px',
        textAlign: 'center' as const,
        background: '#F8FAFC',
        minWidth: '150px',
    } as React.CSSProperties,
    thEnd: {
        padding: '16px',
        textAlign: 'center' as const,
        fontSize: '13px',
        fontWeight: 700,
        color: '#1E293B',
        textTransform: 'uppercase' as const,
        background: '#F8FAFC',
        minWidth: '260px',
    } as React.CSSProperties,
    thSubStudent: {
        padding: '10px 20px',
        background: '#F8FAFC',
    } as React.CSSProperties,
    thSubLesson: {
        padding: '8px',
        fontSize: '12px',
        fontWeight: 700,
        color: '#64748B',
        textAlign: 'center' as const,
        background: '#F8FAFC',
    } as React.CSSProperties,
    thSubEnd: {
        padding: '8px',
        fontSize: '12px',
        fontWeight: 700,
        color: '#64748B',
        textAlign: 'center' as const,
        background: '#F8FAFC',
    } as React.CSSProperties,
    tdStudent: {
        padding: '14px 20px',
        background: '#fff',
        verticalAlign: 'middle',
    } as React.CSSProperties,
    td: {
        padding: '8px 10px',
        textAlign: 'center' as const,
        verticalAlign: 'middle' as const,
        background: '#fff',
    } as React.CSSProperties,
    commentBtn: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '6px',
        transition: 'all 0.15s ease',
    } as React.CSSProperties,
    checkbox: {
        width: '26px',
        height: '26px',
        border: '2px solid #CBD5E1',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s ease',
        padding: 0,
    } as React.CSSProperties,
    scoreSelect: {
        width: '72px',
        padding: '8px 10px',
        border: '2px solid #E2E8F0',
        borderRadius: '10px',
        fontSize: '14.5px',
        background: '#fff',
        textAlign: 'center' as const,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    } as React.CSSProperties,
    sumPill: {
        display: 'inline-block',
        padding: '6px 14px',
        borderRadius: '8px',
        fontWeight: 700,
        fontSize: '14px',
        minWidth: '45px',
        textAlign: 'center' as const,
    } as React.CSSProperties,
    empty: {
        padding: '60px 20px',
        textAlign: 'center' as const,
    } as React.CSSProperties,
};

export default JournalWeekTable;