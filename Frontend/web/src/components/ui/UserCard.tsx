import React from 'react';
import { Mail, Wallet, Briefcase, Phone } from 'lucide-react';

interface UserCardProps {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'mentor';
    isActive: boolean;
    onStatusToggle: (id: number, currentStatus: boolean) => void;
    balance?: number;
    specialization?: string;
    experienceYears?: number;
    phoneNumber?: string;
    avatarUrl?: string | null;
}

const UserCard: React.FC<UserCardProps> = ({
    id,
    name,
    email,
    role,
    isActive,
    onStatusToggle,
    balance = 0,
    specialization,
    experienceYears,
    phoneNumber,
    avatarUrl
}) => {
    const firstLetter = name ? name.charAt(0).toUpperCase() : 'U';

    return (
        <div style={styles.card}>
            {/* Верхняя часть: Аватар, имя, бейдж роли и ID */}
            <div style={styles.topSection}>
                {/* Круглая синеватая аватарка увеличенного размера */}
                <div style={styles.avatar}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={name}
                            style={styles.avatarImage}
                        />
                    ) : (
                        firstLetter
                    )}
                </div>

                <div style={styles.metaContainer}>
                    <div style={styles.nameRow}>
                        <h4 style={styles.fullName}>{name}</h4>
                        <span style={styles.idBadge}>#{id}</span>
                    </div>
                    <span style={{
                        ...styles.roleBadge,
                        backgroundColor: role === 'mentor' ? '#EFF6FF' : '#EEF2FF',
                        color: role === 'mentor' ? '#3B82F6' : '#4F46E5'
                    }}>
                        {role === 'mentor' ? 'Ментор' : 'Студент'}
                    </span>
                </div>
            </div>

            {/* Средняя часть: Контакты и кастомные поля */}
            <div style={styles.infoSection}>
                <div style={styles.infoRow}>
                    <Mail size={14} style={styles.infoIcon} />
                    <span style={styles.infoText}>{email}</span>
                </div>

                {phoneNumber && (
                    <div style={styles.infoRow}>
                        <Phone size={14} style={styles.infoIcon} />
                        <span style={styles.infoText}>{phoneNumber}</span>
                    </div>
                )}

                {role === 'student' ? (
                    <div style={styles.balanceBox}>
                        <Wallet size={14} color="#10B981" style={{ marginRight: '6px' }} />
                        <span style={styles.balanceText}>
                            Баланс счёта: <strong style={{ color: '#10B981' }}>{balance} TJS</strong>
                        </span>
                    </div>
                ) : (
                    <div style={styles.mentorBox}>
                        <Briefcase size={14} color="#3B82F6" style={{ marginRight: '6px' }} />
                        <span style={styles.mentorText}>
                            {specialization || 'Не указано'} • Опыт: {experienceYears ?? 0} лет
                        </span>
                    </div>
                )}
            </div>

            {/* Нижняя часть: Статус и Тоггл */}
            <div style={styles.bottomSection}>
                <div style={styles.statusWrapper}>
                    <div style={{
                        ...styles.statusDot,
                        backgroundColor: isActive ? '#10B981' : '#F59E0B'
                    }} />
                    <span style={styles.statusLabel}>
                        {isActive ? 'Доступ активен' : 'Доступ ограничен'}
                    </span>
                </div>

                <label style={styles.switch}>
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => onStatusToggle(id, isActive)}
                        style={styles.switchInput}
                    />
                    <span style={{
                        ...styles.slider,
                        backgroundColor: isActive ? '#10B981' : '#CBD5E1'
                    }}>
                        <span style={{
                            ...styles.sliderCircle,
                            transform: isActive ? 'translateX(16px)' : 'translateX(0px)'
                        }} />
                    </span>
                </label>
            </div>
        </div>
    );
};

const styles = {
    card: { background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01)', boxSizing: 'border-box' as const },
    topSection: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },

    // Идеально круглая аватарка (размер увеличен с 48px до 56px, убран динамический цвет фона)
    // Найди в самом низу styles.avatar и замени на этот:
    avatar: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // <-- Вот здесь исправлена опечатка (было просто justify)
        backgroundColor: '#4F46E5',
        color: '#ffffff',
        fontSize: '22px',
        fontWeight: 700,
        overflow: 'hidden'
    },
    avatarImage: { width: '100%', height: '100%', objectFit: 'cover' as const },

    metaContainer: { display: 'flex', flexDirection: 'column' as const, gap: '4px', flex: 1 },
    nameRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    fullName: { margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' },
    idBadge: { fontSize: '12px', fontWeight: 600, color: '#94A3B8' },
    roleBadge: { alignSelf: 'flex-start', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' },
    infoSection: { display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '20px', flex: 1 },
    infoRow: { display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' },
    infoIcon: { color: '#94A3B8' },
    infoText: { fontSize: '13px', fontWeight: 500 },
    balanceBox: { display: 'flex', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: '10px', padding: '10px 14px', marginTop: '6px' },
    balanceText: { fontSize: '13px', fontWeight: 600, color: '#166534' },
    mentorBox: { display: 'flex', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '10px 14px', marginTop: '6px' },
    mentorText: { fontSize: '13px', fontWeight: 600, color: '#1E40AF' },
    bottomSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #F8FAFC' },
    statusWrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
    statusLabel: { fontSize: '13px', fontWeight: 600, color: '#334155' },
    switch: { position: 'relative' as const, display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer' },
    switchInput: { opacity: 0, width: 0, height: 0 },
    slider: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, borderRadius: '34px', transition: '0.2s', display: 'flex', alignItems: 'center', padding: '0 3px' },
    sliderCircle: { height: '16px', width: '16px', borderRadius: '50%', backgroundColor: 'white', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
};

export default UserCard;