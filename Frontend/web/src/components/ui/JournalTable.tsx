import React from 'react';
import type { LessonResponse } from '../../api/lessonService';
import type { AttendanceListItemResponse } from '../../api/attendanceService';
import type { LessonScoreResponse } from '../../api/scoreService';

interface StudentRow {
    id: number;
    fullName: string;
}

interface JournalTableProps {
    students: StudentRow[];
    lessons: LessonResponse[];
    attendances: Record<number, AttendanceListItemResponse[]>; // key: lessonId
    scores: Record<number, LessonScoreResponse[]>;             // key: lessonId
    onAttendanceChange: (lessonId: number, studentId: number, present: boolean) => void;
    onScoreChange: (lessonId: number, studentId: number, score: number) => void;
}

export const JournalTable: React.FC<JournalTableProps> = ({
    students,
    lessons,
    attendances,
    scores,
    onAttendanceChange,
    onScoreChange
}) => {
    
    // Форматирование даты заголовка (например, "30.04.2026")
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#64748B', fontWeight: 600, minWidth: '220px' }}>
                            STUDENTS
                        </th>
                        {lessons.map((lesson) => (
                            <th key={lesson.id} colSpan={2} style={{ padding: '12px', borderLeft: '1px solid #E2E8F0', textAlign: 'center', color: '#1E293B' }}>
                                <div style={{ fontWeight: 700 }}>{formatDate(lesson.lessonDate)}</div>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 400, marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                    {lesson.title}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px', fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                                    <span>Att</span>
                                    <span>Score</span>
                                </div>
                            </th>
                        ))}
                        <th style={{ padding: '16px', borderLeft: '2px solid #CBD5E1', color: '#475569', fontWeight: 700, background: '#F1F5F9', textAlign: 'center' }}>
                            END OF WEEK
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student, idx) => {
                        let totalScore = 0;
                        let gradedLessonsCount = 0;

                        return (
                            <tr key={student.id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                                {/* Имя студента */}
                                <td style={{ padding: '14px 16px', fontWeight: 500, color: '#334155' }}>
                                    <span style={{ color: '#94A3B8', marginRight: '8px' }}>{idx + 1}.</span>
                                    {student.fullName}
                                </td>

                                {/* Динамические колонки уроков */}
                                {lessons.map((lesson) => {
                                    const lessonDetails = attendances[lesson.id] || [];
                                    const lessonScores = scores[lesson.id] || [];

                                    const attRecord = lessonDetails.find(a => a.studentId === student.id);
                                    const scoreRecord = lessonScores.find(s => s.studentId === student.id);

                                    // Посещаемость (проверяем статус бэкенда, например "Present" или "1")
                                    const isPresent = attRecord ? (attRecord.status === 'Present' || attRecord.status === '1') : false;
                                    const currentScore = scoreRecord?.score || 0;

                                    if (currentScore > 0) {
                                        totalScore += currentScore;
                                        gradedLessonsCount++;
                                    }

                                    return (
                                        <React.Fragment key={`${student.id}-${lesson.id}`}>
                                            {/* Чекбокс посещаемости */}
                                            <td style={{ padding: '8px', borderLeft: '1px solid #E2E8F0', textAlign: 'center', width: '50px' }}>
                                                <input 
                                                    type="checkbox"
                                                    checked={isPresent}
                                                    onChange={(e) => onAttendanceChange(lesson.id, student.id, e.target.checked)}
                                                    style={{ width: '16px', height: '16px', accentColor: '#4F46E5', cursor: 'pointer' }}
                                                />
                                            </td>
                                            {/* Селект оценки */}
                                            <td style={{ padding: '8px', paddingRight: '12px', textAlign: 'center', width: '70px' }}>
                                                <select
                                                    value={currentScore || ""}
                                                    onChange={(e) => onScoreChange(lesson.id, student.id, Number(e.target.value))}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #CBD5E1',
                                                        background: '#fff',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        color: currentScore ? '#1E293B' : '#94A3B8',
                                                        outline: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="">0_</option>
                                                    {[1, 2, 3, 4, 5].map(num => (
                                                        <option key={num} value={num}>{num}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </React.Fragment>
                                    );
                                })}

                                {/* Итоговая колонка за неделю */}
                                <td style={{ padding: '14px', borderLeft: '2px solid #CBD5E1', textAlign: 'center', background: '#F1F5F9', width: '100px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        background: '#E2E8F0',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        color: '#334155'
                                    }}>
                                        {gradedLessonsCount > 0 ? Math.round(totalScore / gradedLessonsCount) : 0}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};