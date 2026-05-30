import React from 'react';
import { BookOpen, Clock, Layers, Users, BarChart3, GraduationCap } from 'lucide-react';
import type { CourseListItemResponse } from '../../../types/admin';

interface CourseCardProps {
    course: CourseListItemResponse;
    iconUrl: string | null;
    onDetails: (id: number) => void;
    onStatusToggle: (id: number, currentStatus: boolean) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
    course,
    iconUrl,
    onDetails,
    onStatusToggle
}) => {
    const {
        id,
        name,
        description,
        price = 0,
        durationWeeks = 0,
        isActive = false,
        groupsCount = 0,
        studentsCount = 0
    } = course;

    return (
        <div style={styles.card} className="premium-course-card">
            <style>{`
                @keyframes smoothFadeIn {
                    from { opacity: 0; transform: scale(0.96) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .premium-course-card {
                    animation: smoothFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
                .premium-course-card:hover {
                    transform: translateY(-6px) scale(1.01);
                    border-color: #CBD5E1 !important;
                    box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.04) !important;
                }
                .premium-course-card:hover .animate-course-avatar {
                    transform: scale(1.05);
                }
                .btn-course-manage {
                    transition: all 0.2s ease;
                }
                .btn-course-manage:hover {
                    background-color: #4F46E5 !important;
                    color: #ffffff !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
                }
                .btn-course-manage:active {
                    transform: translateY(0);
                }
            `}</style>

            {/* Верхняя часть */}
            <div style={styles.topSection}>
                <div style={styles.badgeRow}>
                    <span style={styles.categoryBadge}>Направление</span>
                </div>
                <span style={styles.idBadge}>#{id}</span>
            </div>

            {/* Главный блок: Круглая увеличенная аватарка + Текст */}
            <div style={styles.mainContentRow}>
                <div 
                    className="animate-course-avatar" 
                    style={{ ...styles.courseAvatar, transition: 'transform 0.3s ease' }}
                >
                    {iconUrl ? (
                        <img
                            src={iconUrl}
                            alt={name}
                            style={styles.avatarImage}
                            onError={(e) => {
                                // Если картинка не прогрузилась, плавно заменяем на красивую иконку
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 18.8v-4L2 13"/><path d="M12 14.5V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5.5"/></svg>`;
                                }
                            }}
                        />
                    ) : (
                        <GraduationCap size={26} color="#ffffff" />
                    )}
                </div>

                <div style={styles.metaContainer}>
                    <h4 style={styles.courseTitle}>{name}</h4>
                    <p style={styles.courseDescription}>
                        {description || 'Описание для данного направления еще не заполнено.'}
                    </p>
                </div>
            </div>

            {/* Средняя часть: Параметры */}
            <div style={styles.infoSection}>
                <div style={styles.infoGrid}>
                    <div style={styles.infoRow}>
                        <Layers size={14} style={styles.infoIcon} />
                        <span style={styles.infoText}>Группы: <strong>{groupsCount}</strong></span>
                    </div>
                    <div style={styles.infoRow}>
                        <Users size={14} style={styles.infoIcon} />
                        <span style={styles.infoText}>Студенты: <strong>{studentsCount}</strong></span>
                    </div>
                    <div style={styles.infoRow}>
                        <Clock size={14} style={styles.infoIcon} />
                        <span style={styles.infoText}>Длительность: <strong>{durationWeeks} нед.</strong></span>
                    </div>
                </div>

                <div style={styles.priceBox}>
                    <BarChart3 size={14} color="#4F46E5" style={{ marginRight: '6px' }} />
                    <span style={styles.priceText}>
                        Стоимость курса: <strong style={{ color: '#4F46E5' }}>{price > 0 ? `${price} TJS` : 'Бесплатно'}</strong>
                    </span>
                </div>
            </div>

            {/* Нижняя часть */}
            <div style={styles.bottomSection}>
                <div style={styles.statusWrapper}>
                    <div style={{
                        ...styles.statusDot,
                        backgroundColor: isActive ? '#10B981' : '#F59E0B'
                    }} />
                    <span style={styles.statusLabel}>
                        {isActive ? 'Активен' : 'Заморожен'}
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

                <button
                    className="btn-course-manage"
                    style={styles.manageButton}
                    onClick={() => onDetails(id)} // Навигация происходит строго здесь
                >
                    <BookOpen size={14} style={{ marginRight: '6px' }} />
                    Детали
                </button>
            </div>
        </div>
    );
};

const styles = {
    card: { background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01)', boxSizing: 'border-box' as const, gap: '4px' },
    topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    badgeRow: { display: 'flex', gap: '8px' },
    categoryBadge: { fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', backgroundColor: '#EEF2FF', color: '#4F46E5' },
    idBadge: { fontSize: '12px', fontWeight: 600, color: '#94A3B8' },
    
    mainContentRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }, // Выравнивание по центру по вертикали для круглых иконок
    
    // Сделали круглым (borderRadius: 50%) и увеличили до 56px
    courseAvatar: { width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', color: '#ffffff', overflow: 'hidden', flexShrink: 0 },
    avatarImage: { width: '100%', height: '100%', objectFit: 'cover' as const },
    
    metaContainer: { display: 'flex', flexDirection: 'column' as const, gap: '4px', flex: 1 },
    courseTitle: { margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A', lineHeight: '1.3' },
    courseDescription: { margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', height: '38px' },
    infoSection: { display: 'flex', flexDirection: 'column' as const, gap: '14px', marginBottom: '20px', flex: 1 },
    infoGrid: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' },
    infoIcon: { color: '#94A3B8' },
    infoText: { fontSize: '13px', fontWeight: 500 },
    priceBox: { display: 'flex', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '10px 14px', marginTop: '4px' },
    priceText: { fontSize: '13px', fontWeight: 600, color: '#334155' },
    bottomSection: { display: 'flex', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #F8FAFC', gap: '10px' },
    statusWrapper: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
    statusLabel: { fontSize: '13px', fontWeight: 600, color: '#334155' },
    switch: { position: 'relative' as const, display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer', flexShrink: 0 },
    switchInput: { opacity: 0, width: 0, height: 0 },
    slider: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, borderRadius: '34px', transition: '0.2s', display: 'flex', alignItems: 'center', padding: '0 3px' },
    sliderCircle: { height: '16px', width: '16px', borderRadius: '50%', backgroundColor: 'white', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
    manageButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }
};

export default CourseCard;