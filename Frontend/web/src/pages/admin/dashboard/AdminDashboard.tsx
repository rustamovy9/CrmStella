import React, { useEffect, useState } from 'react';
import adminService from '../../../api/adminService';
import type { StudentListItemResponse, MentorListItemResponse, UserResponse } from '../../../types/admin';
import MetricCard from '../../../components/ui/MetricCard';

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

                if (studentsRes.data.isSuccess) setStudents(studentsRes.data.data);
                if (mentorsRes.data.isSuccess) setMentors(mentorsRes.data.data);
                if (usersRes.data.isSuccess) setUsers(usersRes.data.data);
            } catch (err) {
                setError("Не удалось синхронизировать данные");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div style={styles.centeredState}>Загрузка космического UI...</div>;
    if (error) return <div style={{...styles.centeredState, color: '#ef4444'}}>{error}</div>;

    const totalSchoolBalance = students.reduce((sum, current) => sum + current.balance, 0);

    return (
        <div style={styles.dashboardContainer}>
            {/* Декоративный размытый круг на фоне самого дашборда для ощущения глубины */}
            <div style={styles.ambientGlow} />

            <header style={styles.header}>
                <div style={styles.badgeTop}>Система активна</div>
                <h1 style={styles.pageTitle}>Аналитика платформы</h1>
                <p style={styles.pageSubtitle}>Контролируйте операционные показатели EduCRM в реальном времени</p>
            </header>

            {/* Сетка асимметричных карточек */}
            <div style={styles.statsGrid}>
                {/* Главная карточка — Баланс */}
                <MetricCard 
                    value={`${totalSchoolBalance.toLocaleString()} $`} 
                    label="Общий баланс" 
                    subLabel="Суммарный объем средств на счетах"
                    isMain={true} 
                />
                <MetricCard 
                    value={students.length} 
                    label="Студенты" 
                    subLabel={`${students.filter(s=>s.isActive).length} активных сейчас`}
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

            {/* Секция интерактивных таблиц */}
            <div style={styles.contentLayout}>
                
                {/* Блок пользователей */}
                <div style={styles.tableSection}>
                    <div style={styles.tableHeaderSection}>
                        <h3 style={styles.sectionTitle}>Последняя активность</h3>
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
                                {users.slice(0, 5).map((user) => (
                                    <tr key={user.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.userMeta}>
                                                <div style={styles.avatarPlaceholder}>
                                                    {user.fullName.charAt(0)}
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
                                                backgroundColor: user.role === 'Admin' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                                                color: user.role === 'Admin' ? '#EF4444' : '#3B82F6',
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.statusRow}>
                                                <span style={{...styles.pulseDot, backgroundColor: user.isActive ? '#10B981' : '#94A3B8'}} />
                                                <span style={{fontWeight: 500, fontSize: '0.8rem'}}>{user.isActive ? 'Active' : 'Offline'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Блок балансов */}
                <div style={styles.tableSection}>
                    <div style={styles.tableHeaderSection}>
                        <h3 style={styles.sectionTitle}>Финансовый комплаенс</h3>
                        <span style={{...styles.countBadge, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981'}}>Дебет</span>
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
                                        <td style={{...styles.td, fontWeight: 600, color: '#0F172A'}}>{student.fullName}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.balanceText,
                                                color: student.balance < 0 ? '#EF4444' : '#10B981'
                                            }}>
                                                {student.balance.toLocaleString()} $
                                            </span>
                                        </td>
                                        <td style={{...styles.td, textAlign: 'right'}}>
                                            <button style={styles.actionBtn}>Управление</button>
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
        padding: '3rem 2.5rem',
        backgroundColor: '#FAFBFC',
        boxSizing: 'border-box' as const,
        width: '100%',
        position: 'relative' as const,
        overflow: 'hidden',
        fontFamily: "'Geist', sans-serif",
    },
    ambientGlow: {
        position: 'absolute' as const,
        top: '-100px',
        left: '40%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, rgba(255,255,255,0) 70%)',
        zIndex: 0,
        pointerEvents: 'none' as const,
    },
    centeredState: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        fontSize: '1.2rem',
        fontWeight: 600,
        color: '#64748B',
    },
    header: {
        marginBottom: '3rem',
        position: 'relative' as const,
        zIndex: 1,
    },
    badgeTop: {
        display: 'inline-block',
        padding: '4px 12px',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        color: '#10B981',
        fontSize: '0.72rem',
        fontWeight: '700',
        borderRadius: '30px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
        marginBottom: '0.75rem',
    },
    pageTitle: {
        fontSize: '2.4rem',
        fontWeight: '800',
        color: '#0F172A',
        margin: 0,
        letterSpacing: '-0.04em',
    },
    pageSubtitle: {
        fontSize: '1rem',
        color: '#475569',
        fontWeight: '400',
        marginTop: '0.5rem',
        marginBottom: 0
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '2rem',
        marginBottom: '3.5rem',
        width: '100%',
        position: 'relative' as const,
        zIndex: 1,
    },
    contentLayout: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
        gap: '2rem',
        width: '100%',
        position: 'relative' as const,
        zIndex: 1,
    },
    tableSection: {
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.02), 0 0 0 1px rgba(15, 23, 42, 0.03)',
        minWidth: 0,
    },
    tableHeaderSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
    },
    sectionTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: '-0.02em',
        margin: 0,
    },
    countBadge: {
        fontSize: '0.75rem',
        fontWeight: '700',
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
        padding: '0 1rem 1rem 1rem',
        fontSize: '0.72rem',
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em'
    },
    tr: {
        borderBottom: '1px solid #F8FAFC',
        transition: 'background-color 0.2s ease',
        ':hover': { backgroundColor: '#FAFBFC' }
    },
    td: {
        padding: '1.2rem 1rem',
        fontSize: '0.88rem',
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
        width: '36px',
        height: '36px',
        borderRadius: '12px',
        backgroundColor: '#F1F5F9',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '0.9rem',
    },
    userName: {
        fontWeight: '600',
        color: '#0F172A',
    },
    userEmail: {
        fontSize: '0.78rem',
        color: '#64748B',
        marginTop: '2px',
    },
    roleBadge: {
        padding: '5px 12px',
        borderRadius: '10px',
        fontSize: '0.75rem',
        fontWeight: '700',
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
        fontWeight: '700',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '1rem',
    },
    actionBtn: {
        padding: '8px 16px',
        border: 'none',
        backgroundColor: '#F1F5F9',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#1E293B',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': { backgroundColor: '#E2E8F0' }
    }
};

export default AdminDashboard;