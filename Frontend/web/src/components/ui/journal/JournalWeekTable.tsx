import React from 'react';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
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
    leftAt?: string | null;
}

interface Props {
    weekNumber: number;
    lessons: LessonResponse[];
    students: Student[];

    attLookup: Record<string, AttendanceResponse>;
    scoreLookup: Record<string, LessonScoreResponse>;

    weekResults: WeekResultResponse[];

    saving: string | null;

    canEdit?: boolean;

    onAttToggle?: (
        lessonId: number,
        studentId: number
    ) => void;

    onScoreChange?: (
        lessonId: number,
        studentId: number,
        weekNumber: number,
        score: number
    ) => void;

    onCommentOpen?: (
        lessonId: number,
        studentId: number,
        att?: AttendanceResponse
    ) => void;

    onWeekFieldUpdate?: (
        studentId: number,
        weekNumber: number,
        field: 'bonusScore' | 'examScore',
        value: number
    ) => void;

    onLessonEdit?: (lesson: LessonResponse) => void;
    onLessonDelete?: (lessonId: number) => void;
}

const fmtDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const isPresent = (status: any) => {
    if (!status) return false;
    const s = String(status).toLowerCase();
    return (
        s === 'present' ||
        s === 'late' ||
        s === '1'
    );
};

const sumPillStyle = (score: number) => {
    if (score >= 86) return { bg: '#12B76A', color: '#FFFFFF' };
    if (score >= 70) return { bg: '#F79009', color: '#FFFFFF' };
    return { bg: '#F04438', color: '#FFFFFF' };
};

const HeaderCheckbox: React.FC<{ checked: boolean; indeterminate: boolean }> = ({ checked, indeterminate }) => {
    const ref = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);
    return (
        <input
            ref={ref}
            type="checkbox"
            className="omz-native-checkbox"
            checked={checked}
            disabled
            style={{ cursor: 'default', opacity: checked || indeterminate ? 1 : 0.7 }}
            onChange={() => { }}
        />
    );
};

interface EditableNumProps {
    value: number;
    studentId: number;
    weekNumber: number;
    field: 'bonusScore' | 'examScore';
    saving: string | null;
    onSave: (studentId: number, weekNumber: number, field: 'bonusScore' | 'examScore', value: number) => void;
}

const EditableNum: React.FC<EditableNumProps> = ({ value, studentId, weekNumber, field, saving, onSave }) => {
    const [local, setLocal] = React.useState<string>(value ? String(Math.round(value)) : '');
    const savingKey = `wr-${field}-${studentId}-${weekNumber}`;
    const isSavingThis = saving === savingKey;

    React.useEffect(() => {
        setLocal(value ? String(Math.round(value)) : '');
    }, [value]);

    const commit = () => {
        const num = Number(local) || 0;
        if (num !== Math.round(value)) onSave(studentId, weekNumber, field, num);
    };

    return (
        <input
            className="omz-num"
            type="text"
            placeholder="0"
            value={local}
            disabled={!!saving}
            style={{ opacity: isSavingThis ? 0.5 : 1 }}
            onChange={e => setLocal(e.target.value.replace(/[^\d]/g, ''))}
            onBlur={commit}
            onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                    setLocal(value ? String(Math.round(value)) : '');
                    (e.target as HTMLInputElement).blur();
                }
            }}
        />
    );
};

