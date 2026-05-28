import React, { useEffect, useState } from 'react';
import adminService from '../../../api/adminService';
import type { UserResponse } from '../../../types/admin';

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Состояния для фильтрации и поиска
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('All');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await adminService.getUsers();
            if (response.data.isSuccess) {
                setUsers(response.data.data);
            }
        } catch (err) {
            setError('Не удалось загрузить реестр пользователей');
        } finally {
            setLoading(false);
        }
    };

    // Переключение активности пользователя
    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const nextStatus = !currentStatus;
            const res = await adminService.setUserActiveStatus(id, nextStatus); if (res.data.isSuccess) {
                setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: nextStatus } : u));
            }
        } catch (err) {
            alert('Ошибка при изменении статуса пользователя');
        }
    };

    // Удаление пользователя
    const handleDeleteUser = async (id: number, name: string) => {
        if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${name}?`)) return;

        try {
            const res = await adminService.deleteUser(id);
            if (res.data.isSuccess) {
                setUsers(prev => prev.filter(u => u.id !== id));
            }
        } catch (err) {
            alert('Не удалось удалить пользователя. Возможно, он связан со студентом или ментором.');
        }
    };

    // Логика фильтрации контента
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phoneNumber?.includes(searchQuery);

        const matchesRole = selectedRole === 'All' || user.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    if (loading) return <div style={styles.centeredState}>Загрузка реестра пользователей...</div>;
    if (error) return <div style={{ ...styles.centeredState, color: '#ef4444' }}>{error}</div>;

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.pageTitle}>Управление пользователями</h1>
                    <p style={styles.pageSubtitle}>Редактирование ролей, доступов и аудит учетных записей платформы</p>
                </div>
            </header>

            {/* Панель фильтров в стиле omuz */}
            <div style={styles.filterControlsBar}>
                <div style={styles.searchWrapper}>
                    <svg style={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Поиск по имени, email или телефону..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={styles.tabsContainer}>
                    {['All', 'Admin', 'Mentor', 'Student'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            style={{
                                ...styles.tabBtn,
                                ...(selectedRole === role ? styles.activeTabBtn : {})
                            }}
                        >
                            {role === 'All' ? 'Все' : role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Главная таблица */}
            <div style={styles.tableCard}>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thRow}>
                                <th style={styles.th}>Пользователь</th>
                                <th style={styles.th}>Контакты</th>
                                <th style={styles.th}>Системная Роль</th>
                                <th style={styles.th}>Дата создания</th>
                                <th style={styles.th}>Статус доступов</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={styles.emptyRow}>Пользователи по заданным критериям не найдены</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.userProfileCell}>
                                                <div style={styles.avatarBubble}>
                                                    {user.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={styles.userNameText}>{user.fullName}</div>
                                                    <div style={styles.userIdText}>ID: #{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.contactEmail}>{user.email}</div>
                                            <div style={styles.contactPhone}>{user.phoneNumber || 'Нет телефона'}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.roleLabel,
                                                backgroundColor: user.role === 'Admin' ? 'rgba(239, 68, 68, 0.08)' : user.role === 'Mentor' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                                color: user.role === 'Admin' ? '#EF4444' : user.role === 'Mentor' ? '#3B82F6' : '#10B981',
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, color: '#64748B', fontWeight: 500 }}>
                                            {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td style={styles.td}>
                                            <div
                                                onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                style={{
                                                    ...styles.statusToggleBadge,
                                                    backgroundColor: user.isActive ? 'rgba(16, 185, 129, 0.1)' : '#F1F5F9',
                                                    color: user.isActive ? '#10B981' : '#64748B'
                                                }}
                                            >
                                                <span style={{
                                                    ...styles.statusIndicatorCircle,
                                                    backgroundColor: user.isActive ? '#10B981' : '#94A3B8'
                                                }} />
                                                {user.isActive ? 'Активен' : 'Заблокирован'}
                                            </div>
                                        </td>
                                        <td style={{ ...styles.td, textAlign: 'right' }}>
                                            <div style={styles.actionsFlex}>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.fullName)}
                                                    style={styles.deleteActionBtn}
                                                    title="Удалить пользователя"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        padding: '3rem 2.5rem',
        backgroundColor: '#FAFBFD',
        minHeight: '100vh',
        boxSizing: 'border-box' as const,
        fontFamily: "'Geist', 'Inter', sans-serif",
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
        marginBottom: '2.5rem',
    },
    pageTitle: {
        fontSize: '2.4rem',
        fontWeight: '800',
        color: '#0F172A',
        margin: 0,
        letterSpacing: '-0.04em',
    },
    pageSubtitle: {
        fontSize: '0.98rem',
        color: '#475569',
        marginTop: '0.4rem',
        marginBottom: 0,
    },
    filterControlsBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap' as const,
    },
    searchWrapper: {
        position: 'relative' as const,
        flex: '1 1 350px',
        maxWidth: '500px',
    },
    searchIcon: {
        position: 'absolute' as const,
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
    },
    searchInput: {
        width: '100%',
        padding: '11px 16px 11px 42px',
        backgroundColor: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        color: '#1E293B',
        outline: 'none',
        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.015)',
        transition: 'all 0.2s ease',
    },
    tabsContainer: {
        display: 'flex',
        backgroundColor: '#E2E8F0',
        padding: '4px',
        borderRadius: '12px',
        gap: '2px',
    },
    tabBtn: {
        padding: '8px 16px',
        border: 'none',
        backgroundColor: 'transparent',
        borderRadius: '9px',
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#64748B',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s ease',
    },
    activeTabBtn: {
        backgroundColor: '#ffffff',
        color: '#0F172A',
        boxShadow: '0 4px 10px -3px rgba(15, 23, 42, 0.1)',
    },
    tableCard: {
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '1.5rem',
        boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.015), 0 0 0 1px rgba(15, 23, 42, 0.03)',
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
        padding: '0 1rem 1.1rem 1rem',
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        textAlign: 'left' as const,
    },
    tr: {
        borderBottom: '1px solid #F8FAFC',
        transition: 'background-color 0.2s ease',
    },
    td: {
        padding: '1.2rem 1rem',
        fontSize: '0.9rem',
        color: '#334155',
        verticalAlign: 'middle',
    },
    userProfileCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    avatarBubble: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        backgroundColor: '#F1F5F9',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '1rem',
        border: '1px solid #E2E8F0',
    },
    userNameText: {
        fontWeight: '600',
        color: '#0F172A',
    },
    userIdText: {
        fontSize: '0.75rem',
        color: '#94A3B8',
        marginTop: '2px',
        fontFamily: "'Space Grotesk', sans-serif",
    },
    contactEmail: {
        fontWeight: '500',
        color: '#334155',
    },
    contactPhone: {
        fontSize: '0.8rem',
        color: '#64748B',
        marginTop: '3px',
    },
    roleLabel: {
        padding: '5px 12px',
        borderRadius: '10px',
        fontSize: '0.78rem',
        fontWeight: '700',
        display: 'inline-block',
    },
    statusToggleBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '30px',
        fontSize: '0.82rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none' as const,
    },
    statusIndicatorCircle: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
    },
    actionsFlex: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
    },
    deleteActionBtn: {
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: 'transparent',
        color: '#94A3B8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        zIndex: 2,
        ':hover': {
            backgroundColor: '#FEE2E2',
            color: '#EF4444',
        }
    },
    emptyRow: {
        padding: '3rem',
        textAlign: 'center' as const,
        color: '#94A3B8',
        fontSize: '0.95rem',
        fontWeight: '500',
    }
};

export default UsersPage;