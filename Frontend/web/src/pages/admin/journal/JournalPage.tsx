import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Calendar, Award, CheckCircle2, TrendingUp } from 'lucide-react';
import { lessonService, type LessonResponse } from '../../../api/lessonService';
import { attendanceService, type AttendanceListItemResponse } from '../../../api/attendanceService';
import { scoreService, type LessonScoreResponse } from '../../../api/scoreService';
import { weekResultService, type WeekResultResponse } from '../../../api/weekResultService';
import { groupStudentService } from '../../../api/groupStudentService';
import { JournalTable } from '../../../components/ui/JournalTable';
import { AddLessonModal } from '../../../components/modals/AddLessonModal';

export const JournalPage: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const parsedGroupId = Number(groupId);

    // Стейты фильтрации
    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    const [availableWeeks, setAvailableWeeks] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);

    // Стейты данных
    const [students, setStudents] = useState<{ id: number; fullName: string }[]>([]);
    const [allGroupLessons, setAllGroupLessons] = useState<LessonResponse[]>([]);
    const [attendances, setAttendances] = useState<Record<number, AttendanceListItemResponse[]>>({});
    const [scores, setScores] = useState<Record<number, LessonScoreResponse[]>>({});
    const [weekResults, setWeekResults] = useState<WeekResultResponse[]>([]);

    // Интерфейсные стейты
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // ОПТИМИЗАЦИЯ: Фильтруем уроки только с проверкой на массив, исключая ошибку "filter is not a function"
    const currentWeekLessons = useMemo(() => {
        if (!Array.isArray(allGroupLessons)) return [];
        return allGroupLessons
            .filter(l => l && l.weekNumber === selectedWeek)
            .sort((a, b) => a.orderIndex - b.orderIndex);
    }, [allGroupLessons, selectedWeek]);

    // Универсальный хелпер для извлечения массива из ответов API (разруливает вложенные объекты бэкенда)
    const extractArray = (res: any): any[] => {
        if (!res) return [];
        // Проверяем все возможные варианты вложенности структур данных
        const target = res.data?.data ?? res.data?.items ?? res.data ?? res.items ?? res;
        return Array.isArray(target) ? target : [];
    };

    // Загрузка первичных списков (Студенты и все Уроки группы)
    const loadBaseData = useCallback(async () => {
        if (!parsedGroupId || isNaN(parsedGroupId)) return;
        try {
            setLoading(true);
            const [studentsRes, lessonsRes] = await Promise.all([
                groupStudentService.getById(parsedGroupId).catch(() => null),
                lessonService.getByGroupId(parsedGroupId).catch(() => null)
            ]);

            // Безопасно парсим студентов
            const rawStudents = extractArray(studentsRes);
            const formattedStudents = rawStudents.map((s: any) => ({
                id: s.studentId || s.id,
                fullName: s.studentFullName || s.user?.fullName || `Студент #${s.id}`
            }));
            setStudents(formattedStudents);

            // Безопасно парсим уроки (Решает проблему строки 66 "lessonsData.map is not a function")
            const lessonsData = extractArray(lessonsRes);
            setAllGroupLessons(lessonsData);

            // Динамически вычисляем доступные недели
            if (lessonsData.length > 0) {
                const weeks = Array.from(
                    new Set(lessonsData.map((l: any) => l?.weekNumber).filter(Boolean))
                ) as number[];
                
                if (weeks.length > 0) {
                    setAvailableWeeks(weeks.sort((a, b) => a - b));
                }
            }
        } catch (err) {
            console.error("Ошибка загрузки базовых данных журнала:", err);
        } finally {
            setLoading(false);
        }
    }, [parsedGroupId]);

    // Загрузка деталей недели (Посещаемость, Оценки и Итоги недели)
    const loadWeekDetails = useCallback(async () => {
        if (!Array.isArray(currentWeekLessons) || currentWeekLessons.length === 0) {
            setAttendances({});
            setScores({});
            setWeekResults([]);
            return;
        }

        try {
            const lessonIds = currentWeekLessons.map(l => l.id);
            
            const attPromises = lessonIds.map(id => attendanceService.getByLessonId(id).catch(() => ({ data: { data: [] } })));
            const scorePromises = lessonIds.map(id => scoreService.getByLessonId(id).catch(() => ({ data: { data: [] } })));
            const weekResPromise = weekResultService.getByGroupAndWeek(parsedGroupId, selectedWeek).catch(() => ({ data: { data: [] } }));

            const settledResults = await Promise.all([
                ...attPromises,
                ...scorePromises,
                weekResPromise
            ]);

            const attResponses = settledResults.slice(0, lessonIds.length);
            const scoreResponses = settledResults.slice(lessonIds.length, lessonIds.length * 2);
            const weekResultsRes = settledResults[settledResults.length - 1];

            const newAttendances: Record<number, AttendanceListItemResponse[]> = {};
            lessonIds.forEach((id, index) => {
                newAttendances[id] = extractArray(attResponses[index]);
            });
            setAttendances(newAttendances);

            const newScores: Record<number, LessonScoreResponse[]> = {};
            lessonIds.forEach((id, index) => {
                newScores[id] = extractArray(scoreResponses[index]);
            });
            setScores(newScores);

            setWeekResults(extractArray(weekResultsRes));

        } catch (err) {
            console.error("Ошибка загрузки деталей недели:", err);
        }
    }, [currentWeekLessons, parsedGroupId, selectedWeek]);

    useEffect(() => {
        loadBaseData();
    }, [loadBaseData]);

    useEffect(() => {
        loadWeekDetails();
    }, [loadWeekDetails]);

    const handleAttendanceChange = async (lessonId: number, studentId: number, present: boolean) => {
        try {
            await attendanceService.createOrUpdate({
                lessonId,
                studentId,
                status: present ? 1 : 2
            });
            
            await weekResultService.recalculate({ studentId, groupId: parsedGroupId, weekNumber: selectedWeek }).catch(() => {});
            await loadWeekDetails();
        } catch (err) {
            console.error("Не удалось сохранить посещаемость:", err);
        }
    };

    const handleScoreChange = async (lessonId: number, studentId: number, score: number) => {
        try {
            await scoreService.saveScore({ lessonId, studentId, score });
            
            await weekResultService.recalculate({ studentId, groupId: parsedGroupId, weekNumber: selectedWeek }).catch(() => {});
            await loadWeekDetails();
        } catch (err) {
            console.error("Не удалось сохранить оценку:", err);
        }
    };

    const calculateStats = () => {
        if (!Array.isArray(weekResults) || weekResults.length === 0) return { avgScore: 0, avgAttendance: 0 };
        const totalScore = weekResults.reduce((acc, curr) => acc + (curr?.totalScore || 0), 0);
        const totalAtt = weekResults.reduce((acc, curr) => acc + (curr?.attendanceScore || 0), 0);
        return {
            avgScore: Math.round(totalScore / weekResults.length),
            avgAttendance: Math.round(totalAtt / weekResults.length)
        };
    };

    const stats = calculateStats();

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontFamily: 'Inter' }}>Синхронизация данных журнала...</div>;
    }

    return (
        <div style={{ padding: '30px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            
            {/* Хедер журнала */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Управление журналом</h1>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>Посещаемость, успеваемость и аналитика по неделям</p>
                    </div>
                </div>

                <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#4F46E5', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)' }}>
                    <Plus size={16} /> Добавить урок
                </button>
            </div>

            {/* Аналитические карточки */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '26px' }}>
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Award size={20} /></div>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{stats.avgScore} %</div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Средняя успеваемость недели</div>
                    </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={20} /></div>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{stats.avgAttendance} %</div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Посещаемость студентов</div>
                    </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFF7ED', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} /></div>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{currentWeekLessons.length}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Всего уроков проведено</div>
                    </div>
                </div>
            </div>

            {/* Панель фильтрации недель */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px', overflowX: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginRight: '6px', whiteSpace: 'nowrap' }}>Неделя потока:</span>
                {availableWeeks.map((week) => (
                    <button
                        key={week}
                        onClick={() => setSelectedWeek(week)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: selectedWeek === week ? '#4F46E5' : '#E2E8F0',
                            background: selectedWeek === week ? '#4F46E5' : '#fff',
                            color: selectedWeek === week ? '#fff' : '#475569',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Неделя {week}
                    </button>
                ))}
            </div>

            {/* Таблица */}
            {currentWeekLessons.length > 0 ? (
                <JournalTable
                    students={students}
                    lessons={currentWeekLessons}
                    attendances={attendances}
                    scores={scores}
                    onAttendanceChange={handleAttendanceChange}
                    onScoreChange={handleScoreChange}
                />
            ) : (
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    <TrendingUp size={24} style={{ color: '#94A3B8', marginBottom: '10px' }} />
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>На этой неделе еще нет занятий</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Нажмите кнопку "Добавить урок", чтобы сформировать расписание.</div>
                </div>
            )}

            {/* Модалка создания уроков */}
            <AddLessonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                groupId={parsedGroupId}
                currentWeek={selectedWeek}
                onLessonCreated={() => {
                    loadBaseData();
                }}
            />
        </div>
    );
};