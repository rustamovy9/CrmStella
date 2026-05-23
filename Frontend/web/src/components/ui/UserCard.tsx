import React, { useState } from 'react';
import { Mail, Wallet } from 'lucide-react';

interface UserCardProps {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'mentor' | 'user';
    isActive: boolean;
    balance?: number;
    onStatusToggle?: (id: number, currentStatus: boolean) => void;
}

const UserCard: React.FC<UserCardProps> = ({ 
    id,
    name, 
    email, 
    role, 
    isActive, 
    balance,
    onStatusToggle 
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Стилизация ролей (градиенты и мягкие подложки)
    const roleConfig = {
        student: { 
            color: '#4F46E5', 
            bg: '#EEF2FF', 
            glow: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
            label: 'Студент' 
        },
        mentor: { 
            color: '#7C3AED', 
            bg: '#F5F3FF', 
            glow: 'linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)',
            label: 'Ментор' 
        },
        user: { 
            color: '#475569', 
            bg: '#F8FAFC', 
            glow: 'linear-gradient(135deg, #94A3B8 0%, #475569 100%)',
            label: 'Пользователь' 
        }
    };

    const currentRole = roleConfig[role];
    const firstLetter = name ? name.charAt(0).toUpperCase() : '?';

    return (
        <div 
            style={{
                ...styles.card,
                boxShadow: isHovered 
                    ? '0 20px 35px -8px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.08)' 
                    : '0 6px 16px -4px rgba(15, 23, 42, 0.02), 0 0 0 1px rgba(15, 23, 42, 0.04)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ШАПКА КАРТОЧКИ */}
            <div style={styles.headerRow}>
                <div style={{ ...styles.avatar, background: currentRole.glow }}>
                    {firstLetter}
                </div>
                <div style={styles.identityBlock}>
                    <div style={styles.nameContainer}>
                        <h3 style={styles.nameText} title={name}>{name || 'Без имени'}</h3>
                        <span style={styles.idBadge}>#{id}</span>
                    </div>
                    <span style={{ ...styles.roleTag, color: currentRole.color, backgroundColor: currentRole.bg }}>
                        {currentRole.label}
                    </span>
                </div>
            </div>

            {/* ОСНОВНОЙ КОНТЕНТ */}
            <div style={styles.contentBody}>
                {/* Email */}
                <div style={styles.infoRow}>
                    <Mail size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
                    <span style={styles.emailText} title={email}>{email || 'нет почты'}</span>
                </div>

                {/* Прокачанный, красивый блок Баланса */}
                {balance !== undefined && (
                    <div style={{
                        ...styles.balanceWidget,
                        backgroundColor: balance < 0 ? '#FEF2F2' : '#F0FDF4',
                        borderColor: balance < 0 ? '#FEE2E2' : '#DCFCE7'
                    }}>
                        <div style={styles.balanceMeta}>
                            <Wallet size={13} color={balance < 0 ? '#EF4444' : '#10B981'} />
                            <span style={{ ...styles.balanceTitle, color: balance < 0 ? '#991B1B' : '#166534' }}>
                                Баланс счёта
                            </span>
                        </div>
                        <span style={{ 
                            ...styles.balanceValue, 
                            color: balance < 0 ? '#EF4444' : '#10B981' 
                        }}>
                            {balance.toLocaleString()} <span style={styles.currency}>TJS</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Мягкий разделитель перед футером */}
            <div style={styles.divider} />

            {/* ФУТЕР: Статус и iOS Switch перенесены вниз */}
            <div style={styles.footerRow}>
                <div style={styles.statusBlock}>
                    <span style={{ 
                        ...styles.statusDot, 
                        backgroundColor: isActive ? '#34C759' : '#94A3B8',
                        boxShadow: isActive ? '0 0 10px rgba(52, 199, 89, 0.6)' : 'none'
                    }} />
                    <span style={{ ...styles.statusText, color: isActive ? '#1E293B' : '#64748B' }}>
                        {isActive ? 'Активен' : 'Заморожен'}
                    </span>
                </div>

                {onStatusToggle && (
                    <div 
                        onClick={() => onStatusToggle(id, isActive)}
                        style={{
                            ...styles.iosSwitch,
                            backgroundColor: isActive ? '#34C759' : '#E9E9EA',
                        }}
                    >
                        <div style={{
                            ...styles.iosHandle,
                            transform: isActive ? 'translateX(16px)' : 'translateX(0)',
                        }} />
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    card: {
        background: '#ffffff',
        borderRadius: '22px',
        padding: '24px', // Чуть увеличили внутренний отступ для "дыхания" интерфейса
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '18px',
    },
    avatar: {
        width: '44px',
        height: '44px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: '700',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
    },
    identityBlock: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
        minWidth: 0,
    },
    nameContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    nameText: {
        margin: 0,
        fontSize: '15px',
        fontWeight: '600',
        color: '#0F172A',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        letterSpacing: '-0.01em',
    },
    idBadge: {
        fontSize: '11px',
        color: '#94A3B8',
        fontWeight: '500',
    },
    roleTag: {
        alignSelf: 'flex-start',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
    },
    contentBody: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '14px',
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
        paddingLeft: '2px',
    },
    emailText: {
        fontSize: '13px',
        color: '#475569',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    balanceWidget: {
        border: '1px solid',
        padding: '12px 16px',
        borderRadius: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.3s ease',
    },
    balanceMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    balanceTitle: {
        fontSize: '12px',
        fontWeight: '500',
    },
    balanceValue: {
        fontSize: '15px',
        fontWeight: '700',
        letterSpacing: '-0.01em',
    },
    currency: {
        fontSize: '12px',
        fontWeight: '600',
        opacity: 0.8,
        marginLeft: '1px',
    },
    divider: {
        height: '1px',
        backgroundColor: '#F1F5F9',
        width: '100%',
        marginTop: '18px',
        marginBottom: '14px',
    },
    footerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    statusDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
    },
    statusText: {
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '-0.01em',
    },
    iosSwitch: {
        width: '38px',
        height: '22px',
        borderRadius: '999px',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        boxSizing: 'border-box' as const,
    },
    iosHandle: {
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
    }
};

export default UserCard;