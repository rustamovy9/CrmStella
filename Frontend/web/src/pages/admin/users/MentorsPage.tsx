import React, { useEffect, useState } from 'react';
import adminService from '../../../api/adminService';
import type { MentorListItemResponse } from '../../../types/admin';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import MetricCard from '../../../components/ui/MetricCard';
import UserCard from '../../../components/ui/UserCard'; // 🌟 Перешли на единый компонент карточки
import { useNavigate } from 'react-router-dom';

const MentorsPage: React.FC = () => {
    const [mentors, setMentors] = useState<MentorListItemResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: ''
    });

    const fetchMentors = async () => {
        try {
            setLoading(true);
            let isActiveParam: boolean | null = null;
            if (statusFilter === 'active') isActiveParam = true;
            if (statusFilter === 'inactive') isActiveParam = false;

            const response = await adminService.getMentors(
                currentPage,
                pageSize,
                searchTerm,
                isActiveParam
            );

            if (response.data && response.data.isSuccess) {
                setMentors(response.data.data.items || []);
                const data = response.data.data;
                if (data) {
                    const pages = Math.ceil(data.totalCount / data.pageSize) || 1;
                    setTotalPages(pages);
                } setTotalItems(response.data.data.totalCount || 0);
                setError(null);
            } else {
                setError("Не удалось корректно прочитать данные преподавателей");
            }
        } catch (err) {
            console.error("Ошибка загрузки менторов:", err);
            setError("Ошибка при подключении к серверу менторов");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchMentors();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchTerm, statusFilter]);

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);

        try {
            // В MentorsPage.tsx внутри функции handleRegisterSubmit:
            const response = await adminService.registerUser({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                roleId: 2
            });

            if (response.data && response.data.isSuccess) {
                setIsModalOpen(false);
                setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '' });
                fetchMentors();
            } else {
                setFormError(response.data.message || "Ошибка при регистрации ментора");
            }
        } catch (err: any) {
            console.error("Ошибка регистрации:", err);
            setFormError(err.response?.data?.message || "Не удалось связаться с сервером");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusToggle = async (id: number, currentStatus: boolean) => {
        const nextStatus = !currentStatus;
        setMentors(prev => prev.map(m => m.id === id ? { ...m, isActive: nextStatus } : m));

        try {
            const response = await adminService.setMentorStatus(id, nextStatus);
            if (!response.data || !response.data.isSuccess) {
                setMentors(prev => prev.map(m => m.id === id ? { ...m, isActive: currentStatus } : m));
            }
        } catch (err) {
            console.error("Не удалось обновить статус ментора:", err);
            setMentors(prev => prev.map(m => m.id === id ? { ...m, isActive: currentStatus } : m));
        }
    };

    const totalMentors = totalItems;
    const activeMentorsOnPage = mentors.filter(m => m.isActive).length;
    const frozenMentorsOnPage = mentors.length - activeMentorsOnPage;

    const mentorsWithExp = mentors.filter(m => m.experienceYears != null);
    const avgExperience = mentorsWithExp.length > 0
        ? (mentorsWithExp.reduce((sum, m) => sum + (m.experienceYears || 0), 0) / mentorsWithExp.length).toFixed(1)
        : "0";

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>Преподавательский состав</h2>
                    <p style={styles.subtitle}>Управление учетными записями и нагрузкой менторов</p>
                </div>
            </div>

            {/* Сетка метрик: теперь все элементы имеют одинаковые размеры */}
            <div style={styles.metricsWrapper}>
                <div
                    onClick={() => setIsModalOpen(true)}
                    style={styles.metricCardGridWrapperClickable}
                    title="Нажмите, чтобы зарегистрировать нового ментора"
                >
                    <MetricCard
                        isMain
                        value={totalMentors}
                        label="ВСЕГО МЕНТОРОВ"
                        subLabel="Нажмите, чтобы добавить"
                    />
                </div>

                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="green" value={activeMentorsOnPage} label="АКТИВНЫЕ НА СТР." subLabel="Доступ открыт" />
                </div>

                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="amber" value={frozenMentorsOnPage} label="ЗАМОРОЖЕННЫЕ НА СТР." subLabel="Доступ ограничен" />
                </div>

                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="blue" value={`${avgExperience} лет`} label="СРЕДНИЙ СТАЖ" subLabel="Лет опыта на странице" />
                </div>
            </div>

            <div style={styles.toolbar}>
                <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Поиск ментора по имени или почте..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        style={styles.searchInput}
                    />
                </div>

                <div style={styles.filterWrapper}>
                    <Filter size={16} style={{ color: '#64748B' }} />
                    <select value={statusFilter} onChange={handleStatusChange} style={styles.selectInput}>
                        <option value="all">Все статусы</option>
                        <option value="active">Активные</option>
                        <option value="inactive">Замороженные</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={styles.centerMessage}>Загрузка списка преподавателей...</div>
            ) : error ? (
                <div style={{ ...styles.centerMessage, color: '#ef4444' }}>{error}</div>
            ) : (
                <>
                    <div style={styles.gridContainer}>
                        {mentors.map((mentor) => {
                            const displayName = mentor.fullName || "Без имени";
                            const BACKEND_URL = 'http://localhost:5046';
                            const fullAvatarUrl = mentor.avatarUrl ? `${BACKEND_URL}/${mentor.avatarUrl}` : null;

                            return (
                                <UserCard
                                    key={mentor.id}
                                    id={mentor.userId}  // Оставляем для внутренней логики карточки
                                    name={displayName}
                                    email={mentor.email}
                                    role="mentor"
                                    isActive={mentor.isActive}
                                    specialization={mentor.specialization}
                                    experienceYears={mentor.experienceYears}
                                    avatarUrl={fullAvatarUrl}

                                    // 🎯 ТРЕБОВАНИЕ 1: Для статуса передаем только mentor.id (mentorId)
                                    onStatusToggle={() => handleStatusToggle(mentor.id, mentor.isActive)}

                                    // 🎯 ТРЕБОВАНИЕ 2: Для UserInfoPage передаем userId в URL, а mentorId — в state роутера
                                    onView={() => navigate(`/admin/users/${mentor.userId}`, {
                                        state: { mentorId: mentor.id }
                                    })}
                                />
                            );
                        })}
                    </div>

                    {mentors.length === 0 && (
                        <div style={styles.emptyState}>Преподаватели по вашему запросу не найдены</div>
                    )}

                    <div style={styles.paginationContainer}>
                        <button
                            style={{
                                ...styles.pageSquareBtn,
                                opacity: currentPage === 1 ? 0.4 : 1,
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <ChevronLeft size={16} color="#64748B" />
                        </button>

                        <button style={styles.pageSquareBtnActive}>{currentPage}</button>

                        <button
                            style={{
                                ...styles.pageSquareBtn,
                                opacity: currentPage === totalPages ? 0.4 : 1,
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <ChevronRight size={16} color="#64748B" />
                        </button>
                    </div>
                </>
            )}

            {isModalOpen && (
                <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                            <X size={20} />
                        </button>

                        <h3 style={styles.modalTitle}>Регистрация ментора</h3>
                        <p style={styles.modalSubtitle}>Новый преподаватель получит временный пароль на указанную почту.</p>

                        {formError && <div style={styles.formErrorBox}>{formError}</div>}

                        <form onSubmit={handleRegisterSubmit} style={styles.formContainer}>
                            <div style={styles.rowInputs}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>ИМЯ</label>
                                    <input
                                        type="text" required style={styles.modalInput} placeholder="Иван"
                                        value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>ФАМИЛИЯ</label>
                                    <input
                                        type="text" required style={styles.modalInput} placeholder="Иванов"
                                        value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>EMAIL (ЭЛЕКТРОННАЯ ПОЧТА)</label>
                                <input
                                    type="email" required style={styles.modalInput} placeholder="mentor@example.com"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>НОМЕР ТЕЛЕФОНА</label>
                                <input
                                    type="text" required style={styles.modalInput} placeholder="+992914241321"
                                    value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                            </div>

                            <button type="submit" disabled={submitting} style={styles.submitBtn}>
                                {submitting ? 'Создание учетной записи...' : 'Зарегистрировать'}
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

    // Структурированная сетка для верхних карточек
    metricsWrapper: { display: 'flex', flexWrap: 'wrap' as const, gap: '20px', marginBottom: '32px', width: '100%', alignItems: 'stretch' },
    metricCardGridWrapper: { flex: '1 1 240px', display: 'grid' as const },
    metricCardGridWrapperClickable: { flex: '1 1 240px', display: 'grid' as const, cursor: 'pointer' },

    toolbar: { marginBottom: '28px', display: 'flex', gap: '14px', flexWrap: 'wrap' as const, alignItems: 'center' },
    searchWrapper: { position: 'relative' as const, flex: 1, minWidth: '280px', maxWidth: '400px' },
    searchIcon: { position: 'absolute' as const, left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' },
    searchInput: { width: '100%', height: '44px', padding: '0 16px 0 44px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#ffffff', fontSize: '14px', outline: 'none', color: '#334155', boxSizing: 'border-box' as const },
    filterWrapper: { display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0 14px', height: '44px' },
    selectInput: { border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#334155', fontWeight: 500, cursor: 'pointer' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', width: '100%' },
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
    submitBtn: { marginTop: '10px', height: '46px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
    formErrorBox: { padding: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '10px', color: '#EF4444', fontSize: '13px', marginBottom: '14px', fontWeight: 500 }
};

export default MentorsPage;