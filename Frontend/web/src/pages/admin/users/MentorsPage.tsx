import React, { useEffect, useState } from 'react';
import adminService from '../../../api/adminService';
import type { MentorListItemResponse } from '../../../types/admin';
import { Search, Mail, Award, Calendar } from 'lucide-react';

const MentorsPage: React.FC = () => {
    const [mentors, setMentors] = useState<MentorListItemResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const response = await adminService.getMentors();
                if (response.data && response.data.isSuccess) {
                    setMentors(response.data.data);
                } else {
                    setError("Не удалось корректно прочитать данные преподавателей");
                }
            } catch (err) {
                console.error("Ошибка загрузки менторов:", err);
                setError("Ошибка при подключении к серверу менторов");
            } finally {
                loading && setLoading(false);
            }
        };

        fetchMentors();
    }, []);

    // Функция переключения статуса ментора (локальный стейт + вызов API)
    const handleStatusToggle = async (id: number, currentStatus: boolean) => {
        try {
            // Оптимистичное обновление в UI ради плавности iOS-переключателя
            setMentors(prev => prev.map(m => m.id === id ? { ...m, isActive: !currentStatus } : m));
            
            // Если у тебя в adminService есть метод обновления, раскомментируй строку ниже:
            // await adminService.updateMentorStatus(id, !currentStatus);
        } catch (err) {
            console.error("Не удалось обновить статус ментора:", err);
            // Возвращаем назад в случае ошибки сети
            setMentors(prev => prev.map(m => m.id === id ? { ...m, isActive: currentStatus } : m));
        }
    };

    // Логика фильтрации и поиска по fullName и email
    const filteredMentors = mentors.filter(mentor => {
        const nameToSearch = mentor.fullName || mentor.name || '';
        const emailToSearch = mentor.email || '';

        return nameToSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emailToSearch.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) return <div style={styles.centerMessage}>Загрузка списка преподавателей...</div>;
    if (error) return <div style={{ ...styles.centerMessage, color: '#ef4444' }}>{error}</div>;

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>Преподавательский состав</h2>
                    <p style={styles.subtitle}>Активных менторов в системе: {mentors.filter(m => m.isActive).length} из {mentors.length}</p>
                </div>
            </div>

            {/* Панель поиска */}
            <div style={styles.toolbar}>
                <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Поиск ментора по имени или почте..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
            </div>

            {/* Сетка премиальных карточек менторов */}
            <div style={styles.gridContainer}>
                {filteredMentors.map((mentor) => {
                    const displayName = mentor.fullName || mentor.name || "Без имени";
                    const specialities = mentor.specialization || "Не указано";
                    const experience = mentor.experienceYears != null ? `${mentor.experienceYears} лет` : "Не указан";
                    const firstLetter = displayName.charAt(0).toUpperCase();

                    return (
                        <MentorCard 
                            key={mentor.id}
                            id={mentor.id}
                            name={displayName}
                            email={mentor.email}
                            specialization={specialities}
                            experience={experience}
                            isActive={mentor.isActive}
                            onToggle={handleStatusToggle}
                            firstLetter={firstLetter}
                        />
                    );
                })}
            </div>

            {/* Состояние, если ничего не найдено */}
            {filteredMentors.length === 0 && (
                <div style={styles.emptyState}>Преподаватели по вашему запросу не найдены</div>
            )}
        </div>
    );
};

/* ==========================================================================
   КОМПОНЕНТ КАРТОЧКИ МЕНТОРА (Внутренний саб-компонент для контроля Hover-эффекта)
   ========================================================================== */
interface MentorCardProps {
    id: number;
    name: string;
    email: string;
    specialization: string;
    experience: string;
    isActive: boolean;
    firstLetter: string;
    onToggle: (id: number, currentStatus: boolean) => void;
}

