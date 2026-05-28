import React, { useEffect, useState } from 'react';
import adminService from '../../../api/adminService';
import type { StudentListItemResponse } from '../../../types/admin';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import MetricCard from '../../../components/ui/MetricCard';
import UserCard from '../../../components/ui/UserCard';
import { useNavigate } from 'react-router-dom';

const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<StudentListItemResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 6;
    const navigate = useNavigate();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [createFormData, setCreateFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: ''
    });

    const fetchStudents = async () => {
        try {
            setLoading(true);
            let isActiveParam: boolean | null = null;
            if (statusFilter === 'active') isActiveParam = true;
            if (statusFilter === 'inactive') isActiveParam = false;

            const response = await adminService.getStudents(
                currentPage,
                pageSize,
                searchTerm,
                isActiveParam
            );

            if (response.data && response.data.isSuccess) {
                setStudents(response.data.data.items || []);
                const data = response.data.data;
                if (data) {
                    const pages = Math.ceil(data.totalCount / data.pageSize) || 1;
                    setTotalPages(pages);
                } setTotalItems(response.data.data.totalCount || 0);
                setError(null);
            } else {
                setError("Не удалось корректно прочитать данные студентов");
            }
        } catch (err) {
            console.error("Ошибка загрузки студентов:", err);
            setError("Ошибка при подключении к серверу студентов");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchStudents();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchTerm, statusFilter]);

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
        setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: nextStatus } : s));

        try {
            const response = await adminService.setStudentStatus(id, nextStatus);
            if (!response.data || !response.data.isSuccess) {
                setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: currentStatus } : s));
            }
        } catch (err) {
            console.error("Не удалось обновить статус студента:", err);
            setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: currentStatus } : s));
        }
    };

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        try {
            const response = await adminService.registerUser({
                firstName: createFormData.firstName,
                lastName: createFormData.lastName,
                email: createFormData.email,
                phoneNumber: createFormData.phoneNumber,
                roleId: 3
            });

            if (response.data && response.data.isSuccess) {
                setIsCreateModalOpen(false);
                setCreateFormData({ firstName: '', lastName: '', email: '', phoneNumber: '' });
                fetchStudents();
            } else {
                setFormError(response.data.message || "Не удалось зарегистрировать студента");
            }
        } catch (err) {
            console.error("Ошибка регистрации:", err);
            setFormError("Не удалось связаться с сервером");
        }
    };

    const totalStudents = totalItems;
    const activeStudentsOnPage = students.filter(s => s.isActive).length;
    const frozenStudentsOnPage = students.length - activeStudentsOnPage;
    const totalBalanceOnPage = students.reduce((sum, s) => sum + (s.balance || 0), 0);
    const avgBalance = students.length > 0 ? (totalBalanceOnPage / students.length).toFixed(0) : "0";

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>Управление студентами</h2>
                    <p style={styles.subtitle}>Мониторинг активности учащихся, балансов и прав доступа</p>
                </div>
            </div>

            {/* Блок метрик с идеально ровными карточками */}
            <div style={styles.metricsWrapper}>
                <div
                    onClick={() => setIsCreateModalOpen(true)}
                    style={styles.metricCardGridWrapperClickable}
                >
                    <MetricCard
                        isMain
                        value={totalStudents}
                        label="ВСЕГО СТУДЕНТОВ"
                        subLabel="Нажмите, чтобы добавить"
                    />
                </div>

                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="green" value={activeStudentsOnPage} label="АКТИВНЫЕ НА СТР." subLabel="Доступ открыт" />
                </div>

                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="amber" value={frozenStudentsOnPage} label="ЗАМОРОЖЕННЫЕ НА СТР." subLabel="Доступ ограничен" />
                </div>

                <div style={styles.metricCardGridWrapper}>
                    <MetricCard variant="blue" value={`${avgBalance} TJS`} label="БАЛАНС СТРАНИЦЫ" subLabel="Сумма средств на странице" />
                </div>
            </div>

            <div style={styles.toolbar}>
                <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Поиск по имени или email..."
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
                <div style={styles.centerMessage}>Загрузка списка студентов...</div>
            ) : error ? (
                <div style={{ ...styles.centerMessage, color: '#ef4444' }}>{error}</div>
            ) : (
                <>
                    <div style={styles.gridContainer}>
                        {students.map((student) => {
                            const displayName = student.fullName || "Без имени";

                            return (
                                <UserCard
                                    key={student.id}
                                    id={student.userId}  // Используется внутри карточки
                                    name={displayName}
                                    email={student.email}
                                    role="student"
                                    balance={student.balance}
                                    isActive={student.isActive}

                                    // 🎯 Для изменения статуса студента передаем именно его student.id
                                    onStatusToggle={() => handleStatusToggle(student.id, student.isActive)}

                                    // 🎯 Для страницы деталей передаем userId в URL, а student.id (как studentId) в state
                                    onView={() => navigate(`/admin/users/${student.userId}`, {
                                        state: { studentId: student.id }
                                    })}
                                />
                            );
                        })}
                    </div>

                    {students.length === 0 && (
                        <div style={styles.emptyState}>Студенты по вашему запросу не найдены</div>
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

            {isCreateModalOpen && (
                <div style={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button style={styles.closeBtn} onClick={() => setIsCreateModalOpen(false)}>
                            <X size={20} />
                        </button>

                        <h3 style={styles.modalTitle}>Регистрация студента</h3>
                        <p style={styles.modalSubtitle}>Новый учащийся получит временный пароль на указанную почту.</p>

                        {formError && <div style={styles.formErrorBox}>{formError}</div>}

                        <form onSubmit={handleCreateStudent} style={styles.formContainer}>
                            <div style={styles.rowInputs}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>ИМЯ</label>
                                    <input
                                        type="text"
                                        required
                                        style={styles.modalInput}
                                        placeholder="Иван"
                                        value={createFormData.firstName}
                                        onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                                    />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.inputLabel}>ФАМИЛИЯ</label>
                                    <input
                                        type="text"
                                        required
                                        style={styles.modalInput}
                                        placeholder="Иванов"
                                        value={createFormData.lastName}
                                        onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>EMAIL (ЭЛЕКТРОННАЯ ПОЧТА)</label>
                                <input
                                    type="email"
                                    required
                                    style={styles.modalInput}
                                    placeholder="test@gmail.com"
                                    value={createFormData.email}
                                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.inputLabel}>НОМЕР ТЕЛЕФОНА</label>
                                <input
                                    type="text"
                                    required
                                    style={styles.modalInput}
                                    placeholder="+992914241321"
                                    value={createFormData.phoneNumber}
                                    onChange={(e) => setCreateFormData({ ...createFormData, phoneNumber: e.target.value })}
                                />
                            </div>

                            <button type="submit" style={styles.submitBtn}>
                                Зарегистрировать
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

    // Сетка для верхних карточек метрик
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

export default StudentsPage;