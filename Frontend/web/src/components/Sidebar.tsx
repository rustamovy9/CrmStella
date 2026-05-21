import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    DashboardIcon, 
    UsersIcon, 
    CoursesIcon, 
    GroupsIcon, 
    PaymentsIcon, 
    LogoutIcon 
} from './icons/MenuIcons';

interface SidebarProps {
    role: 'Admin' | 'Mentor' | 'Student';
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
        window.dispatchEvent(new Event('sidebar-toggle'));
    }, [isCollapsed]);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Пункты меню на основе ТЗ
    const menuItems = {
        Admin: [
            { path: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
            { path: '/admin/users', label: 'Customers', icon: <UsersIcon /> },
            { path: '/admin/courses', label: 'Products', icon: <CoursesIcon /> },
            { path: '/admin/groups', label: 'All tasks', icon: <GroupsIcon /> },
            { path: '/admin/payments', label: 'Finance', icon: <PaymentsIcon /> },
        ],
        Mentor: [
            { path: '/mentor/dashboard', label: 'Groups', icon: <GroupsIcon /> },
            { path: '/mentor/attendance', label: 'Attendance', icon: <DashboardIcon /> },
            { path: '/mentor/homework', label: 'Tasks list', icon: <CoursesIcon /> },
        ],
        Student: [
            { path: '/student/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
            { path: '/student/schedule', label: 'Gallery', icon: <CoursesIcon /> },
            { path: '/student/balance', label: 'Ecommerce', icon: <PaymentsIcon /> },
        ]
    };

    const currentMenu = menuItems[role] || [];

    return (
        <aside style={{ ...styles.sidebar, width: isCollapsed ? '78px' : '260px' }}>
            
            {/* Кнопка переключения (стрелка на границе) */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                style={{
                    ...styles.toggleBtn,
                    left: isCollapsed ? '66px' : '248px',
                    transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>

            <div>
                {/* Блок твоего логотипа из макета */}
                <div style={{ 
                    ...styles.logoContainer, 
                    padding: isCollapsed ? '24px 0' : '24px 20px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start'
                }}>
                    {isCollapsed ? (
                        // Мини-версия логотипа при закрытом сайдбаре
                        <div style={styles.miniLogo}>E</div>
                    ) : (
                        // Полная версия твоего оригинального логотипа из макета EduCRM
                        <div style={styles.logoWrapper}>
                            <div style={styles.logoIconBox}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                    <polyline points="2 17 12 22 22 17" />
                                    <polyline points="2 12 12 17 22 12" />
                                </svg>
                            </div>
                            <span style={styles.logoText}>EduCRM</span>
                        </div>
                    )}
                </div>
                
                {/* Карточка пользователя */}
                <div style={{ 
                    ...styles.userCard, 
                    margin: isCollapsed ? '8px 12px 24px 12px' : '8px 16px 24px 16px',
                    padding: isCollapsed ? '8px 0' : '12px 14px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start'
                }}>
                    <div style={styles.avatar}>
                        {user?.email ? user.email[0].toUpperCase() : 'A'}
                    </div>
                    <div style={{ 
                        ...styles.userInfo, 
                        display: isCollapsed ? 'none' : 'flex' 
                    }}>
                        <span style={styles.userName}>
                            {user?.email ? user.email.split('@')[0] : 'admin'}
                        </span>
                        <span style={styles.userRoleBadge}>
                            {user?.role ? user.role : 'Admin'}
                        </span>
                    </div>
                </div>

                {/* Меню навигации */}
                <nav style={{ 
                    ...styles.nav, 
                    padding: isCollapsed ? '0 12px' : '0 16px' 
                }}>
                    {currentMenu.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                ...styles.navLink,
                                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                                color: isActive ? '#2563eb' : '#475569',
                                fontWeight: isActive ? '600' : '500',
                                padding: isCollapsed ? '0' : '0 16px',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                            })}
                        >
                            <span style={{ 
                                ...styles.icon,
                                marginRight: isCollapsed ? '0' : '12px'
                            }}>
                                {item.icon}
                            </span>
                            <span style={{ 
                                ...styles.navLabel, 
                                display: isCollapsed ? 'none' : 'inline-block'
                            }}>
                                {item.label}
                            </span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Кнопка Logout */}
            <div style={{ padding: isCollapsed ? '0 12px' : '0 16px' }}>
                <button 
                    onClick={handleLogout} 
                    style={{ 
                        ...styles.logoutButton, 
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        padding: isCollapsed ? '0' : '0 16px'
                    }}
                >
                    <span style={{ ...styles.icon, marginRight: isCollapsed ? '0' : '12px' }}>
                        <LogoutIcon />
                    </span>
                    <span style={{ 
                        ...styles.navLabel, 
                        display: isCollapsed ? 'none' : 'inline-block'
                    }}>
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
};

const styles = {
    sidebar: {
        height: '100vh',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        paddingBottom: '24px',
        boxSizing: 'border-box' as const,
        position: 'fixed' as const,
        left: 0,
        top: 0,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 100,
    },
    toggleBtn: {
        position: 'absolute' as const,
        top: '30px',
        width: '22px',
        height: '22px',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 105,
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box' as const,
    },
    logoWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    logoIconBox: {
        width: '32px',
        height: '32px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontSize: '1.2rem',
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: '-0.02em',
        fontFamily: 'Inter, sans-serif',
    },
    miniLogo: {
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700' as const,
        fontSize: '1rem',
    },
    userCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        boxSizing: 'border-box' as const,
    },
    avatar: {
        width: '36px',
        height: '36px',
        minWidth: '36px',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600' as const,
        fontSize: '0.85rem',
    },
    userInfo: {
        flexDirection: 'column' as const,
        overflow: 'hidden',
    },
    userName: {
        fontSize: '0.9rem',
        fontWeight: '700',
        color: '#0f172a',
        whiteSpace: 'nowrap' as const,
    },
    userRoleBadge: {
        fontSize: '0.78rem',
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: '1px',
        whiteSpace: 'nowrap' as const,
    },
    nav: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
        boxSizing: 'border-box' as const,
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        borderRadius: '10px',
        textDecoration: 'none',
        fontSize: '0.93rem',
        height: '42px',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        boxSizing: 'border-box' as const,
    },
    navLabel: {
        whiteSpace: 'nowrap' as const,
    },
    icon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        minWidth: '20px',
    },
    logoutButton: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        border: 'none',
        backgroundColor: 'transparent',
        color: '#64748b',
        borderRadius: '10px',
        fontSize: '0.93rem',
        fontWeight: '500',
        cursor: 'pointer',
        height: '42px',
        boxSizing: 'border-box' as const,
        transition: 'color 0.15s ease',
    },
};

export default Sidebar;