const JournalWeekTable: React.FC<Props> = ({
    weekNumber, lessons, students, attLookup, scoreLookup, weekResults,
    saving, onAttToggle, onScoreChange, onCommentOpen, onWeekFieldUpdate,
    onLessonEdit, onLessonDelete, canEdit = false,
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

                .omz-cmt { background: transparent; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; color: #D0D5DD; transition: color 0.15s ease; flex-shrink: 0; }
                .omz-cmt:hover { color: #2F60E6; }
                .omz-cmt.highlight-blue { color: #2F60E6; }
                .omz-cmt.highlight-amber { color: #F59E0B; }

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
                .lesson-hdr-actions {
                    position: absolute;
                    right: 2px;
                    top: 50%;
                    transform: translateY(-50%) scale(0.85);
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: transform, opacity;
                }
                /* Состояние при наведении на ячейку хедера */
                .lesson-hdr:hover .lesson-date-text {
                    transform: translateX(-16px);
                }
                .lesson-hdr:hover .lesson-hdr-actions {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translateY(-50%) scale(1);
                }

                /* Премиальный стиль кнопок */
                .lesson-btn {
                    background: #FFFFFF;
                    border: 1px solid #D0D5DD;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    line-height: 0;
                }
                .lesson-btn:active {
                    transform: scale(0.92);
                }
                .lesson-btn-edit { 
                    color: #667085; 
                }
                .lesson-btn-edit:hover { 
                    background: #EEF2FF; 
                    color: #4F46E5; 
                    border-color: #C7D2FE;
                    transform: translateY(-1px);
                    box-shadow: 0px 4px 6px -1px rgba(79, 70, 229, 0.1), 0px 2px 4px -1px rgba(79, 70, 229, 0.06);
                }
                .lesson-btn-del { 
                    color: #667085; 
                }
                .lesson-btn-del:hover { 
                    background: #FEF2F2; 
                    color: #EF4444; 
                    border-color: #FCA5A5;
                    transform: translateY(-1px);
                    box-shadow: 0px 4px 6px -1px rgba(239, 68, 68, 0.1), 0px 2px 4px -1px rgba(239, 68, 68, 0.06);
                }

                .omz-native-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #2F60E6; margin: 0; }
                .omz-native-checkbox:disabled { cursor: not-allowed; }
                .omz-score { appearance: none; -webkit-appearance: none; background-color: transparent; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 6px center; width: 48px; height: 100%; padding: 0 16px 0 6px; border: none; font-size: 14px; font-weight: 600; color: #101828; cursor: pointer; outline: none; text-align: center; }
                .omz-score:disabled { color: #98A2B3; cursor: not-allowed; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23D0D5DD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); }
                .omz-num { width: 44px; height: 30px; padding: 0; border: 1px solid #D0D5DD; border-radius: 6px; font-size: 14px; font-weight: 500; color: #475467; background: #FFFFFF; text-align: center; box-shadow: 0 1px 2px rgba(16,24,40,0.05); outline: none; transition: all 0.15s ease; }
                .omz-num:focus { border-color: #2F60E6; box-shadow: 0 0 0 3px rgba(47, 96, 230, 0.1); }
                .omz-head-label { display: inline-flex; align-items: center; gap: 6px; color: #667085; font-weight: 600; font-size: 12px; }
                .readonly-score { pointer-events: none; appearance: none; -webkit-appearance: none; -moz-appearance: none; background-image: none !important; color: #101828 !important; opacity: 1 !important;}
                .student-readonly-checkbox {pointer-events: none;}
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
                                        {canEdit && (

                                            <span className="lesson-hdr-actions">
                                                <button
                                                    className="lesson-btn lesson-btn-edit"
                                                    title="Редактировать урок"
                                                    onClick={(e) => { e.stopPropagation(); onLessonEdit?.(l); }}
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                                <button
                                                    className="lesson-btn lesson-btn-del"
                                                    title="Удалить урок"
                                                    onClick={(e) => { e.stopPropagation(); onLessonDelete?.(l.id); }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </span>
                                        )}
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
                                const allPresent = total > 0 && presentCount === total;
                                const isIndeterminate = presentCount > 0 && presentCount < total;

                                return (
                                    <th key={l.id} className="col-divider" style={s.thSub}>
                                        <div className="omz-head-label" style={{ justifyContent: 'center' }}>
                                            <HeaderCheckbox checked={allPresent} indeterminate={isIndeterminate} />
                                            <span>Att / Score</span>
                                        </div>
                                    </th>
                                );
                            })}
                            <th style={s.thSub}>
                                <div className="omz-head-label" style={{ justifyContent: 'center' }}>
                                    <HeaderCheckbox
                                        checked={students.length > 0 && students.every(st => lessons.every(l => isPresent(attLookup[`${l.id}-${st.id}`]?.status)))}
                                        indeterminate={students.length > 0 && !students.every(st => lessons.every(l => isPresent(attLookup[`${l.id}-${st.id}`]?.status))) && students.some(st => lessons.some(l => isPresent(attLookup[`${l.id}-${st.id}`]?.status)))}
                                    />
                                    <span>Att</span>
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
                            const allPresent = lessons.length > 0 && presentCount === lessons.length;

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
                                        const isSavingAtt = saving === `att-${aKey}`;
                                        const isSavingScore = saving === `score-${aKey}`;
                                        const present = isPresent(att?.status);
                                        const isLate = String(att?.status) === 'Late';
                                        const hasComment = !!(att?.absenceReason && String(att.absenceReason).trim());
                                        const highlightClass = isLate ? 'highlight-amber' : hasComment ? 'highlight-blue' : '';
                                        const activeColor = isLate ? '#F59E0B' : '#2F60E6';
                                        const currentScore = (sc && sc.score !== undefined) ? sc.score : 0;
                                        const isLeft = student.isActive === false;

                                        return (
                                            <td key={lesson.id} className="col-divider" style={s.tdCenter}>
                                                <div className={`crm-cell-combo ${present ? 'active' : ''} ${isLate ? 'late' : ''}`} style={{ opacity: (isSavingAtt || isSavingScore || isLeft) ? 0.6 : 1 }}>
                                                    <div className="crm-att-side">

                                                        <button
                                                            type="button"
                                                            className={`omz-cmt ${highlightClass}`}
                                                            title={isLeft ? 'Студент выбыл' : (att?.absenceReason ?? 'Добавить комментарий')}
                                                            disabled={isLeft || !canEdit}
                                                            style={{ cursor: isLeft ? 'not-allowed' : 'pointer' }}
                                                            onClick={() => !isLeft && onCommentOpen?.(lesson.id, student.id, att)}
                                                        >
                                                            <MessageSquare
                                                                size={14}
                                                                fill={hasComment ? activeColor : 'none'}
                                                            />
                                                        </button>


                                                        <input
                                                            type="checkbox"
                                                            className={`omz-native-checkbox ${!canEdit ? 'student-readonly-checkbox' : ''}`}
                                                            checked={present}
                                                            onChange={() => {
                                                                if (canEdit) {
                                                                    onAttToggle?.(
                                                                        lesson.id,
                                                                        student.id
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="crm-score-side">
                                                        <select
                                                            className={`omz-score ${!canEdit ? 'readonly-score' : ''}`}
                                                            value={currentScore}
                                                            onChange={(e) => {
                                                                if (canEdit) {
                                                                    onScoreChange?.(
                                                                        lesson.id,
                                                                        student.id,
                                                                        weekNumber,
                                                                        Number(e.target.value)
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <option value={0}>0</option>
                                                            {[1, 2, 3, 4, 5].map(v => (
                                                                <option key={v} value={v}>{v}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}

                                    <td style={s.tdCenter}>
                                        <div className="crm-cell-combo" style={{ opacity: 0.6, background: '#F9FAFB' }}>
                                            <div className="crm-att-side" style={{ borderRight: 'none', padding: '0 10px' }}>
                                                <HeaderCheckbox checked={allPresent} indeterminate={!allPresent && presentCount > 0} />
                                            </div>
                                        </div>
                                    </td>

                                    <td style={s.tdCenter}>
                                        {!canEdit ? (
                                            <div style={s.readonlyNum}>
                                                {Math.round(wr?.bonusScore ?? 0)}
                                            </div>
                                        ) : (
                                            <EditableNum
                                                value={wr?.bonusScore ?? 0}
                                                studentId={student.id}
                                                weekNumber={weekNumber}
                                                field="bonusScore"
                                                saving={saving}
                                                onSave={onWeekFieldUpdate!}
                                            />
                                        )}
                                    </td>

                                    <td style={s.tdCenter}>
                                        {!canEdit ? (
                                            <div style={s.readonlyNum}>
                                                {Math.round(wr?.examScore ?? 0)}
                                            </div>
                                        ) : (
                                            <EditableNum
                                                value={wr?.examScore ?? 0}
                                                studentId={student.id}
                                                weekNumber={weekNumber}
                                                field="examScore"
                                                saving={saving}
                                                onSave={onWeekFieldUpdate!}
                                            />
                                        )}
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
    readonlyNum: { width: '46px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D0D5DD', borderRadius: '8px', background: '#FFFFFF', fontSize: '14px', fontWeight: 500, color: '#101828', margin: '0 auto', } as React.CSSProperties,
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

export default JournalWeekTable;