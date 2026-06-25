import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { journalService } from '../../../api/journalService';
import { groupStudentService } from '../../../api/groupStudentService';

import type {
    LessonResponse,
    AttendanceResponse,
    LessonScoreResponse,
    WeekResultResponse,
} from '../../../types/journal';
import JournalChart from '../../../components/ui/journal/JournalChart';
import StudentGroupJournalWeekTable from '../../../components/ui/journal/JournalWeekTable';


const JournalPage: React.FC =  () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const gid = Number(groupId);

    const [lessons, setLessons] = useState<LessonResponse[]>([]);
    const [attMap, setAttMap] = useState<Record<number, AttendanceResponse[]>>({});
    const [scoreMap, setScoreMap] = useState<Record<number, LessonScoreResponse[]>>({});
    const [weekResults, setWeekResults] = useState<Record<number, WeekResultResponse[]>>({});
    const [groupStudents, setGroupStudents] = useState<{ id: number; name: string; isActive?: boolean; leftAt?: string | null }[]>([]);
    const [loading, setLoading] = useState(true);
    const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set());

    const loadAll = async () => {
        setLoading(true);

        try {
            const group =
                await groupStudentService.getMyGroup(gid);

            const studentList =
                (group.students ?? [])
                    .filter(x => x.isActive)
                    .map(x => ({
                        id: x.studentId,
                        name: x.studentName,
                        isActive: x.isActive,
                        leftAt: x.leftAt ?? null,
                    }))
                    .sort((a, b) => {
                        if (a.isActive !== b.isActive) {
                            return a.isActive ? -1 : 1;
                        }

                        return a.name.localeCompare(b.name);
                    });

            setGroupStudents(studentList);

            const res =
                await journalService.getLessonsByGroup(gid);

            const data =
                res.data.data ?? [];

            setLessons(data);

            const weeks =
                Array.from(
                    new Set(
                        data.map(
                            l => l.weekNumber
                        )
                    )
                );

            await Promise.all([
                loadAttScores(data),
                loadWeekResults(
                    weeks,
                    true
                ),
            ]);

            if (weeks.length > 0) {
                const last =
                    Math.max(...weeks);

                setOpenWeeks(
                    new Set([last])
                );
            }
        }
        catch (err) {
            console.error(
                'Journal load error:',
                err
            );
        }
        finally {
            setLoading(false);
        }
    };

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

    const loadWeekResults = async (weeks: number[], isInitialLoad = false) => {
        if (weeks.length === 0) return;
        const results = await Promise.all(
            weeks.map(wn =>
                journalService.getWeekResults(gid, wn)
                    .then(r => ({ wn, data: r.data.data ?? [] }))
                    .catch(() => ({ wn, data: [] as WeekResultResponse[] }))
            )
        );
        setWeekResults(prev => {
            const nextMap = isInitialLoad ? {} : { ...prev };
            results.forEach(r => { nextMap[r.wn] = r.data; });
            return nextMap;
        });
    };
    useEffect(() => {
        if (gid) {
            loadAll();
        }
    }, [gid]);

    const lessonsByWeek = useMemo(() => {
        const map: Record<number, LessonResponse[]> = {};
        lessons.forEach(l => {
            if (!map[l.weekNumber]) map[l.weekNumber] = [];
            map[l.weekNumber].push(l);
        });
        Object.values(map).forEach(arr =>
            arr.sort((a, b) => new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime())
        );
        return map;
    }, [lessons]);

    const sortedWeeks = useMemo(() =>
        Object.keys(lessonsByWeek).map(Number).sort((a, b) => b - a),
        [lessonsByWeek]
    );

    const allWeekNumbers = useMemo(() =>
        Object.keys(lessonsByWeek).map(Number).sort((a, b) => a - b),
        [lessonsByWeek]
    );

    const attLookup = useMemo(() => {
        const m: Record<string, AttendanceResponse> = {};
        Object.values(attMap).flat().forEach(a => { m[`${a.lessonId}-${a.studentId}`] = a; });
        return m;
    }, [attMap]);

    const scoreLookup = useMemo(() => {
        const m: Record<string, LessonScoreResponse> = {};
        Object.values(scoreMap).flat().forEach(sc => { m[`${sc.lessonId}-${sc.studentId}`] = sc; });
        return m;
    }, [scoreMap]);

    const students = useMemo(() => {
        if (groupStudents.length > 0) return groupStudents;
        const map = new Map<number, string>();
        Object.values(attMap).flat().forEach(a => map.set(a.studentId, a.studentFullName));
        Object.values(scoreMap).flat().forEach(sc => map.set(sc.studentId, sc.studentName));
        Object.values(weekResults).flat().forEach(wr => map.set(wr.studentId, wr.studentName));
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [groupStudents, attMap, scoreMap, weekResults]);

    const chartStudentsFormat = useMemo(() =>
        students.map(s => ({ id: s.id, fullName: s.name })),
        [students]
    );


    const toggleWeek = (wn: number) =>
        setOpenWeeks(prev => {
            const next = new Set(prev);
            next.has(wn) ? next.delete(wn) : next.add(wn);
            return next;
        });

    if (loading) return (
        <div style={s.center}>
            <style>{`@keyframes jspin { to { transform: rotate(360deg); } } .jspinner { animation: jspin 0.7s linear infinite; }`}</style>
            <div className="jspinner" style={s.spinner} />
            <span style={{ color: '#64748B', fontSize: '14px' }}>Загрузка журнала...</span>
        </div>
    );

    console.log('Lessons:', lessons);
    console.log('Weeks:', sortedWeeks);
    console.log('Students:', students);
    console.log('WeekResults:', weekResults);

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
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Журнал успеваемости группы</span>
                </button>
            </div>

            <>
                <div style={s.chartWrapper}>
                    <JournalChart
                        weekResults={weekResults}
                        weeks={allWeekNumbers}
                        students={chartStudentsFormat}
                    />
                </div>
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
                                    <StudentGroupJournalWeekTable
                                        weekNumber={wn}
                                        lessons={weekLessons}
                                        students={students}
                                        attLookup={attLookup}
                                        scoreLookup={scoreLookup}
                                        weekResults={weekResults[wn] ?? []}
                                        saving={null}
                                        canEdit={false}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </>
        </div>
    );
};
const s = {
    page: { padding: '24px 32px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' } as React.CSSProperties,
    center: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '12px', height: '60vh' } as React.CSSProperties,
    spinner: { width: '28px', height: '28px', border: '3px solid #E2E8F0', borderTopColor: '#6366F1', borderRadius: '50%' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' } as React.CSSProperties,
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0F172A', transition: 'color 0.15s' } as React.CSSProperties,
    addBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' } as React.CSSProperties,
    chartWrapper: { marginBottom: '28px' } as React.CSSProperties,
    weekList: { display: 'flex', flexDirection: 'column' as const, gap: '12px' } as React.CSSProperties,
    weekCard: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' } as React.CSSProperties,
    weekHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'none', border: 'none', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.15s' } as React.CSSProperties,
    weekTitle: { fontSize: '17px', fontWeight: 700, color: '#0F172A' } as React.CSSProperties,
    emptyWrap: {
        display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
        justifyContent: 'center', padding: '80px 24px', background: '#FFFFFF',
        borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center' as const,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
    } as React.CSSProperties,
    emptyIcon: {
        fontSize: '56px', marginBottom: '20px', lineHeight: 1,
        filter: 'grayscale(20%)'
    } as React.CSSProperties,
    addBtnLarge: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: '#4F46E5', color: '#FFFFFF', border: 'none',
        borderRadius: '12px', padding: '13px 24px',
        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        transition: 'background 0.15s',
        boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
    } as React.CSSProperties,
};

export default JournalPage;