import React from 'react';

interface MetricCardProps {
    value: string | number;
    label: string;
    subLabel?: string;
    variant?: 'purple' | 'blue' | 'green' | 'amber';
    isMain?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
    value, 
    label, 
    subLabel, 
    variant = 'purple',
    isMain = false 
}) => {
    const config = {
        purple: { 
            color: '#6366F1', 
            bg: 'rgba(99, 102, 241, 0.05)', 
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            )
        },
        blue: { 
            color: '#3B82F6', 
            bg: 'rgba(59, 130, 246, 0.05)', 
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                </svg>
            )
        },
        green: { 
            color: '#10B981', 
            bg: 'rgba(16, 185, 129, 0.05)', 
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
            )
        },
        amber: { 
            color: '#F59E0B', 
            bg: 'rgba(245, 158, 11, 0.05)', 
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                </svg>
            )
        }
    };

    const current = config[variant];

    // Главная карточка (Премиальный Градиентный Стиль)
    if (isMain) {
        return (
            <div style={{ ...styles.card, ...styles.mainCard }}>
                <div style={styles.mainOverlay} />
                <div style={styles.contentMain}>
                    <div style={styles.mainHeaderRow}>
                        <span style={styles.mainLabel}>{label}</span>
                        <div style={styles.mainIconWrapper}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                    </div>
                    <span style={styles.mainValue}>{value}</span>
                    {subLabel && <span style={styles.mainSubLabel}>{subLabel}</span>}
                </div>
                <div style={styles.glowBlob} />
            </div>
        );
    }

    // Стандартная стильная карточка (Исправленная структура стилей)
    return (
        <div 
            style={styles.card}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(99, 102, 241, 0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 0 0 1px rgba(15, 23, 42, 0.04)';
            }}
        >
            <div style={styles.contentStandard}>
                <div style={styles.cardHeader}>
                    <span style={styles.label}>{label}</span>
                    <div style={{ ...styles.iconContainer, backgroundColor: current.bg }}>
                        {current.icon}
                    </div>
                </div>

                <div style={styles.valueRow}>
                    <span style={{ ...styles.value, color: '#0F172A' }}>{value}</span>
                </div>

                {subLabel && (
                    <div style={styles.footer}>
                        <div style={{ ...styles.statusIndicator, backgroundColor: current.color }} />
                        <span style={styles.subLabel}>{subLabel}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '22px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column' as const,
        flex: '1 1 240px',
        position: 'relative' as const,
        overflow: 'hidden',
        fontFamily: "'Geist', 'Inter', sans-serif",
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    mainCard: {
        background: 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #1D4ED8 100%)',
        border: 'none',
        boxShadow: '0 20px 35px -10px rgba(79, 70, 229, 0.35)',
    },
    mainOverlay: {
        position: 'absolute' as const,
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1\' fill=\'%23ffffff\' fill-opacity=\'0.04\'/%3E%3C/svg%3E")',
        zIndex: 1,
    },
    glowBlob: {
        position: 'absolute' as const,
        top: '-40px',
        right: '-40px',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.12)',
        filter: 'blur(25px)',
        zIndex: 1,
    },
    contentMain: {
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        justifyContent: 'space-between',
        zIndex: 2,
        position: 'relative' as const,
    },
    contentStandard: {
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        justifyContent: 'space-between',
    },
    mainHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: '0.75rem',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        width: '100%',
    },
    label: {
        fontSize: '0.82rem',
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    mainLabel: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.8)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    iconContainer: {
        width: '38px',
        height: '38px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainIconWrapper: {
        width: '38px',
        height: '38px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueRow: {
        display: 'flex',
        alignItems: 'baseline',
        marginBottom: '1.25rem',
    },
    value: {
        fontSize: '2.6rem',
        fontWeight: '700',
        fontFamily: "'Space Grotesk', sans-serif",
        lineHeight: '1',
        letterSpacing: '-0.03em',
    },
    mainValue: {
        fontSize: '2.8rem',
        fontWeight: '700',
        fontFamily: "'Space Grotesk', sans-serif",
        color: '#ffffff',
        lineHeight: '1',
        letterSpacing: '-0.02em',
        marginBottom: '1.25rem',
    },
    footer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '1rem',
        borderTop: '1px solid #F1F5F9',
        width: '100%',
    },
    statusIndicator: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
    },
    subLabel: {
        fontSize: '0.8rem',
        color: '#64748B',
        fontWeight: '500',
    },
    mainSubLabel: {
        fontSize: '0.82rem',
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '500',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        width: '100%',
    }
};

export default MetricCard;