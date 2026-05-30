import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../../../components/ui/MetricCard';
import groupService from '../../../api/groupService';
import courseService from '../../../api/courseService';
import adminService from '../../../api/adminService';
import type { GroupListItemResponse } from '../../../types/group';
import type { CourseListItemResponse, PagedResult } from '../../../types/admin';
import GroupCard from '../../../components/ui/group/GroupCard';

const GroupsPage: React.FC = () => {
    const [pagedData, setPagedData] = useState<PagedResult<GroupListItemResponse> | null>(null);
    const [courses, setCourses] = useState<CourseListItemResponse[]>([]);
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '', courseId: 0, mentorId: 0, startDate: '', endDate: '', maxStudents: 15
    });

    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter]);

    // Загрузка курсов и менторов для модалки
    useEffect(() => {
        const loadSelects = async () => {
            try {
                const [coursesRes, mentorsRes] = await Promise.all([
                    courseService.getAll({ pageSize: 100, isActive: true }), // Увеличили pageSize, чтобы подгрузить все активные курсы
                    adminService.getMentors(1, 100, undefined, true)        // Увеличили pageSize для менторов
                ]);
                if (coursesRes.data?.isSuccess) setCourses(coursesRes.data.data?.items ?? []);
                if (mentorsRes.data?.isSuccess) {
                    const items = mentorsRes.data.data?.items || mentorsRes.data.data || [];
                    setMentors(Array.isArray(items) ? items : []);
                }
            } catch (err) {
                console.error("Ошибка при начальной загрузке справочников:", err);
            }
        };
        loadSelects();
    }, []);

    // Загрузка групп с фильтрацией
    const fetchGroups = useCallback(async () => {
        try {
            setLoading(true);
            const status = statusFilter === 'active' ? 'Active' : statusFilter === 'completed' ? 'Completed' : undefined;

            const response = await groupService.getAll({
                page: currentPage,
                pageSize,
                search: debouncedSearch || undefined,
                status
            });

            if (response.data?.isSuccess) {
                setPagedData(response.data.data);
                setError(null);
            } else {
                setError('Не удалось загрузить группы');
            }
        } catch (err) {
            setError('Ошибка при подключении к серверу');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, statusFilter]);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);

    // 🔥 ИСПРАВЛЕНИЕ: Надежная валидация и отправка формы создания группы
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Клиентская валидация перед отправкой на .NET API
        if (!formData.name.trim()) {
            setFormError('Укажите корректное название группы');
            return;
        }
        if (Number(formData.courseId) <= 0) {
            setFormError('Выберите учебное направление (курс)');
            return;
        }
        if (Number(formData.mentorId) <= 0) {
            setFormError('Назначьте действующего ментора для группы');
            return;
        }
        if (!formData.startDate || !formData.endDate) {
            setFormError('Заполните даты начала и окончания обучения');
            return;
        }

        setSubmitting(true);
        try {
            // Подготовка DTO в строгом соответствии с требованиями Swagger/C# бэкенда
            const requestData = {
                name: formData.name.trim(),
                courseId: Number(formData.courseId),
                mentorId: Number(formData.mentorId),
                startDate: new Date(formData.startDate).toISOString(), // Форматирование даты в ISO String
                endDate: new Date(formData.endDate).toISOString(),
                maxStudents: Number(formData.maxStudents)
            };

            const response = await groupService.create(requestData);
            
            if (response.data?.isSuccess) {
                setIsModalOpen(false);
                setFormData({ name: '', courseId: 0, mentorId: 0, startDate: '', endDate: '', maxStudents: 15 });
                fetchGroups();
            } else {
                setFormError(response.data?.message || 'Сервер отклонил запрос на создание группы');
            }
        } catch (err: any) {
            // Чтение структурированных ошибок валидатора .NET (FluentValidation / Identity)
            const apiMessage = err.response?.data?.Message || err.response?.data?.message;
            const validationErrors = err.response?.data?.errors;
            
            if (validationErrors) {
                const firstErrorKey = Object.keys(validationErrors)[0];
                const firstErrorMessage = validationErrors[firstErrorKey][0];
                setFormError(`${firstErrorKey}: ${firstErrorMessage}`);
            } else {
                setFormError(apiMessage || 'Внутренняя ошибка сервера при создании группы');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusToggle = async (id: number, currentStatusStr: string) => {
        const isActive = currentStatusStr === 'Active';
        const nextStatusEnum = isActive ? 2 : 1;
        const nextStatusStr = isActive ? 'Completed' : 'Active';

        setPagedData(prev => prev ? {
            ...prev,
            items: prev.items.map(g => g.id === id ? { ...g, status: nextStatusStr } : g)
        } : prev);

        try {
            const response = await groupService.setStatus(id, nextStatusEnum);
            if (!response.data?.isSuccess) {
                throw new Error();
            }
        } catch {
            setPagedData(prev => prev ? {
                ...prev,
                items: prev.items.map(g => g.id === id ? { ...g, status: currentStatusStr } : g)
            } : prev);
        }
    };

    const groups = pagedData?.items ?? [];
    const totalCount = pagedData?.totalCount ?? 0;
    const totalPages = pagedData?.totalPages ?? 1;
    
    // Вычисляем метрики на основе текущих данных
    const activeCount = groups.filter(g => g.status === 'Active').length;
    const completedCount = Math.max(0, groups.length - activeCount);
    const totalStudents = groups.reduce((sum, g) => sum + (g.activeStudentsCount || 0), 0);

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>Управление группами</h2>
                    <p style={styles.subtitle}>Формирование учебных классов, распределение менторов и контроль наполняемости</p>
                </div>
            </div>

            <div style={styles.metricsWrapper}>
                <div onClick={() => setIsModalOpen(true)} style={styles.metricCardGridWrapperClickable}>
                    <MetricCard isMain value={totalCount} label="ВСЕГО ГРУПП" subLabel="Нажмите, чтобы создать" />
                </div>
                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="green" value={activeCount} label="АКТИВНЫЕ ГРУППЫ" subLabel="Идет учебный процесс" />
                </div>
                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="amber" value={completedCount} label="ЗАВЕРШЕННЫЕ" subLabel="Выпускники / Архив" />
                </div>
                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="blue" value={totalStudents} label="СТУДЕНТОВ В ГРУППАХ" subLabel="Активно обучаются" />
                </div>
            </div>

            <div style={styles.toolbar}>
                <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input type="text" placeholder="Поиск по названию, курсу или ментору..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                </div>
                <div style={styles.filterWrapper}>
                    <Filter size={16} style={{ color: '#64748B' }} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.selectInput}>
                        <option value="all">Все статусы</option>
                        <option value="active">Активные</option>
                        <option value="completed">Завершённые</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={styles.centerMessage}>Загрузка списка групп...</div>
            ) : error ? (
                <div style={{ ...styles.centerMessage, color: '#ef4444' }}>{error}</div>
            ) : (
                <>
                    <div style={styles.gridContainer}>
                        {groups.map((group) => (
                            <GroupCard
                                key={group.id}
                                group={group}
                                onDetails={(id) => navigate(`/admin/groups/${id}`)}
                                onStatusToggle={handleStatusToggle}
                            />
                        ))}
                    </div>

                    {groups.length === 0 && (
                        <div style={styles.emptyState}>Группы по вашему запросу не найдены</div>
                    )}

                    <div style={styles.paginationContainer}>
                        <button
                            style={{ ...styles.pageSquareBtn, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft size={16} color="#64748B" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .map((p, idx, arr) => (
                                <React.Fragment key={p}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                        <span style={{ color: '#94A3B8', padding: '0 4px' }}>...</span>
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(p)}
                                        style={p === currentPage ? styles.pageSquareBtnActive : styles.pageSquareBtn}
                                    >
                                        {p}
                                    </button>
                                </React.Fragment>
                            ))}

                        <button
                            style={{ ...styles.pageSquareBtn, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            <ChevronRight size={16} color="#64748B" />
                        </button>
                    </div>
                </>
            )}

            {/* Модалка создания группы */}
            {isModalOpen && (
                <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        <h3 style={styles.modalTitle}>Создание новой группы</h3>
                        <p style={styles.modalSubtitle}>Заполните параметры группы и выберите ментора.</p>
                        {formError && <div style={styles.formErrorBox}>{formError}</div>}
                        <form onSubmit={handleCreateSubmit} style={styles.formContainer}>
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>НАЗВАНИЕ ГРУППЫ</label>
                                <input type="text" required style={styles.modalInput} placeholder="Например: FRNT-2026-01"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>УЧЕБНОЕ НАПРАВЛЕНИЕ</label>
                                <select style={styles.modalSelect} required value={formData.courseId}
                                    onChange={e => setFormData({ ...formData, courseId: Number(e.target.value) })}>
                                    <option value={0}>Выберите курс...</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>НАЗНАЧИТЬ МЕНТОРА</label>
                                <select style={styles.modalSelect} required value={formData.mentorId}
                                    onChange={e => setFormData({ ...formData, mentorId: Number(e.target.value) })}>
                                    <option value={0}>Выберите ментора...</option>
                                    {mentors.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.fullName} {m.specialization ? `(${m.specialization})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.rowInputs}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>ДАТА НАЧАЛА</label>
                                    <input type="date" required style={styles.modalInput}
                                        value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>ДАТА ОКОНЧАНИЯ</label>
                                    <input type="date" required style={styles.modalInput}
                                        value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>МАКС. СТУДЕНТОВ</label>
                                <input type="number" required min="1" max="50" style={styles.modalInput}
                                    value={formData.maxStudents} onChange={e => setFormData({ ...formData, maxStudents: Number(e.target.value) })} />
                            </div>
                            <button type="submit" disabled={submitting} style={styles.submitBtn}>
                                {submitting ? 'Создание...' : 'Создать группу'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '32px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: '#F8FAFC', minHeight: '100vh', boxSizing: 'border-box' as const },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' },
    subtitle: { fontSize: '14px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 500 },
    metricsWrapper: { display: 'flex', flexWrap: 'wrap' as const, gap: '20px', marginBottom: '32px', width: '100%', alignItems: 'stretch' },
    metricCardGridWrapper: { flex: '1 1 240px', display: 'grid' as const },
    metricCardGridWrapperClickable: { flex: '1 1 240px', display: 'grid' as const, cursor: 'pointer' },
    toolbar: { marginBottom: '28px', display: 'flex', gap: '14px', flexWrap: 'wrap' as const, alignItems: 'center' },
    searchWrapper: { position: 'relative' as const, flex: 1, minWidth: '280px', maxWidth: '400px' },
    searchIcon: { position: 'absolute' as const, left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' },
    searchInput: { width: '100%', height: '44px', padding: '0 16px 0 44px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#ffffff', fontSize: '14px', outline: 'none', color: '#334155', boxSizing: 'border-box' as const },
    filterWrapper: { display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0 14px', height: '44px' },
    selectInput: { border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#334155', fontWeight: 500, cursor: 'pointer' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px', width: '100%' },
    paginationContainer: { display: 'flex', justifyContent: 'flex-end' as const, alignItems: 'center', gap: '8px', marginTop: '32px', width: '100%' },
    pageSquareBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '10px' },
    pageSquareBtnActive: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', backgroundColor: '#4F46E5', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '14px', fontWeight: 600 },
    centerMessage: { padding: '80px 40px', textAlign: 'center' as const, fontSize: '16px', color: '#64748B', width: '100%' },
    emptyState: { padding: '40px', textAlign: 'center' as const, color: '#94A3B8', fontSize: '15px', gridColumn: '1 / -1' },
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: '#ffffff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', position: 'relative' as const },
    closeBtn: { position: 'absolute' as const, top: '22px', right: '22px', background: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
    modalTitle: { margin: '0 0 6px 0', fontSize: '20px', fontWeight: 700, color: '#0F172A' },
    modalSubtitle: { margin: '0 0 20px 0', fontSize: '13px', color: '#64748B', lineHeight: 1.4 },
    formContainer: { display: 'flex', flexDirection: 'column' as const, gap: '14px' },
    rowInputs: { display: 'flex', gap: '12px' },
    inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px', flex: 1 },
    inputLabel: { fontSize: '11px', fontWeight: 700, color: '#64748B' },
    modalInput: { width: '100%', height: '44px', padding: '0 14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none', color: '#0F172A', boxSizing: 'border-box' as const },
    modalSelect: { width: '100%', height: '44px', padding: '0 14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none', color: '#0F172A', boxSizing: 'border-box' as const, cursor: 'pointer' },
    submitBtn: { marginTop: '10px', height: '46px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
    formErrorBox: { padding: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '10px', color: '#EF4444', fontSize: '13px', marginBottom: '14px', fontWeight: 500 }
};

export default GroupsPage;