// pages/Admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminService from '../../../api/adminService';
import { financeService, type FinanceDashboardResponse } from '../../../api/paymentService';
import { journalService } from '../../../api/journalService';
import type { StudentListItemResponse, MentorListItemResponse, UserResponse } from '../../../types/admin';
import type { AttendanceSummaryResponse } from '../../../types/journal';
import MetricCard from '../../../components/ui/MetricCard';
import { Activity, ArrowRight, DollarSign, UserCheck, UserX, Clock, Calendar, AlertCircle } from 'lucide-react';
import type { PaymentListItem } from '../../../types/finance';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState<StudentListItemResponse[]>([]);
    const [mentors, setMentors] = useState<MentorListItemResponse[]>([]);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [payments, setPayments] = useState<PaymentListItem[]>([]);
    const [financeDashboard, setFinanceDashboard] = useState<FinanceDashboardResponse | null>(null);
    const [attendance, setAttendance] = useState<AttendanceSummaryResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Фильтр даты (По умолчанию сегодняшняя дата в формате YYYY-MM-DD)
    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

    // Управление вкладками внутри блока посещаемости
    const [activeTab, setActiveTab] = useState<'absent' | 'late'>('absent');

    // 1. Первоначальный сбор статических данных дашборда
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const [studentsRes, mentorsRes, usersRes, paymentsRes, dashboardRes] = await Promise.all([
                    adminService.getStudents(),
                    adminService.getMentors(),
                    adminService.getUsers(),
                    financeService.getAll().catch(() => ({ isSuccess: false, data: [] })),
                    financeService.getDashboard().catch(() => ({ isSuccess: false, data: null })),
                ]);

                if (studentsRes.data && studentsRes.data.isSuccess) {
                    const pagedData = studentsRes.data.data;
                    const studentsArray = pagedData && 'items' in pagedData ? pagedData.items : [];
                    setStudents(Array.isArray(studentsArray) ? studentsArray : []);
                }

                if (mentorsRes.data && mentorsRes.data.isSuccess) {
                    const pagedData = mentorsRes.data.data;
                    const mentorsArray = pagedData && 'items' in pagedData ? pagedData.items : [];
                    setMentors(Array.isArray(mentorsArray) ? mentorsArray : []);
                }

                if (usersRes.data && usersRes.data.isSuccess) {
                    const userData = usersRes.data.data;
                    const usersArray = userData && typeof userData === 'object' && 'items' in userData
                        ? (userData as any).items
                        : userData;
                    setUsers(Array.isArray(usersArray) ? usersArray : []);
                }

                if (paymentsRes.isSuccess && paymentsRes.data) {
                    setPayments(paymentsRes.data);
                }

                if (dashboardRes.isSuccess && dashboardRes.data) {
                    setFinanceDashboard(dashboardRes.data);
                }

            } catch (err) {
                console.error("Ошибка при загрузке базовых метрик дашборда:", err);
                setError("Не удалось синхронизировать данные системы");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // 2. Изолированная динамическая загрузка посещаемости при изменении даты фильтра
    useEffect(() => {
        const fetchAttendanceData = async () => {
            try {
                setLoadingAttendance(true);
                const attendanceRes = await journalService.getSummary(selectedDate).catch(() => ({ isSuccess: false, data: null }));

                if (attendanceRes.isSuccess && attendanceRes.data) {
                    setAttendance(attendanceRes.data);
                } else {
                    setAttendance(null);
                }
            } catch (err) {
                console.error("Ошибка при загрузке статистики посещаемости:", err);
            } finally {
                setLoadingAttendance(false);
            }
        };

        fetchAttendanceData();
    }, [selectedDate]);

    if (loading) return <div style={styles.centeredState}>Загрузка аналитических данных...</div>;
    if (error) return <div style={{ ...styles.centeredState, color: '#ef4444' }}>{error}</div>;

    // ВЫРУЧКА: берём готовое значение из бэкенда (тот же источник что и в Finance)
    const totalRevenue = financeDashboard?.totalBalance ?? 0;

    const activeStudentsCount = students.filter(s => s.isActive).length;

    // Хелпер форматирования времени отметки
    const formatMarkedTime = (dateStr: string | Date) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={styles.dashboardContainer}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.pageTitle}>Аналитика платформы</h1>
                    <p style={styles.pageSubtitle}>Контролируйте операционные показатели EduCRM в реальном времени</p>
                </div>
            </header>

            {/* Сетка аналитических карточек */}
            <div style={styles.statsGrid}>
                <div
                    onClick={() => navigate('/admin/finance')}
                    style={{ cursor: 'pointer', flex: '1 1 240px', minWidth: '240px' }}
                    title="Перейти к управлению способами оплаты"
                >
                    <MetricCard
                        value={`${totalRevenue.toLocaleString()} TJS`}
                        label="Общая выручка"
                        subLabel="Сумма всех подтвержденных оплат"
                        isMain={true}
                    />
                </div>

                <MetricCard
                    value={students.length}
                    label="Студенты"
                    subLabel={`${activeStudentsCount} активных профилей`}
                    variant="purple"
                />
                <MetricCard
                    value={mentors.length}
                    label="Менторы"
                    subLabel="Академический персонал"
                    variant="blue"
                />
                <MetricCard
                    value={users.length}
                    label="Пользователи"
                    subLabel="Регистрации в системе"
                    variant="amber"
                />
            </div>

            {/* Модуль посещаемости с фильтрацией по дате */}
            <div style={styles.attendanceSection}>
                <div style={styles.attendanceHeaderBlock}>
                    <div style={styles.titleWithIcon}>
                        <div style={{ ...styles.iconBadge, backgroundColor: '#ECFDF5', color: '#10B981' }}>
                            <UserCheck size={18} />
                        </div>
                        <div>
                            <h3 style={styles.sectionTitle}>Журнал посещаемости</h3>
                            <p style={styles.sectionSubtitle}>Статистика визитов и опозданий за выбранный день</p>
                        </div>
                    </div>

                    {/* Панель фильтра даты */}
                    <div style={styles.filterWrapper}>
                        <Calendar size={16} color="#64748B" style={{ marginRight: '-4px' }} />
                        <span style={styles.filterLabel}>Дата контроля:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={styles.datePickerInput}
                        />
                    </div>
                </div>

                {loadingAttendance ? (
                    <div style={styles.attendanceLoader}>Обновление метрик посещаемости...</div>
                ) : (
                    <>
                        {/* Информационные счетчики дня */}
                        <div style={styles.attCounters}>
                            <div style={{ ...styles.attCounter, background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
                                <UserCheck size={20} color="#10B981" />
                                <div>
                                    <div style={{ ...styles.attCountValue, color: '#10B981' }}>
                                        {attendance?.present ?? 0}
                                    </div>
                                    <div style={styles.attCountLabel}>Присутствуют</div>
                                </div>
                            </div>
                            <div style={{ ...styles.attCounter, background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                                <UserX size={20} color="#EF4444" />
                                <div>
                                    <div style={{ ...styles.attCountValue, color: '#EF4444' }}>
                                        {attendance?.absent ?? 0}
                                    </div>
                                    <div style={styles.attCountLabel}>Отсутствуют</div>
                                </div>
                            </div>
                            <div style={{ ...styles.attCounter, background: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                                <Clock size={20} color="#F59E0B" />
                                <div>
                                    <div style={{ ...styles.attCountValue, color: '#F59E0B' }}>
                                        {attendance?.late ?? 0}
                                    </div>
                                    <div style={styles.attCountLabel}>Опоздали</div>
                                </div>
                            </div>
                        </div>

                        {/* Интерактивный переключатель списков нарушений */}
                        <div style={styles.tabContainer}>
                            <button
                                style={{
                                    ...styles.tabButton,
                                    ...(activeTab === 'absent' ? styles.tabButtonActiveAbsent : {})
                                }}
                                onClick={() => setActiveTab('absent')}
                            >
                                <UserX size={14} style={{ marginRight: '6px' }} />
                                Отсутствующие ({attendance?.recentAbsent?.length ?? 0})
                            </button>
                            <button
                                style={{
                                    ...styles.tabButton,
                                    ...(activeTab === 'late' ? styles.tabButtonActiveLate : {})
                                }}
                                onClick={() => setActiveTab('late')}
                            >
                                <Clock size={14} style={{ marginRight: '6px' }} />
                                Опоздавшие ({attendance?.recentLate?.length ?? 0})
                            </button>
                        </div>

                        {/* Списочный вывод в зависимости от активного таба */}
                        <div style={{ marginTop: '12px' }}>
                            {activeTab === 'absent' ? (
                                attendance && attendance.recentAbsent && attendance.recentAbsent.length > 0 ? (
                                    <div style={styles.tableWrapper}>
                                        <table style={styles.table}>
                                            <thead>
                                                <tr style={styles.thRow}>
                                                    <th style={styles.th}>Студент</th>
                                                    <th style={styles.th}>Группа</th>
                                                    <th style={styles.th}>Ментор</th>
                                                    <th style={styles.th}>Занятие / Урок</th>
                                                    <th style={styles.th}>Время отметки</th>
                                                    <th style={styles.th}>Обоснование / Причина</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendance.recentAbsent.map((a, i) => (
                                                    <tr key={i} style={styles.tr}>
                                                        <td style={styles.studentTd}>
                                                            {a.studentFullName}
                                                        </td>
                                                        <td style={styles.td}>
                                                            <Link
                                                                to={`/admin/groups/${a.groupId}/journal`}
                                                                style={styles.groupLink}
                                                            >
                                                                {a.groupName}
                                                            </Link>
                                                        </td>
                                                        <td style={styles.td}>
                                                            {a.mentorFullName ? (
                                                                <Link to={`/admin/users/${a.mentorUserId}`} style={styles.mentorLink}>
                                                                    {a.mentorFullName}
                                                                </Link>
                                                            ) : (
                                                                <span style={styles.noMentorText}>Не назначен</span>
                                                            )}
                                                        </td>
                                                        <td style={styles.lessonTd}>{a.lessonTitle}</td>
                                                        <td style={styles.timeTd}>
                                                            {formatMarkedTime(a.markedAt)}
                                                        </td>
                                                        <td style={styles.td}>
                                                            <span style={styles.reasonBadge}>
                                                                {a.reason || 'Причина не указана'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={styles.emptyStateContainer}>
                                        <AlertCircle size={20} color="#94A3B8" />
                                        <span style={{ marginLeft: '8px' }}>За эту дату пропусков занятий не зарегистрировано</span>
                                    </div>
                                )
                            ) : (
                                attendance && attendance.recentLate && attendance.recentLate.length > 0 ? (
                                    <div style={styles.tableWrapper}>
                                        <table style={styles.table}>
                                            <thead>
                                                <tr style={styles.thRow}>
                                                    <th style={styles.th}>Студент</th>
                                                    <th style={styles.th}>Группа</th>
                                                    <th style={styles.th}>Ментор</th>
                                                    <th style={styles.th}>Занятие / Урок</th>
                                                    <th style={styles.th}>Время прихода</th>
                                                    <th style={styles.th}>Тайминг опоздания</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendance.recentLate.map((a, i) => (
                                                    <tr key={i} style={styles.tr}>
                                                        <td style={styles.studentTd}>
                                                            {a.studentFullName}
                                                        </td>
                                                        <td style={styles.td}>
                                                            <Link
                                                                to={`/admin/groups/${a.groupId}/journal`}
                                                                style={styles.groupLink}
                                                            >
                                                                {a.groupName}
                                                            </Link>
                                                        </td>
                                                        <td style={styles.td}>
                                                            {a.mentorFullName ? (
                                                                <Link to={`/admin/users/${a.mentorUserId}`} style={styles.mentorLink}>
                                                                    {a.mentorFullName}
                                                                </Link>
                                                            ) : (
                                                                <span style={styles.noMentorText}>Не назначен</span>
                                                            )}
                                                        </td>
                                                        <td style={styles.lessonTd}>{a.lessonTitle}</td>
                                                        <td style={styles.timeTd}>
                                                            {formatMarkedTime(a.markedAt)}
                                                        </td>
                                                        <td style={styles.td}>
                                                            <span style={styles.lateMinutesBadge}>
                                                                +{a.lateMinutes} минут
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={styles.emptyStateContainer}>
                                        <AlertCircle size={20} color="#94A3B8" />
                                        <span style={{ marginLeft: '8px' }}>За эту дату опозданий среди студентов не зафиксировано</span>
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Дополнительные интерактивные таблицы */}
            <div style={styles.contentLayout}>

                {/* Блок пользователей */}
                <div style={styles.tableSection}>
                    <div style={styles.tableHeaderSection}>
                        <div style={styles.titleWithIcon}>
                            <div style={{ ...styles.iconBadge, backgroundColor: '#EEF2FF', color: '#6366F1' }}>
                                <Activity size={18} />
                            </div>
                            <h3 style={styles.sectionTitle}>Последняя активность</h3>
                        </div>
                        <span style={styles.countBadge}>{users.length} чел.</span>
                    </div>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Оператор</th>
                                    <th style={styles.th}>Роль</th>
                                    <th style={styles.th}>Доступ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.slice(0, 5).map((user) => {
                                    const userGlow = user.role === 'Admin'
                                        ? 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)'
                                        : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)';

                                    return (
                                        <tr key={user.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <div style={styles.userMeta}>
                                                    <div style={{ ...styles.avatarPlaceholder, background: userGlow }}>
                                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <div style={styles.userName}>{user.fullName}</div>
                                                        <div style={styles.userEmail}>{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.roleBadge,
                                                    backgroundColor: user.role === 'Admin' ? '#FEF2F2' : '#EFF6FF',
                                                    color: user.role === 'Admin' ? '#EF4444' : '#3B82F6',
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.statusRow}>
                                                    <span style={{
                                                        ...styles.pulseDot,
                                                        backgroundColor: user.isActive ? '#34C759' : '#94A3B8',
                                                        boxShadow: user.isActive ? '0 0 10px rgba(52, 199, 89, 0.4)' : 'none'
                                                    }} />
                                                    <span style={{ fontWeight: 600, fontSize: '13px', color: user.isActive ? '#0F172A' : '#64748B' }}>
                                                        {user.isActive ? 'Active' : 'Offline'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Блок балансов студентов */}
                <div style={styles.tableSection}>
                    <div style={styles.tableHeaderSection}>
                        <div style={styles.titleWithIcon}>
                            <div style={{ ...styles.iconBadge, backgroundColor: '#ECFDF5', color: '#10B981' }}>
                                <DollarSign size={18} />
                            </div>
                            <h3 style={styles.sectionTitle}>Финансовый комплаенс</h3>
                        </div>
                        <span style={{ ...styles.countBadge, backgroundColor: '#E0F2FE', color: '#0369A1' }}>Дебет</span>
                    </div>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Студент</th>
                                    <th style={styles.th}>Статус счета</th>
                                    <th style={{ ...styles.th, textAlign: 'right' }}>Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.slice(0, 5).map((student) => (
                                    <tr key={student.id} style={styles.tr}>
                                        <td style={{ ...styles.td, fontWeight: 700, color: '#0F172A' }}>{student.fullName}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.balanceText,
                                                backgroundColor: student.balance < 0 ? '#FEF2F2' : '#F0FDF4',
                                                color: student.balance < 0 ? '#EF4444' : '#10B981',
                                                border: `1px solid ${student.balance < 0 ? '#FEE2E2' : '#DCFCE7'}`
                                            }}>
                                                {student.balance !== undefined ? student.balance.toLocaleString() : 0} TJS
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, textAlign: 'right' }}>
                                            <button
                                                style={styles.actionBtn}
                                                onClick={() => navigate(`/admin/users/${student.userId || student.id}`)}
                                                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                    e.currentTarget.style.backgroundColor = '#EEF2FF';
                                                    e.currentTarget.style.color = '#6366F1';
                                                }}
                                                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                                                    e.currentTarget.style.color = '#334155';
                                                }}
                                            >
                                                <span>Управление</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Полный объект стилей без обрывов
const styles = {
    dashboardContainer: { padding: '32px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", backgroundColor: '#F8FAFC', minHeight: '100vh', boxSizing: 'border-box' as const },
    header: { marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    pageTitle: { fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' },
    pageSubtitle: { fontSize: '14px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 500 },
    statsGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '20px', marginBottom: '32px', width: '100%' },

    attendanceSection: { backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.06)', marginBottom: '32px' },
    attendanceHeaderBlock: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '16px', marginBottom: '24px' },
    sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 },
    sectionSubtitle: { fontSize: '12px', color: '#64748B', margin: '2px 0 0 0', fontWeight: 400 },

    filterWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F1F5F9', padding: '6px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' },
    filterLabel: { fontSize: '13px', fontWeight: 600, color: '#475569' },
    datePickerInput: { border: 'none', background: 'transparent', color: '#0F172A', fontWeight: 700, fontSize: '13px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' },
    attendanceLoader: { padding: '40px', textAlign: 'center' as const, color: '#6366F1', fontSize: '14px', fontWeight: 600 },

    tabContainer: { display: 'flex', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' },
    tabButton: { display: 'flex', alignItems: 'center', padding: '8px 14px', border: 'none', background: '#F8FAFC', color: '#64748B', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' },
    tabButtonActiveAbsent: { background: '#FEF2F2', color: '#EF4444' },
    tabButtonActiveLate: { background: '#FFFBEB', color: '#D97706' },

    attCounters: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const, marginBottom: '20px' },
    attCounter: { flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '16px' },
    attCountValue: { fontSize: '20px', fontWeight: 800, lineHeight: 1 },
    attCountLabel: { fontSize: '12px', color: '#64748B', fontWeight: 500, marginTop: '2px' },

    contentLayout: { display: 'flex', flexWrap: 'wrap' as const, gap: '24px', width: '100%' },
    tableSection: { backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.06)', flex: '1 1 480px', minWidth: '320px' },
    tableHeaderSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    titleWithIcon: { display: 'flex', alignItems: 'center', gap: '12px' },
    iconBadge: { padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    countBadge: { fontSize: '12px', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '8px' },

    tableWrapper: { width: '100%', overflowX: 'auto' as const, border: '1px solid #F1F5F9', borderRadius: '14px' },
    table: { width: '100%', borderCollapse: 'collapse' as const, textAlign: 'left' as const },
    thRow: { backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' },
    th: { padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' as const },
    tr: { borderBottom: '1px solid #F8FAFC', transition: 'background-color 0.2s' },
    td: { padding: '14px 16px', fontSize: '13px', color: '#334155', verticalAlign: 'middle' },

    studentTd: { padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#0F172A' },
    lessonTd: { padding: '14px 16px', fontSize: '13px', color: '#475569', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    timeTd: { padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#0F172A' },

    groupLink: { color: '#2563EB', textDecoration: 'none', fontWeight: 600 },
    mentorLink: { color: '#4F46E5', textDecoration: 'none', fontWeight: 500 },
    noMentorText: { color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' },
    reasonBadge: { backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 500 },
    lateMinutesBadge: { backgroundColor: '#FFFBEB', color: '#D97706', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: '1px solid #FEF3C7' },

    userMeta: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatarPlaceholder: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '12px', fontWeight: 700 },
    userName: { fontSize: '13px', fontWeight: 600, color: '#0F172A' },
    userEmail: { fontSize: '11px', color: '#64748B', marginTop: '1px' },
    roleBadge: { padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-block' },

    statusRow: { display: 'flex', alignItems: 'center', gap: '6px' },
    pulseDot: { width: '7px', height: '7px', borderRadius: '50%' },
    balanceText: { padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'inline-block' },

    actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', backgroundColor: '#F8FAFC', color: '#334155', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
    emptyStateContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', color: '#64748B', fontSize: '13px', fontWeight: 500, backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0' },
    centeredState: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', fontSize: '15px', fontWeight: 600, color: '#64748B' }
};

export default AdminDashboard;