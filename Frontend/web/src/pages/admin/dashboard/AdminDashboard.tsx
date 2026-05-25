import React, { useEffect, useState } from 'react';
import adminService from '../../../api/adminService';
import type { StudentListItemResponse, MentorListItemResponse, UserResponse } from '../../../types/admin';
import MetricCard from '../../../components/ui/MetricCard';
import { Activity, ArrowRight, DollarSign } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const [students, setStudents] = useState<StudentListItemResponse[]>([]);
    const [mentors, setMentors] = useState<MentorListItemResponse[]>([]);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [studentsRes, mentorsRes, usersRes] = await Promise.all([
                    adminService.getStudents(),
                    adminService.getMentors(),
                    adminService.getUsers()
                ]);

                // 🔹 ИСПРАВЛЕНО: Достаем массив студентов из PagedResult (.items)
                if (studentsRes.data && studentsRes.data.isSuccess) {
                    const pagedData = studentsRes.data.data;
                    const studentsArray = pagedData && 'items' in pagedData ? pagedData.items : [];
                    setStudents(Array.isArray(studentsArray) ? studentsArray : []);
                }
                
                // 🔹 ИСПРАВЛЕНО: Достаем массив менторов из PagedResult (.items)
                if (mentorsRes.data && mentorsRes.data.isSuccess) {
                    const pagedData = mentorsRes.data.data;
                    const mentorsArray = pagedData && 'items' in pagedData ? pagedData.items : [];
                    setMentors(Array.isArray(mentorsArray) ? mentorsArray : []);
                }
                
                // 🔹 ИСПРАВЛЕНО: Безопасное извлечение для пользователей (на случай, если там тоже пагинация)
                if (usersRes.data && usersRes.data.isSuccess) {
                    const userData = usersRes.data.data;
                    const usersArray = userData && typeof userData === 'object' && 'items' in userData 
                        ? (userData as any).items 
                        : userData;
                    setUsers(Array.isArray(usersArray) ? usersArray : []);
                }
            } catch (err) {
                console.error("Ошибка при загрузке дашборда:", err);
                setError("Не удалось синхронизировать данные");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div style={styles.centeredState}>Загрузка аналитических данных...</div>;
    if (error) return <div style={{...styles.centeredState, color: '#ef4444'}}>{error}</div>;

    const totalSchoolBalance = students.reduce((sum, current) => sum + (current.balance || 0), 0);
    const activeStudentsCount = students.filter(s => s.isActive).length;

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
                <MetricCard 
                    value={`${totalSchoolBalance.toLocaleString()} TJS`} 
                    label="Общий баланс" 
                    subLabel="Суммарный объем средств учащихся"
                    isMain={true} 
                />
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

            {/* Интерактивные таблицы */}
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

                {/* Блок балансов */}
                <div style={styles.tableSection}>
                    <div style={styles.tableHeaderSection}>
                        <div style={styles.titleWithIcon}>
                            <div style={{ ...styles.iconBadge, backgroundColor: '#ECFDF5', color: '#10B981' }}>
                                <DollarSign size={18} />
                            </div>
                            <h3 style={styles.sectionTitle}>Финансовый комплаенс</h3>
                        </div>
                        <span style={{...styles.countBadge, backgroundColor: '#E0F2FE', color: '#0369A1'}}>Дебет</span>
                    </div>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Студент</th>
                                    <th style={styles.th}>Статус счета</th>
                                    <th style={{...styles.th, textAlign: 'right'}}>Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.slice(0, 5).map((student) => (
                                    <tr key={student.id} style={styles.tr}>
                                        <td style={{...styles.td, fontWeight: 700, color: '#0F172A'}}>{student.fullName}</td>
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
                                        <td style={{...styles.td, textAlign: 'right'}}>
                                            <button 
                                                style={styles.actionBtn}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#EEF2FF';
                                                    e.currentTarget.style.color = '#6366F1';
                                                }}
                                                onMouseLeave={(e) => {
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

const styles = {
    dashboardContainer: {
        padding: '32px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
        boxSizing: 'border-box' as const,
    },
    header: {
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pageTitle: {
        fontSize: '26px',
        fontWeight: 700,
        color: '#0F172A',
        margin: 0,
        letterSpacing: '-0.02em',
    },
    pageSubtitle: {
        fontSize: '14px',
        color: '#64748B',
        margin: '4px 0 0 0',
        fontWeight: 500,
    },
    statsGrid: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '20px',
        marginBottom: '32px',
        width: '100%',
    },
    contentLayout: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 540px), 1fr))',
        gap: '24px',
        width: '100%',
    },
    tableSection: {
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.06)',
        minWidth: 0,
    },
    tableHeaderSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    titleWithIcon: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    iconBadge: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: 700,
        color: '#0F172A',
        letterSpacing: '-0.01em',
        margin: 0,
    },
    countBadge: {
        fontSize: '12px',
        fontWeight: 700,
        padding: '4px 10px',
        backgroundColor: '#F1F5F9',
        color: '#475569',
        borderRadius: '8px',
    },
    tableWrapper: {
        width: '100%',
        overflowX: 'auto' as const,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
    },
    thRow: {
        borderBottom: '1px solid #F1F5F9',
    },
    th: {
        padding: '0 12px 12px 12px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#94A3B8',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        textAlign: 'left' as const,
    },
    tr: {
        borderBottom: '1px solid #F8FAFC',
    },
    td: {
        padding: '14px 12px',
        fontSize: '14px',
        color: '#334155',
        whiteSpace: 'nowrap' as const,
        verticalAlign: 'middle',
    },
    userMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatarPlaceholder: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '14px',
        boxShadow: '0 4px 10px rgba(15, 23, 42, 0.1)',
    },
    userName: {
        fontWeight: 700,
        color: '#0F172A',
    },
    userEmail: {
        fontSize: '12px',
        color: '#64748B',
        marginTop: '1px',
    },
    roleBadge: {
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.02em',
    },
    statusRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    pulseDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
    },
    balanceText: {
        fontWeight: 700,
        fontSize: '13px',
        padding: '6px 12px',
        borderRadius: '10px',
        display: 'inline-block',
    },
    actionBtn: {
        padding: '8px 14px',
        border: 'none',
        backgroundColor: '#F8FAFC',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#334155',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
    },
    centeredState: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        fontSize: '15px',
        fontWeight: 600,
        color: '#64748B',
    }
};

export default AdminDashboard;