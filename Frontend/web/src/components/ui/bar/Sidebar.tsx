import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import LogoutModal from '../../modals/LogoutModal'; // Проверь правильность пути к модалке

import logoFull from '../../../assets/logo-light.png';
import logoMini from '../../../assets/logo.png';

import {
    LayoutGrid,
    Users,
    GraduationCap,
    Layers,
    CreditCard,
    LogOut,
    ChevronLeft,
    BookOpen,
    Calendar,
    ChevronDown,
    PieChart,
    UserPlus,
    UserCheck,
    Briefcase,
    User
} from 'lucide-react';
import { profileService } from '../../../api/profileService';

interface SubMenuItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

interface MenuItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    subItems?: SubMenuItem[];
}

interface SidebarProps {
    role: 'Admin' | 'Mentor' | 'Student';
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [realUserName, setRealUserName] = useState('Пользователь');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
    const API_BASE = 'http://localhost:5046';

    const resolveAvatarUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${API_BASE}${url}`;
    };
    const [avatarUrl, setAvatarUrl] = useState<string>('');

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed && parsed.fullName) {
                    setRealUserName(parsed.fullName);
                } else if (parsed && parsed.email) {
                    const namePart = parsed.email.split('@')[0];
                    setRealUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
                }
                if (parsed && parsed.avatarUrl) {
                    setAvatarUrl(parsed.avatarUrl);
                }
            }
        } catch (e) {
            console.error("Ошибка чтения реального имени", e);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(collapsed));
        window.dispatchEvent(new Event('sidebar-toggle'));
        if (collapsed) {
            setUserMenuOpen(false);
            setOpenSubmenus({});
        }
    }, [collapsed]);

    useEffect(() => {
        profileService.getMe()
            .then(res => {
                if (res.data.isSuccess && res.data.data) {
                    if (res.data.data.avatarUrl) setAvatarUrl(res.data.data.avatarUrl);
                    if (res.data.data.fullName) setRealUserName(res.data.data.fullName);
                }
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        logout();
        navigate('/login');
    };

    const toggleSubmenu = (path: string) => {
        if (collapsed) {
            setCollapsed(false);
        }
        setOpenSubmenus((prev) => ({
            ...prev,
            [path]: !prev[path],
        }));
    };

    const menus: Record<'Admin' | 'Mentor' | 'Student', MenuItem[]> = {
        Admin: [
            { path: '/admin/dashboard', label: 'Панель управления', icon: <LayoutGrid size={24} /> },
            {
                path: '/admin/users-group',
                label: 'Пользователи',
                icon: <Users size={24} />,
                subItems: [
                    { path: '/admin/leads', label: 'Лиды (Заявки)', icon: <UserPlus size={18} /> },
                    { path: '/admin/students', label: 'Студенты', icon: <UserCheck size={18} /> },
                    { path: '/admin/mentors', label: 'Преподаватели', icon: <Briefcase size={18} /> }
                ]
            },
            {
                path: '/admin/education-group',
                label: 'Учебный процесс',
                icon: <BookOpen size={24} />,
                subItems: [
                    { path: '/admin/courses', label: 'Все курсы', icon: <BookOpen size={18} /> },
                    { path: '/admin/groups', label: 'Группы и потоки', icon: <Layers size={18} /> },
                    { path: '/admin/schedules', label: 'Расписание', icon: <Calendar size={18} /> }
                ]
            },
            { path: '/admin/finance', label: 'Финансы и счета', icon: <CreditCard size={24} /> },
            { path: '/admin/analytics', label: 'Аналитика и отчеты', icon: <PieChart size={24} /> },
        ],
        Mentor: [
            { path: '/mentor/dashboard', label: 'Панель ментора', icon: <LayoutGrid size={24} /> },
            { path: '/mentor/groups', label: 'Мои группы', icon: <GraduationCap size={24} /> },
            // { path: '/mentor/schedules', label: 'Расписание', icon: <Calendar size={18} /> }
        ],
        Student: [
            { path: '/student/dashboard', label: 'Моя панель', icon: <LayoutGrid size={24} /> },
            { path: '/student/groups', label: 'Мои группы', icon: <GraduationCap size={24} /> },
        ],
    };

    const currentMenu = menus[role] || [];

    return (
        <>
            <aside
                style={{
                    ...styles.sidebar,
                    width: collapsed ? '88px' : '310px',
                }}
            >
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        ...styles.toggleButton,
                        left: collapsed ? '74px' : '294px',
                        transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                >
                    <ChevronLeft size={16} />
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

                    {/* Контейнер логотипа */}
                    <div
                        style={{
                            ...styles.logoContainer,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            padding: collapsed ? '0' : '0 28px',
                        }}
                    >
                        <img
                            src={collapsed ? logoMini : logoFull}
                            alt="EduCRM"
                            style={collapsed ? styles.logoMini : styles.logoFull}
                        />
                    </div>

                    <nav style={styles.nav}>
                        {currentMenu.map((item) => {
                            const hasSubItems = !!item.subItems && item.subItems.length > 0;
                            const isChildActive = hasSubItems && item.subItems!.some(sub => location.pathname === sub.path);
                            const isSubMenuOpen = openSubmenus[item.path];
                            const shouldBeVisualActive = isSubMenuOpen || isChildActive;

                            if (hasSubItems) {
                                return (
                                    <div key={item.path} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 2 }}>
                                        <div
                                            onClick={() => toggleSubmenu(item.path)}
                                            className="sidebar-link"
                                            style={{
                                                ...styles.link,
                                                cursor: 'pointer',
                                                background: shouldBeVisualActive && !collapsed ? '#EFF6FF' : 'transparent',
                                                color: shouldBeVisualActive && !collapsed ? '#2563EB' : '#475569',
                                                justifyContent: collapsed ? 'center' : 'flex-start',
                                                padding: collapsed ? '0' : '0 22px',
                                            }}
                                        >
                                            <span style={{ ...styles.icon, marginRight: collapsed ? 0 : 16 }}>
                                                {item.icon}
                                            </span>
                                            {!collapsed && (
                                                <>
                                                    <span style={{ ...styles.linkLabel, flex: 1 }}>{item.label}</span>
                                                    <ChevronDown
                                                        size={18}
                                                        style={{
                                                            transform: isSubMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s ease',
                                                            opacity: 0.8
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {!collapsed && isSubMenuOpen && (
                                            <div style={styles.subMenuContainer}>
                                                {item.subItems!.map((sub) => {
                                                    const isSubActive = location.pathname === sub.path;
                                                    return (
                                                        <NavLink
                                                            key={sub.path}
                                                            to={sub.path}
                                                            className={({ isActive }) => isActive ? "sidebar-sublink active-sublink" : "sidebar-sublink"}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                background: isSubActive ? '#EFF6FF' : 'transparent',
                                                                color: isSubActive ? '#2563EB' : '#64748B',
                                                            }}
                                                        >
                                                            <span style={{ display: 'flex', alignItems: 'center', marginRight: 10, opacity: isSubActive ? 1 : 0.7 }}>
                                                                {sub.icon}
                                                            </span>
                                                            <span>{sub.label}</span>
                                                        </NavLink>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => isActive ? "sidebar-link active-link" : "sidebar-link"}
                                    style={({ isActive }) => ({
                                        ...styles.link,
                                        background: isActive ? '#2563EB' : 'transparent',
                                        color: isActive ? '#ffffff' : '#475569',
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        padding: collapsed ? '0' : '0 22px',
                                        boxShadow: isActive && !collapsed ? '0 6px 16px rgba(37, 99, 235, 0.25)' : 'none',
                                    })}
                                >
                                    <span style={{ ...styles.icon, marginRight: collapsed ? 0 : 16 }}>
                                        {item.icon}
                                    </span>
                                    {!collapsed && <span style={styles.linkLabel}>{item.label}</span>}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Блок Профиля */}
                <div style={styles.footer} ref={dropdownRef}>
                    {userMenuOpen && (
                        <div
                            style={{
                                ...styles.dropdownMenu,
                                bottom: collapsed ? '16px' : 'calc(100% - 2px)',
                                left: collapsed ? '84px' : '16px',
                                right: collapsed ? 'auto' : '16px',
                                width: collapsed ? '220px' : 'auto',
                                boxShadow: collapsed ? '4px 4px 25px rgba(15, 23, 42, 0.1)' : '0 -10px 25px rgba(15, 23, 42, 0.06)'
                            }}
                        >
                            <button
                                onClick={() => { setUserMenuOpen(false); navigate(role === 'Admin' ? '/admin/profile' : `/${role.toLowerCase()}/profile`); }}
                                style={styles.dropdownItem}
                                className="dropdown-click-item"
                            >
                                <User size={20} style={{ marginRight: 12, color: '#2563EB' }} />
                                <span>Профиль</span>
                            </button>
                            <div style={styles.dropdownDivider} />
                            <button
                                onClick={() => { setUserMenuOpen(false); setShowLogoutModal(true); }}
                                style={{ ...styles.dropdownItem, color: '#EF4444' }}
                                className="dropdown-click-item-danger"
                            >
                                <LogOut size={20} style={{ marginRight: 12 }} />
                                <span>Выйти из системы</span>
                            </button>
                        </div>
                    )}

                    <div
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        style={{
                            ...styles.profileCard,
                            cursor: 'pointer',
                            justifyContent: collapsed ? 'center' : 'space-between',
                            padding: collapsed ? '10px 0' : '14px 16px',
                            background: userMenuOpen ? '#F1F5F9' : '#F8FAFC',
                            borderColor: userMenuOpen ? '#CBD5E1' : '#E2E8F0',
                            width: collapsed ? '52px' : 'auto',
                            margin: collapsed ? '0 auto' : '0',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden' }}>
                            <div style={styles.avatar}>
                                {avatarUrl ? (
                                    <img
                                        src={resolveAvatarUrl(avatarUrl)}
                                        alt="avatar"
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    realUserName[0]
                                )}
                            </div>

                            {!collapsed && (
                                <div style={styles.profileInfo}>
                                    <span style={styles.profileName}>
                                        {realUserName}
                                    </span>
                                    <span style={styles.profileRole}>
                                        {role === 'Admin' ? 'Администратор' : role === 'Mentor' ? 'Преподаватель' : 'Студент'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {!collapsed && (
                            <ChevronDown
                                size={18}
                                style={{
                                    color: '#64748B',
                                    transition: 'transform 0.25s ease',
                                    transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}
                            />
                        )}
                    </div>
                </div>
            </aside>

            <style>{`
                .sidebar-link {
                    transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
                }
                .sidebar-link:not(.active-link):hover {
                    background-color: #EFF6FF !important;
                    color: #2563EB !important;
                    transform: translateX(4px);
                }
                .sidebar-sublink {
                    font-family: "Inter", sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: #64748B;
                    text-decoration: none;
                    padding: 10px 14px;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .sidebar-sublink:hover {
                    color: #2563EB !important;
                    background-color: #F8FAFC !important;
                    transform: translateX(4px);
                }
                .sidebar-sublink.active-sublink {
                    color: #2563EB !important;
                    font-weight: 600;
                    background-color: #EFF6FF !important;
                }
                .dropdown-click-item:hover {
                    background-color: #F1F5F9 !important;
                    color: #2563EB !important;
                }
                .dropdown-click-item-danger:hover {
                    background-color: #FEF2F2 !important;
                    color: #EF4444 !important;
                }
            `}</style>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleConfirmLogout}
            />
        </>
    );
};

const styles = {
    sidebar: {
        height: '100vh',
        background: '#ffffff',
        borderRight: '1px solid #E2E8F0',
        boxShadow: '4px 0 25px rgba(15, 23, 42, 0.03)',
        position: 'fixed' as const,
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 999,
    },
    toggleButton: {
        position: 'absolute' as const,
        top: 36, // Опустили чуть ниже, так как высота шапки логотипа выросла
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '1px solid #E2E8F0',
        background: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        color: '#2563EB',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    },
    logoContainer: {
        height: 105, // Увеличили высоту контейнера, чтобы большому логотипу было свободно
        display: 'flex',
        alignItems: 'center',
    },
    logoFull: {
        height: '180px', // Сделали логотип по-настоящему КРУПНЫМ
        width: 'auto',
        maxWidth: '200px', // Позволяем растягиваться почти на всю ширину сайдбара
        objectFit: 'contain' as const,
    },
    logoMini: {
        width: '200px', // Увеличили мини-логотип для свернутого состояния
        height: '50px',
        objectFit: 'contain' as const,
    },
    nav: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 6,
        padding: '0 16px',
    },
    link: {
        height: 52,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
    },
    linkLabel: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
    },
    icon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subMenuContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 4,
        paddingLeft: 32,
        marginTop: 2,
    },
    footer: {
        position: 'relative' as const,
        padding: 16,
        display: 'flex',
        flexDirection: 'column' as const,
        borderTop: '1px solid #E2E8F0',
        background: '#ffffff',
    },
    profileCard: {
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #E2E8F0',
        boxShadow: 'none',
        transition: 'all 0.2s ease',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 16,
        flexShrink: 0,
        overflow: 'hidden',  // ← добавь
        boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)',
    },
    profileInfo: {
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
    },
    profileName: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '15px',
        fontWeight: 700,
        color: '#0F172A',
        whiteSpace: 'nowrap' as const,
        textOverflow: 'ellipsis',
        overflow: 'hidden',
    },
    profileRole: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '12px',
        color: '#64748B',
        marginTop: 1,
        fontWeight: 600,
    },
    dropdownMenu: {
        position: 'absolute' as const,
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '6px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 2,
        zIndex: 1000,
    },
    dropdownItem: {
        width: '100%',
        height: 44,
        border: 'none',
        background: 'transparent',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        cursor: 'pointer',
        fontFamily: '"Inter", sans-serif',
        fontSize: '14.5px',
        fontWeight: 600,
        color: '#334155',
        transition: 'all 0.15s ease',
        textAlign: 'left' as const,
    },
    dropdownDivider: {
        height: 1,
        background: '#F1F5F9',
        margin: '4px 8px',
    }
};

export default Sidebar;