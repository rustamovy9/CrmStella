import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { journalService } from '../../../api/journalService';
import { groupStudentService } from '../../../api/groupStudentService';

import type {
    LessonResponse,
    AttendanceResponse,
    LessonScoreResponse,
    WeekResultResponse,
} from '../../../types/journal';
import JournalChart from '../../../components/ui/journal/JournalChart';
import JournalWeekTable from '../../../components/ui/journal/JournalWeekTable';
import { AddLessonModal } from '../../../components/modals/AddLessonModal';

const STATUS = { Present: 1, Absent: 2, Late: 3, Excused: 4 } as const;

const JournalPage: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const gid = Number(groupId);

    const [lessons, setLessons] = useState<LessonResponse[]>([]);
    const [attMap, setAttMap] = useState<Record<number, AttendanceResponse[]>>({});
    const [scoreMap, setScoreMap] = useState<Record<number, LessonScoreResponse[]>>({});
    const [weekResults, setWeekResults] = useState<Record<number, WeekResultResponse[]>>({});
    const [groupStudents, setGroupStudents] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState<string | null>(null);
    const [showAddLesson, setShowAddLesson] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(1);

    const [commentModal, setCommentModal] = useState<{
        open: boolean;
        att?: AttendanceResponse;
        lessonId: number;
        studentId: number;
        text: string;
    }>({ open: false, lessonId: 0, studentId: 0, text: '' });

    // ─── ЗАГРУЗКА ─────────────────────────────────────────────────────────

    const loadAttScores = async (allLessons: LessonResponse[]) => {
        if (allLessons.length === 0) return;
        const [attRes, scoreRes] = await Promise.all([
            Promise.all(allLessons.map(l =>
                journalService.getAttendanceByLesson(l.id)
                    .then(r => ({ id: l.id, data: r.data.data ?? [] }))
                    .catch(() => ({ id: l.id, data: [] as AttendanceResponse[] }))
            )),
            Promise.all(allLessons.map(l =>
                journalService.getScoresByLesson(l.id)
                    .then(r => ({ id: l.id, data: r.data.data ?? [] }))
                    .catch(() => ({ id: l.id, data: [] as LessonScoreResponse[] }))
            )),
        ]);
        const aMap: Record<number, AttendanceResponse[]> = {};
        const sMap: Record<number, LessonScoreResponse[]> = {};
        attRes.forEach(r => { aMap[r.id] = r.data; });
        scoreRes.forEach(r => { sMap[r.id] = r.data; });
        setAttMap(aMap);
        setScoreMap(sMap);
    };

    const loadWeekResults = async (weeks: number[]) => {
        if (weeks.length === 0) return;
        const results = await Promise.all(
            weeks.map(wn =>
                journalService.getWeekResults(gid, wn)
                    .then(r => ({ wn, data: r.data.data ?? [] }))
                    .catch(() => ({ wn, data: [] as WeekResultResponse[] }))
            )
        );
        const map: Record<number, WeekResultResponse[]> = {};
        results.forEach(r => { map[r.wn] = r.data; });
        setWeekResults(map);
    };

    const loadAll = async () => {
        setLoading(true);
        try {
            // загружаем студентов группы
            const gsData = await groupStudentService.getById(gid);
            const studentList = gsData
                .filter(gs => gs.isActive)
                .map(gs => ({
                    id: gs.studentId,
                    name: gs.studentName  // правильное поле
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
            setGroupStudents(studentList);

            // загружаем уроки
            const res = await journalService.getLessonsByGroup(gid);
            const data = res.data.data ?? [];
            setLessons(data);

            const weeks = Array.from(new Set(data.map(l => l.weekNumber))) as number[];

            await Promise.all([
                loadAttScores(data),
                loadWeekResults(weeks),
            ]);

            if (weeks.length > 0) {
                const last = Math.max(...weeks);
                setOpenWeeks(new Set([last]));
                setCurrentWeek(last);
            }
        } catch (err) {
            console.error('Journal load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (gid) loadAll();
    }, [gid]);

    // ─── ГРУППИРОВКА ──────────────────────────────────────────────────────

    const lessonsByWeek = useMemo(() => {
        const map: Record<number, LessonResponse[]> = {};
        lessons.forEach(l => {
            if (!map[l.weekNumber]) map[l.weekNumber] = [];
            map[l.weekNumber].push(l);
        });
        Object.values(map).forEach(arr =>
            arr.sort((a, b) =>
                new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime()
            )
        );
        return map;
    }, [lessons]);

    const sortedWeeks = useMemo(() =>
        Object.keys(lessonsByWeek).map(Number).sort((a, b) => b - a),
        [lessonsByWeek]
    );

    const allWeekNumbers = useMemo(() =>
        Object.keys(lessonsByWeek).map(Number),
        [lessonsByWeek]
    );

    // ─── LOOKUPS ──────────────────────────────────────────────────────────

    const attLookup = useMemo(() => {
        const m: Record<string, AttendanceResponse> = {};
        Object.values(attMap).flat().forEach(a => {
            m[`${a.lessonId}-${a.studentId}`] = a;
        });
        return m;
    }, [attMap]);

    const scoreLookup = useMemo(() => {
        const m: Record<string, LessonScoreResponse> = {};
        Object.values(scoreMap).flat().forEach(sc => {
            m[`${sc.lessonId}-${sc.studentId}`] = sc;
        });
        return m;
    }, [scoreMap]);

    // студенты — берём из groupStudents (всегда актуально)
    // fallback на attMap/scoreMap если groupStudents пустой
    const students = useMemo(() => {
        if (groupStudents.length > 0) return groupStudents;

        const map = new Map<number, string>();
        Object.values(attMap).flat().forEach(a =>
            map.set(a.studentId, a.studentFullName)
        );
        Object.values(scoreMap).flat().forEach(sc =>
            map.set(sc.studentId, sc.studentName)
        );
        Object.values(weekResults).flat().forEach(wr =>
            map.set(wr.studentId, wr.studentName)
        );
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [groupStudents, attMap, scoreMap, weekResults]);

    // ─── ДЕЙСТВИЯ ─────────────────────────────────────────────────────────

    const handleAttToggle = async (lessonId: number, studentId: number) => {
        const key = `${lessonId}-${studentId}`;
        const existing = attLookup[key];
        setSaving(`att-${key}`);
        try {
            if (!existing) {
                // первый раз — создаём
                await journalService.createAttendance({
                    lessonId, studentId, status: STATUS.Present
                });
            } else {
                // уже есть — только обновляем статус
                const newStatus = existing.status === 'Present'
                    ? STATUS.Absent
                    : STATUS.Present;
                await journalService.updateAttendance(existing.id, { status: newStatus });
            }
            await loadAttScores(lessons);
        } catch (err: any) {
            // если всё же Conflict — просто обновляем
            if (err?.response?.data?.errorType === 3) {
                await loadAttScores(lessons); // перезагружаем чтобы получить id
            }
            console.error('Attendance error:', err);
        } finally {
            setSaving(null);
        }
    };

    const handleScoreChange = async (
        lessonId: number, studentId: number, weekNumber: number, score: number
    ) => {
        const key = `${lessonId}-${studentId}`;
        const existing = scoreLookup[key];
        setSaving(`score-${key}`);
        try {
            if (!existing) {
                await journalService.createLessonScore({ lessonId, studentId, score });
            } else {
                await journalService.updateLessonScore(existing.id, { score });
            }
            await journalService.recalculateWeekResult({
                studentId, groupId: gid, weekNumber
            });
            await Promise.all([
                loadAttScores(lessons),
                loadWeekResults([weekNumber]),
            ]);
        } catch (err) {
            console.error('Score error:', err);
        } finally {
            setSaving(null);
        }
    };

    const handleSaveComment = async () => {
        const { att, lessonId, studentId, text } = commentModal;
        setSaving('comment');
        try {
            if (!att) {
                await journalService.createAttendance({
                    lessonId, studentId,
                    status: STATUS.Absent,
                    absenceReason: text,
                });
            } else {
                const statusNum = att.status === 'Present' ? STATUS.Present
                    : att.status === 'Late' ? STATUS.Late
                        : att.status === 'Excused' ? STATUS.Excused
                            : STATUS.Absent;
                await journalService.updateAttendance(att.id, {
                    status: statusNum,
                    absenceReason: text,
                });
            }
            await loadAttScores(lessons);
        } catch (err) {
            console.error('Comment error:', err);
        } finally {
            setSaving(null);
            setCommentModal({ open: false, lessonId: 0, studentId: 0, text: '' });
        }
    };

    const toggleWeek = (wn: number) =>
        setOpenWeeks(prev => {
            const next = new Set(prev);
            next.has(wn) ? next.delete(wn) : next.add(wn);
            return next;
        });

    // ─── RENDER ───────────────────────────────────────────────────────────

    if (loading) return (
        <div style={s.center}>
            <style>{`
                @keyframes jspin { to { transform: rotate(360deg); } }
                .jspinner { animation: jspin 0.7s linear infinite; }
            `}</style>
            <div className="jspinner" style={s.spinner} />
            <span style={{ color: '#64748B', fontSize: '14px' }}>Загрузка журнала...</span>
        </div>
    );

    return (
        <div style={s.page}>
            <style>{`
                .jback:hover { color: #0F172A !important; }
                .jaddbtn:hover { background: #4338CA !important; }
                .jweekhdr:hover { background: #F8FAFC !important; }
                .jcancelm:hover { background: #F1F5F9 !important; }
                .jsavem:hover { background: #4338CA !important; }
            `}</style>

            <div style={s.header}>
                <button className="jback" style={s.backBtn} onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} />
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                        Journal
                    </span>
                </button>
                <button
                    className="jaddbtn"
                    style={s.addBtn}
                    onClick={() => setShowAddLesson(true)}
                >
                    <Plus size={15} />
                    Добавить урок
                </button>
            </div>

            {lessons.length === 0 ? (
                <div style={s.emptyWrap}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                        Уроки ещё не созданы
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
                        Добавьте первый урок чтобы начать заполнять журнал
                    </div>
                    <button
                        className="jaddbtn"
                        style={s.addBtn}
                        onClick={() => setShowAddLesson(true)}
                    >
                        <Plus size={15} />
                        Добавить первый урок
                    </button>
                </div>
            ) : (
                <>
                    <JournalChart
                        weekResults={weekResults}
                        weeks={allWeekNumbers}
                    />

                    <div style={s.weekList}>
                        {sortedWeeks.map(wn => {
                            const weekLessons = lessonsByWeek[wn] ?? [];
                            const isOpen = openWeeks.has(wn);

                            return (
                                <div key={wn} style={s.weekCard}>
                                    <button
                                        className="jweekhdr"
                                        style={s.weekHeader}
                                        onClick={() => toggleWeek(wn)}
                                    >
                                        <span style={s.weekTitle}>Week {wn}</span>
                                        {isOpen
                                            ? <ChevronUp size={18} color="#64748B" />
                                            : <ChevronDown size={18} color="#64748B" />
                                        }
                                    </button>

                                    {isOpen && (
                                        <JournalWeekTable
                                            weekNumber={wn}
                                            lessons={weekLessons}
                                            students={students}
                                            attLookup={attLookup}
                                            scoreLookup={scoreLookup}
                                            weekResults={weekResults[wn] ?? []}
                                            saving={saving}
                                            onAttToggle={handleAttToggle}
                                            onScoreChange={handleScoreChange}
                                            onCommentOpen={(lessonId, studentId, att) =>
                                                setCommentModal({
                                                    open: true,
                                                    att,
                                                    lessonId,
                                                    studentId,
                                                    text: att?.absenceReason ?? '',
                                                })
                                            }
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {showAddLesson && (
                <AddLessonModal
                    isOpen={showAddLesson}
                    groupId={gid}
                    currentWeek={currentWeek}
                    onClose={() => setShowAddLesson(false)}
                    onLessonCreated={() => {
                        setShowAddLesson(false);
                        loadAll();
                    }}
                />
            )}

            {commentModal.open && (
                <div style={s.overlay}>
                    <div style={s.modal}>
                        <div style={s.modalHeader}>
                            <span style={s.modalTitle}>Комментарий к посещаемости</span>
                            <button
                                style={s.modalClose}
                                onClick={() => setCommentModal({
                                    open: false, lessonId: 0, studentId: 0, text: ''
                                })}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <textarea
                            style={s.textarea}
                            placeholder="Причина отсутствия или опоздания..."
                            value={commentModal.text}
                            rows={4}
                            onChange={e => setCommentModal(prev => ({
                                ...prev, text: e.target.value
                            }))}
                        />
                        <div style={s.modalFooter}>
                            <button
                                className="jcancelm"
                                style={s.cancelBtn}
                                onClick={() => setCommentModal({
                                    open: false, lessonId: 0, studentId: 0, text: ''
                                })}
                            >
                                Отмена
                            </button>
                            <button
                                className="jsavem"
                                style={s.saveBtn}
                                onClick={handleSaveComment}
                                disabled={saving === 'comment'}
                            >
                                {saving === 'comment' ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const s = {
    page: {
        padding: '24px 32px',
        background: '#F8FAFC',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    } as React.CSSProperties,

    center: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        height: '60vh',
    } as React.CSSProperties,

    spinner: {
        width: '28px',
        height: '28px',
        border: '3px solid #E2E8F0',
        borderTopColor: '#6366F1',
        borderRadius: '50%',
    } as React.CSSProperties,

    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
    } as React.CSSProperties,

    backBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        color: '#0F172A',
        transition: 'color 0.15s',
    } as React.CSSProperties,

    addBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: '#4F46E5',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        padding: '10px 18px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.15s',
    } as React.CSSProperties,

    emptyWrap: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        textAlign: 'center' as const,
    } as React.CSSProperties,

    weekList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    } as React.CSSProperties,

    weekCard: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
    } as React.CSSProperties,

    weekHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        background: 'none',
        border: 'none',
        width: '100%',
        textAlign: 'left' as const,
        cursor: 'pointer',
        transition: 'background 0.15s',
    } as React.CSSProperties,

    weekTitle: {
        fontSize: '17px',
        fontWeight: 700,
        color: '#0F172A',
    } as React.CSSProperties,

    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    } as React.CSSProperties,

    modal: {
        background: '#FFFFFF',
        borderRadius: '20px',
        width: '420px',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(15,23,42,0.15)',
    } as React.CSSProperties,

    modalHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
    } as React.CSSProperties,

    modalTitle: {
        fontSize: '16px',
        fontWeight: 700,
        color: '#0F172A',
    } as React.CSSProperties,

    modalClose: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#94A3B8',
        padding: '4px',
        borderRadius: '6px',
    } as React.CSSProperties,

    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        fontSize: '13px',
        color: '#0F172A',
        resize: 'vertical' as const,
        fontFamily: 'inherit',
        boxSizing: 'border-box' as const,
        marginBottom: '16px',
    } as React.CSSProperties,

    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    } as React.CSSProperties,

    cancelBtn: {
        padding: '9px 18px',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        background: '#FFFFFF',
        color: '#64748B',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
    } as React.CSSProperties,

    saveBtn: {
        padding: '9px 18px',
        border: 'none',
        borderRadius: '10px',
        background: '#4F46E5',
        color: '#FFFFFF',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
    } as React.CSSProperties,
};

export default JournalPage;