const MentorCard: React.FC<MentorCardProps> = ({ id, name, email, specialization, experience, isActive, firstLetter, onToggle }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Благородный фиолетовый градиент для Менторов
    const mentorGlow = 'linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)';

    return (
        <div 
            style={{
                ...styles.card,
                boxShadow: isHovered 
                    ? '0 20px 35px -8px rgba(124, 58, 237, 0.08), 0 0 0 1px rgba(124, 58, 237, 0.15)' 
                    : '0 4px 14px -4px rgba(15, 23, 42, 0.03), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                transform: isHovered ? 'translateY(-5px)' : 'translateY(0)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ШАПКА: Аватар и имя */}
            <div style={styles.cardHeader}>
                <div style={{ ...styles.avatar, background: mentorGlow }}>
                    {firstLetter}
                </div>
                <div style={styles.identityBlock}>
                    <div style={styles.nameContainer}>
                        <h3 style={styles.nameText} title={name}>{name}</h3>
                        <span style={styles.idBadge}>#{id}</span>
                    </div>
                    <span style={styles.roleTag}>Ментор</span>
                </div>
            </div>

            {/* КОНТЕНТ */}
            <div style={styles.cardBody}>
                {/* Email */}
                <div style={styles.infoRow}>
                    <Mail size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
                    <span style={styles.emailText} title={email}>{email || 'нет почты'}</span>
                </div>

                {/* Виджет специализации и опыта */}
                <div style={styles.specWidget}>
                    <div style={styles.specItem}>
                        <Award size={13} color="#7C3AED" />
                        <span style={styles.specText} title={specialization}>{specialization}</span>
                    </div>
                    <div style={styles.specDivider} />
                    <div style={styles.specItem}>
                        <Calendar size={13} color="#7C3AED" />
                        <span style={styles.expText}>Опыт: {experience}</span>
                    </div>
                </div>
            </div>

            <div style={styles.divider} />

            {/* ФУТЕР: Статус и iOS Switch */}
            <div style={styles.cardFooter}>
                <div style={styles.statusBlock}>
                    <span style={{ 
                        ...styles.statusDot, 
                        backgroundColor: isActive ? '#34C759' : '#94A3B8',
                        boxShadow: isActive ? '0 0 10px rgba(52, 199, 89, 0.5)' : 'none'
                    }} />
                    <span style={{ ...styles.statusText, color: isActive ? '#0F172A' : '#64748B' }}>
                        {isActive ? 'Доступ активен' : 'Заморожен'}
                    </span>
                </div>

                <div 
                    onClick={() => onToggle(id, isActive)}
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
            </div>
        </div>
    );
};

/* ==========================================================================
   СТИЛИ СТРАНИЦЫ И КАРТОЧЕК
   ========================================================================== */
const styles = {
    container: { 
        padding: '32px', 
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
        background: '#F8FAFC', 
        minHeight: '100vh' 
    },
    headerRow: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
    },
    title: { 
        fontSize: '26px', 
        fontWeight: 700, 
        color: '#0F172A', 
        margin: 0, 
        letterSpacing: '-0.02em' 
    },
    subtitle: { 
        fontSize: '14px', 
        color: '#64748B', 
        margin: '4px 0 0 0', 
        fontWeight: 500 
    },
    toolbar: { 
        marginBottom: '28px' 
    },
    searchWrapper: { 
        position: 'relative' as const, 
        width: '100%', 
        maxWidth: '400px' 
    },
    searchIcon: { 
        position: 'absolute' as const, 
        left: '14px', 
        top: '50%', 
        transform: 'translateY(-50%)', 
        color: '#94A3B8' 
    },
    searchInput: { 
        width: '100%', 
        height: '44px', 
        padding: '0 16px 0 44px', 
        borderRadius: '12px', 
        border: '1px solid #E2E8F0', 
        background: '#ffffff', 
        fontSize: '14px', 
        outline: 'none', 
        color: '#334155', 
        boxSizing: 'border-box' as const,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
        gap: '20px',
    },
    // Стили карточки
    card: {
        background: '#ffffff',
        borderRadius: '22px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    cardHeader: {
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
        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
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
        color: '#7C3AED',
        backgroundColor: '#F5F3FF',
    },
    cardBody: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
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
    specWidget: {
        backgroundColor: '#FDFFFA',
        border: '1px solid #F5F3FF',
        background: 'linear-gradient(180deg, #FDFEFE 0%, #F5F3FF 100%)',
        padding: '12px 14px',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    specItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
    },
    specText: {
        fontSize: '12.5px',
        fontWeight: '600',
        color: '#4C1D95',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    specDivider: {
        height: '1px',
        backgroundColor: 'rgba(124, 58, 237, 0.06)',
        width: '100%',
    },
    expText: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#6D28D9',
    },
    divider: {
        height: '1px',
        backgroundColor: '#F1F5F9',
        width: '100%',
        marginTop: '18px',
        marginBottom: '14px',
    },
    cardFooter: {
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
    },
    centerMessage: { 
        padding: '80px 40px', 
        textAlign: 'center' as const, 
        fontSize: '16px', 
        color: '#64748B' 
    },
    emptyState: {
        padding: '40px',
        textAlign: 'center' as const,
        color: '#94A3B8',
        fontSize: '15px',
        gridColumn: '1 / -1'
    }
};

export default MentorsPage;