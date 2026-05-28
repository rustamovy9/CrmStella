import React from 'react';
import { Mail, Wallet, Briefcase, Phone, UserCheck } from 'lucide-react';

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
    onView?: (id: number) => void; // Колбэк для моментального перехода на UserInfoPage
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
    avatarUrl,
    onView
}) => {
    const firstLetter = name ? name.charAt(0).toUpperCase() : 'U';

    return (
        <div style={styles.card} className="premium-user-card">
            {/* Стили для очень красивой и заметной анимации */}
            <style>{`
                @keyframes smoothFadeIn {
                    from { opacity: 0; transform: scale(0.96) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .premium-user-card {
                    animation: smoothFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
                .premium-user-card:hover {
                    transform: translateY(-6px) scale(1.01);
                    border-color: #CBD5E1 !important;
                    box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.04) !important;
                }
                .premium-user-card:hover .animate-avatar {
                    transform: scale(1.05);
                }
                .btn-manage-actions {
                    transition: all 0.2s ease;
                }
                .btn-manage-actions:hover {
                    background-color: #4F46E5 !important;
                    color: #ffffff !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
                }
                .btn-manage-actions:active {
                    transform: translateY(0);
                }
            `}</style>

            {/* Верхняя часть: Аватар, имя, бейдж роли и ID */}
            <div style={styles.topSection}>
                <div className="animate-avatar" style={{ ...styles.avatar, transition: 'transform 0.3s ease' }}>                    {avatarUrl ? (
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

            {/* Средняя часть: Контакты и поля */}
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

            {/* Нижняя часть: Твой родной статус и кнопка действия */}
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

                {/* ТВОЙ СВИТЧ (Форма полностью сохранена 1 в 1 как была изначально) */}
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

                {/* Кнопка «Действия» переносит на страницу инфо */}
                <button
                    className="btn-manage-actions"
                    style={styles.manageButton}
                    onClick={() => onView && onView(id)}
                >
                    <UserCheck size={14} style={{ marginRight: '6px' }} />
                    Действия
                </button>
            </div>
        </div>
    );
};

const styles = {
    card: { background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01)', boxSizing: 'border-box' as const, gap: '4px' },
    topSection: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
    avatar: { width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', color: '#ffffff', fontSize: '22px', fontWeight: 700, overflow: 'hidden' },
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

    // Нижняя часть карточки
    bottomSection: { display: 'flex', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #F8FAFC', gap: '10px' },
    statusWrapper: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
    statusLabel: { fontSize: '13px', fontWeight: 600, color: '#334155' },

    // ТВОЙ ОРИГИНАЛЬНЫЙ СВИТЧ (РАЗМЕРЫ ВОЗВРАЩЕНЫ)
    switch: { position: 'relative' as const, display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer', flexShrink: 0 },
    switchInput: { opacity: 0, width: 0, height: 0 },
    slider: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, borderRadius: '34px', transition: '0.2s', display: 'flex', alignItems: 'center', padding: '0 3px' },
    sliderCircle: { height: '16px', width: '16px', borderRadius: '50%', backgroundColor: 'white', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },

    // Кнопка прямого перехода
    manageButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }
};

export default UserCard;