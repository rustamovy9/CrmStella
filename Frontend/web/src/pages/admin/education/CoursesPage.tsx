import React, { useEffect, useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import MetricCard from '../../../components/ui/MetricCard';
import CourseCard from '../../../components/ui/course/CourseCard'; // ← Наш новый импорт
import { useNavigate } from 'react-router-dom';
import type { CourseListItemResponse, PagedResult } from '../../../types/admin';
import courseService from '../../../api/courseService';

const CoursesPage: React.FC = () => {
    // ✅ Убираем локальную фильтрацию — всё на бэкенде
    const [pagedData, setPagedData] = useState<PagedResult<CourseListItemResponse> | null>(null);
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
        name: '', description: '', price: 0, durationWeeks: 1, icon: null as File | null
    });

    // ✅ Дебаунс для поиска
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ✅ Сброс страницы при изменении фильтров
    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter]);

    // ✅ Загрузка с параметрами фильтрации
    const fetchCourses = async () => {
        try {
            setLoading(true);
            const isActive = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : null;

            const response = await courseService.getAll({
                page: currentPage,
                pageSize,
                search: debouncedSearch || undefined,
                isActive
            });

            if (response.data?.isSuccess) {
                setPagedData(response.data.data);
                setError(null);
            } else {
                setError('Не удалось загрузить данные курсов');
            }
        } catch {
            setError('Ошибка при подключении к серверу');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourses(); }, [currentPage, debouncedSearch, statusFilter]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        try {
            const response = await courseService.create(formData);
            if (response.data?.isSuccess) {
                setIsModalOpen(false);
                setFormData({ name: '', description: '', price: 0, durationWeeks: 1, icon: null });
                fetchCourses();
            } else {
                setFormError(response.data?.message || 'Ошибка при создании курса');
            }
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Не удалось связаться с сервером');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusToggle = async (id: number, currentStatus: boolean) => {
        const nextStatus = !currentStatus;
        // Оптимистичное обновление
        setPagedData(prev => prev ? {
            ...prev,
            items: prev.items.map(c => c.id === id ? { ...c, isActive: nextStatus } : c)
        } : prev);

        try {
            const response = await courseService.setStatus(id, nextStatus);
            if (!response.data?.isSuccess) {
                // Откат
                setPagedData(prev => prev ? {
                    ...prev,
                    items: prev.items.map(c => c.id === id ? { ...c, isActive: currentStatus } : c)
                } : prev);
            }
        } catch {
            setPagedData(prev => prev ? {
                ...prev,
                items: prev.items.map(c => c.id === id ? { ...c, isActive: currentStatus } : c)
            } : prev);
        }
    };

    const courses = pagedData?.items ?? [];
    const totalCount = pagedData?.totalCount ?? 0;
    const totalPages = pagedData?.totalPages ?? 1;
    const activeCourses = courses.filter(c => c.isActive).length;
    const frozenCourses = courses.length - activeCourses;
    const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudentsCount || 0), 0);

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>Учебные направления</h2>
                    <p style={styles.subtitle}>Управление образовательными программами, ценами и группами</p>
                </div>
            </div>

            <div style={styles.metricsWrapper}>
                <div onClick={() => setIsModalOpen(true)} style={styles.metricCardGridWrapperClickable}>
                    <MetricCard isMain value={totalCount} label="ВСЕГО КУРСОВ" subLabel="Нажмите, чтобы добавить" />
                </div>
                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="green" value={activeCourses} label="АКТИВНЫЕ КУРСЫ" subLabel="Доступны для записи" />
                </div>
                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="amber" value={frozenCourses} label="ЗАМОРОЖЕННЫЕ" subLabel="Скрыты из панели" />
                </div>
                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="blue" value={totalStudents} label="ВСЕГО СТУДЕНТОВ" subLabel="Учатся на направлениях" />
                </div>
            </div>

            <div style={styles.toolbar}>
                <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Поиск курса по названию или описанию..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                <div style={styles.filterWrapper}>
                    <Filter size={16} style={{ color: '#64748B' }} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.selectInput}>
                        <option value="all">Все статусы</option>
                        <option value="active">Активные</option>
                        <option value="inactive">Замороженные</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={styles.centerMessage}>Загрузка списка курсов...</div>
            ) : error ? (
                <div style={{ ...styles.centerMessage, color: '#ef4444' }}>{error}</div>
            ) : (
                <>
                    <div style={styles.gridContainer}>
                        {courses.map((course) => {
                            const BASE_URL = 'http://localhost:5046';
                            let finalIconUrl = null;
                            if (course.iconUrl) {
                                finalIconUrl = course.iconUrl.startsWith('http')
                                    ? course.iconUrl
                                    : `${BASE_URL}${course.iconUrl.startsWith('/') ? '' : '/'}${course.iconUrl}`;
                            }
                            return (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    iconUrl={finalIconUrl}
                                    onDetails={(id) => navigate(`/admin/courses/${id}`)}
                                    onStatusToggle={handleStatusToggle}
                                />
                            );
                        })}
                    </div>

                    {courses.length === 0 && (
                        <div style={styles.emptyState}>Курсы по вашему запросу не найдены</div>
                    )}

                    {/* ✅ Пагинация на основе данных бэкенда */}
                    <div style={styles.paginationContainer}>
                        <button
                            style={{ ...styles.pageSquareBtn, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft size={16} color="#64748B" />
                        </button>

                        {/* ✅ Показываем номера страниц */}
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

            {/* Модалка создания — без изменений */}
            {isModalOpen && (
                <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        <h3 style={styles.modalTitle}>Создание курса</h3>
                        <p style={styles.modalSubtitle}>Заполните параметры нового учебного направления.</p>
                        {formError && <div style={styles.formErrorBox}>{formError}</div>}
                        <form onSubmit={handleCreateSubmit} style={styles.formContainer}>
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>НАЗВАНИЕ КУРСА</label>
                                <input type="text" required style={styles.modalInput} placeholder="Например: Frontend Development"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>ОПИСАНИЕ</label>
                                <textarea style={styles.modalTextarea} placeholder="Краткое описание курса..."
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div style={styles.rowInputs}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>ЦЕНА (TJS)</label>
                                    <input type="number" required min="0" style={styles.modalInput}
                                        value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>ДЛИТЕЛЬНОСТЬ (НЕДЕЛЬ)</label>
                                    <input type="number" required min="1" style={styles.modalInput}
                                        value={formData.durationWeeks} onChange={e => setFormData({ ...formData, durationWeeks: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>ИКОНКА КУРСА</label>
                                <input type="file" accept="image/*" style={{ ...styles.modalInput, padding: '10px 14px' }}
                                    onChange={e => setFormData({ ...formData, icon: e.target.files?.[0] ?? null })} />
                            </div>
                            <button type="submit" disabled={submitting} style={styles.submitBtn}>
                                {submitting ? 'Создание...' : 'Создать курс'}
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
    modalContent: { background: '#ffffff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', position: 'relative' as const },
    closeBtn: { position: 'absolute' as const, top: '22px', right: '22px', background: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
    modalTitle: { margin: '0 0 6px 0', fontSize: '20px', fontWeight: 700, color: '#0F172A' },
    modalSubtitle: { margin: '0 0 20px 0', fontSize: '13px', color: '#64748B', lineHeight: 1.4 },
    formContainer: { display: 'flex', flexDirection: 'column' as const, gap: '14px' },
    rowInputs: { display: 'flex', gap: '12px' },
    inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px', flex: 1 },
    inputLabel: { fontSize: '11px', fontWeight: 700, color: '#64748B' },
    modalInput: { width: '100%', height: '44px', padding: '0 14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none', color: '#0F172A', boxSizing: 'border-box' as const },
    modalTextarea: { width: '100%', height: '80px', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none', color: '#0F172A', boxSizing: 'border-box' as const, resize: 'none' as const },
    submitBtn: { marginTop: '10px', height: '46px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
    formErrorBox: { padding: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '10px', color: '#EF4444', fontSize: '13px', marginBottom: '14px', fontWeight: 500 }
};

export default CoursesPage;