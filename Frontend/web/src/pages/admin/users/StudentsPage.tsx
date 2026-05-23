import React, { useEffect, useState } from 'react';
import adminService from '../../../api/adminService';
import type { StudentListItemResponse } from '../../../types/admin'; 
import { Search, Filter, Mail, Wallet } from 'lucide-react';

const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<StudentListItemResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchStudents = async () => {
        try {
            const response = await adminService.getStudents();
            if (response.data && response.data.isSuccess) {
                setStudents(response.data.data); 
            } else {
                setError("Ошибка при обработке данных от сервера");
            }
        } catch (err) {
            console.error("Ошибка загрузки студентов:", err);
            setError("Не удалось синхронизировать данные");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleStatusToggle = async (id: number, currentStatus: boolean) => {
        try {
            const nextStatus = !currentStatus;
            
            // Оптимистичный UI-апдейт для мгновенной реакции iOS переключателя
            setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: nextStatus } : s));
            
            const response = await adminService.setStudentStatus(id, nextStatus);
            if (!response.data || !response.data.isSuccess) {
                // Откат назад при неудачном запросе
                setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: currentStatus } : s));
            }
        } catch (err) {
            console.error("Не удалось изменить статус:", err);
            setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: currentStatus } : s));
        }
    };

    const filteredStudents = students.filter(student => {
        const nameToSearch = (student as any).fullName || student.name || '';
        const emailToSearch = student.email || '';

        const matchesSearch = nameToSearch.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              emailToSearch.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (statusFilter === 'active') return matchesSearch && student.isActive;
        if (statusFilter === 'inactive') return matchesSearch && !student.isActive;
        
        return matchesSearch;
    });

    if (loading) return <div style={styles.centerMessage}>Загрузка списка студентов...</div>;
    if (error) return <div style={{ ...styles.centerMessage, color: '#ef4444' }}>{error}</div>;

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>Управление студентами</h2>
                    <p style={styles.subtitle}>
                        Активных студентов: {students.filter(s => s.isActive).length} из {students.length}
                    </p>
                </div>
            </div>

            {/* Панель инструментов поиска и фильтрации */}
            <div style={styles.toolbar}>
                <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Поиск по имени или email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                
                <div style={styles.filterWrapper}>
                    <Filter size={16} style={{ color: '#64748B' }} />
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={styles.selectInput}
                    >
                        <option value="all">Все статусы</option>
                        <option value="active">Активные</option>
                        <option value="inactive">Замороженные</option>
                    </select>
                </div>
            </div>

            {/* Сетка премиальных карточек студентов */}
            <div style={styles.gridContainer}>
                {filteredStudents.map((student) => {
                    const displayName = (student as any).fullName || student.name || "Без имени";
                    const firstLetter = displayName.charAt(0).toUpperCase();

                    return (
                        <StudentCard 
                            key={student.id}
                            id={student.id}
                            name={displayName}
                            email={student.email}
                            balance={student.balance}
                            isActive={student.isActive}
                            firstLetter={firstLetter}
                            onToggle={handleStatusToggle}
                        />
                    );
                })}
            </div>
            
            {filteredStudents.length === 0 && (
                <div style={styles.emptyState}>Студенты по вашему запросу не найдены</div>
            )}
        </div>
    );
};

/* ==========================================================================
   КОМПОНЕНТ КАРТОЧКИ СТУДЕНТА (Локальный Hover-эффект и идентичный отступ)
   ========================================================================== */
interface StudentCardProps {
    id: number;
    name: string;
    email: string;
    balance: number;
    isActive: boolean;
    firstLetter: string;
    onToggle: (id: number, currentStatus: boolean) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ id, name, email, balance, isActive, firstLetter, onToggle }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Фирменный индиго-градиент для студентов
    const studentGlow = 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)';

    return (
        <div 
            style={{
                ...styles.card,
                boxShadow: isHovered 
                    ? '0 20px 35px -8px rgba(99, 102, 241, 0.08), 0 0 0 1px rgba(99, 102, 241, 0.15)' 
                    : '0 4px 14px -4px rgba(15, 23, 42, 0.03), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                transform: isHovered ? 'translateY(-5px)' : 'translateY(0)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ШАПКА: Аватар и имя */}
            <div style={styles.cardHeader}>
                <div style={{ ...styles.avatar, background: studentGlow }}>
                    {firstLetter}
                </div>
                <div style={styles.identityBlock}>
                    <div style={styles.nameContainer}>
                        <h3 style={styles.nameText} title={name}>{name}</h3>
                        <span style={styles.idBadge}>#{id}</span>
                    </div>
                    <span style={styles.roleTag}>Студент</span>
                </div>
            </div>

            {/* КОНТЕНТ */}
            <div style={styles.cardBody}>
                {/* Email */}
                <div style={styles.infoRow}>
                    <Mail size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
                    <span style={styles.emailText} title={email}>{email || 'нет почты'}</span>
                </div>

                {/* Виджет баланса (Премиальная пастельная подложка) */}
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
                        {balance !== undefined ? balance.toLocaleString() : 0} <span style={styles.currency}>TJS</span>
                    </span>
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
   ОБЩИЕ СТИЛИ (ПОЛНАЯ СИНХРОНИЗАЦИЯ С СИСТЕМОЙ МЕНТОРОВ)
   ========================================================================== */
const styles = {
    container: { 
        padding: '32px', 
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
        background: '#F8FAFC', 
        minHeight: '100vh',
        boxSizing: 'border-box' as const,
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
        display: 'flex',
        gap: '14px',
        marginBottom: '28px',
        flexWrap: 'wrap' as const,
    },
    searchWrapper: { 
        position: 'relative' as const, 
        flex: 1, 
        minWidth: '280px',
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
    filterWrapper: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        background: '#ffffff', 
        border: '1px solid #E2E8F0', 
        padding: '0 14px', 
        borderRadius: '12px', 
        height: '44px', 
        boxSizing: 'border-box' as const, 
        boxShadow: '0 2px 4px rgba(0,0,0,0.01)' 
    },
    selectInput: { 
        border: 'none', 
        outline: 'none', 
        background: 'transparent', 
        fontSize: '14px', 
        color: '#0F172A', 
        fontWeight: 600, 
        cursor: 'pointer' 
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
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
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
        color: '#6366F1',
        backgroundColor: '#EEF2FF',
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
    balanceWidget: {
        border: '1px solid',
        padding: '12px 14px',
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
        fontSize: '14px',
        fontWeight: '700',
        letterSpacing: '-0.01em',
    },
    currency: {
        fontSize: '11px',
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

export default StudentsPage;