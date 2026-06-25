import React from 'react';
import type {
    LessonResponse,
    AttendanceResponse,
    LessonScoreResponse,
    WeekResultResponse,
} from '../../../types/journal';

interface Student {
    id: number;
    name: string;
    isActive?: boolean;
}

interface Props {
    lessons: LessonResponse[];
    students: Student[];

    attLookup: Record<string, AttendanceResponse>;
    scoreLookup: Record<string, LessonScoreResponse>;

    weekResults: WeekResultResponse[];
}

const fmtDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const isPresent = (status: any) => {
    if (!status) return false;
    const s = String(status).toLowerCase();
    return s === 'present' || s === 'late' || s === '1';
};

const sumPillStyle = (score: number) => {
    if (score >= 86) return { bg: '#12B76A', color: '#FFFFFF' };
    if (score >= 70) return { bg: '#F79009', color: '#FFFFFF' };
    return { bg: '#F04438', color: '#FFFFFF' };
};




const StudentGroupJournalWeekTable: React.FC<Props> = ({
    lessons, students, attLookup, scoreLookup, weekResults,
}) => {
    return (
        <div className="w-full" style={s.container}>
            <style>{`
                .omz-table-wrapper { overflow-x: hidden; width: 100%; position: relative; }
                .omz-table { border-collapse: separate; border-spacing: 0; width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .omz-table .sticky-col { position: sticky; left: 0; z-index: 10; border-right: 2px solid #F2F4F7 !important; }
                .omz-table th.sticky-col { z-index: 20; background-color: #FCFCFD !important; }
                .omz-table td.sticky-col { background-color: #FFFFFF !important; }
                .omz-row:hover td.sticky-col { background-color: #F9FAFB !important; }
                .omz-table th { background-color: #FCFCFD; color: #101828; font-weight: 600; border-bottom: 1px solid #EAECF0; border-top: 1px solid #EAECF0; }
                .omz-table td { border-bottom: 1px solid #EAECF0; padding: 6px 8px; vertical-align: middle; background: #FFFFFF; }
                .omz-row:hover td { background: #F9FAFB; }
                .col-divider { border-right: 1px solid #EAECF0; }

                .crm-cell-combo { display: inline-flex; align-items: center; border: 1px solid #D0D5DD; border-radius: 8px; background: #FFFFFF; overflow: hidden; box-shadow: 0 1px 2px rgba(16,24,40,0.05); transition: all 0.15s ease; height: 32px; }
                .crm-cell-combo.active { border-color: #2F60E6; box-shadow: 0 0 0 1px #2F60E6, 0 1px 2px rgba(16,24,40,0.05); }
                .crm-cell-combo.late { border-color: #F59E0B; box-shadow: 0 0 0 1px #F59E0B, 0 1px 2px rgba(16,24,40,0.05); }

                .crm-att-side { display: flex; align-items: center; gap: 6px; padding: 0 8px; background: #F9FAFB; border-right: 1px solid #EAECF0; height: 100%; flex-shrink: 0; }
                .crm-score-side { display: flex; align-items: center; height: 100%; }

                /* --- КРАСИВЫЕ АНИМАЦИИ ДЛЯ ДАТЫ И КНОПОК --- */
                .lesson-hdr-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 4px 0;
                }
                .lesson-date-text {
                    display: inline-block;
                    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: transform;
                }
                
                /* Состояние при наведении на ячейку хедера */
                .lesson-hdr:hover .lesson-date-text {
                    transform: translateX(-16px);
                }


                .omz-native-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #2F60E6; margin: 0; }
                .omz-native-checkbox:disabled { cursor: not-allowed; }
                .omz-head-label { display: inline-flex; align-items: center; gap: 6px; color: #667085; font-weight: 600; font-size: 12px; }
            `}</style>

            <div className="omz-table-wrapper">
                <table className="omz-table">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="col-divider sticky-col" style={s.thStudent}>
                                STUDENTS
                            </th>
                            {lessons.map(l => (
                                <th key={l.id} colSpan={1} className="col-divider lesson-hdr" style={s.thDate}>
                                    <div className="lesson-hdr-container">
                                        <span className="lesson-date-text">{fmtDate(l.lessonDate)}</span>
                                    </div>
                                </th>
                            ))}
                            <th colSpan={4} style={s.thEnd}>END OF WEEK</th>
                        </tr>
                        <tr>
                            {lessons.map(l => {
                                const total = students.length;
                                const presentCount = students.filter(st =>
                                    isPresent(attLookup[`${l.id}-${st.id}`]?.status)
                                ).length;

                                return (
                                    <th key={l.id} className="col-divider" style={s.thSub}>
                                        <div className="omz-head-label" style={{ justifyContent: 'center' }}>
                                            <span>Attendance / Score</span>
                                        </div>
                                    </th>
                                );
                            })}
                            <th style={s.thSub}>
                                <div className="omz-head-label" style={{ justifyContent: 'center' }}>
                                    <span>Attendance</span>
                                </div>
                            </th>
                            <th style={s.thSub}>Bonus</th>
                            <th style={s.thSub}>Exam</th>
                            <th style={s.thSub}>Sum</th>
                        </tr>
                    </thead>

                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={1 + lessons.length + 4} style={s.empty}>
                                    Студенты не найдены
                                </td>
                            </tr>
                        ) : students.map((student, idx) => {
                            const wr = weekResults.find(w => w.studentId === student.id);
                            const sum = wr ? Math.round(wr.totalScore) : 0;
                            const sumSt = sumPillStyle(sum);

                            const presentCount = lessons.filter(l =>
                                isPresent(attLookup[`${l.id}-${student.id}`]?.status)
                            ).length;

                            return (
                                <tr key={student.id} className="omz-row">
                                    <td className="col-divider sticky-col" style={s.tdStudent}>
                                        <span style={{ color: '#98A2B3', marginRight: '8px', fontWeight: 500, fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>
                                            {idx + 1}.
                                        </span>
                                        {student.name}
                                    </td>

                                    {lessons.map(lesson => {
                                        const aKey = `${lesson.id}-${student.id}`;
                                        const att = attLookup[aKey];
                                        const sc = scoreLookup[aKey];
                                        const present = isPresent(att?.status);
                                        const isLate = String(att?.status) === 'Late';
                                        const currentScore = (sc && sc.score !== undefined) ? sc.score : 0;
                                        const isLeft = student.isActive === false;

                                        return (
                                            <td key={lesson.id} className="col-divider" style={s.tdCenter}>
                                                <div className={`crm-cell-combo ${present ? 'active' : ''} ${isLate ? 'late' : ''}`} style={{ opacity: isLeft ? 0.6 : 1 }}>
                                                    <div className="crm-att-side">

                                                        <input
                                                            type="checkbox"
                                                            checked={present || isLate}
                                                            disabled
                                                            className="omz-native-checkbox"
                                                        />
                                                    </div>

                                                    <div className="crm-score-side">
                                                        <select
                                                            disabled
                                                            value={currentScore}
                                                            style={s.readonlySelect}
                                                        >
                                                            <option value={currentScore}>
                                                                {currentScore}
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}

                                    <td style={s.tdCenter}>
                                        <div className="crm-cell-combo" style={{ opacity: 0.6, background: '#F9FAFB' }}>
                                            <div className="crm-att-side" style={{ borderRight: 'none', padding: '0 10px' }}>
                                                <span
                                                    style={{
                                                        fontWeight: 700,
                                                        color: '#2563EB'
                                                    }}
                                                >
                                                    {Math.round(
                                                        (presentCount /
                                                            Math.max(lessons.length, 1)) *
                                                        100
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td style={s.tdCenter}>
                                        <input
                                            value={Math.round(wr?.bonusScore ?? 0)}
                                            disabled
                                            readOnly
                                            style={s.readonlyInput}
                                        />
                                    </td>

                                    <td style={s.tdCenter}>
                                        <input
                                            value={Math.round(wr?.examScore ?? 0)}
                                            disabled
                                            readOnly
                                            style={s.readonlyInput}
                                        />
                                    </td>

                                    <td style={s.tdCenter}>
                                        <span style={{ ...s.sumPill, background: sumSt.bg, color: sumSt.color }}>
                                            {sum}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const s = {
    readonlyInput: {
        width: '54px',
        height: '32px',
        border: '1px solid #D0D5DD',
        borderRadius: '8px',
        textAlign: 'center',
        background: '#FFFFFF',
        color: '#101828',
        fontWeight: 500,
    } as React.CSSProperties,

    readonlySelect: {
        border: 'none',
        background: 'transparent',
        color: '#101828',
        fontWeight: 600,
        width: '40px',
        textAlign: 'center',
        appearance: 'none',
        cursor: 'default',
    } as React.CSSProperties,
    container: { background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.05)', overflow: 'hidden' } as React.CSSProperties,
    thStudent: { padding: '10px 12px', textAlign: 'left' as const, fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.04em', minWidth: '160px', maxWidth: '180px' } as React.CSSProperties,
    thDate: { padding: '10px 8px', textAlign: 'center' as const, fontSize: '14px', fontWeight: 700, color: '#101828', minWidth: '115px' } as React.CSSProperties,
    thEnd: { padding: '8px 10px', textAlign: 'center' as const, fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' } as React.CSSProperties,
    thSub: { padding: '6px 8px', fontSize: '11px', fontWeight: 500, color: '#667085', textAlign: 'center' as const } as React.CSSProperties,
    tdStudent: { padding: '8px 12px', fontWeight: 500, fontSize: '14px', color: '#344054', whiteSpace: 'nowrap' as const, minWidth: '160px', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden' } as React.CSSProperties,
    tdCenter: { textAlign: 'center' as const } as React.CSSProperties,
    sumPill: { display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', minWidth: '38px', textAlign: 'center' as const, boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)' } as React.CSSProperties,
    empty: { padding: '30px 16px', textAlign: 'center' as const, fontSize: '14px', color: '#98A2B3' } as React.CSSProperties,
};

export default StudentGroupJournalWeekTable;