// components/ui/PremiumMetricCard.tsx
import React from 'react';

export type PremiumCardVariant = 'indigo' | 'green' | 'amber' | 'purple' | 'blue' | 'rose';

interface PremiumMetricCardProps {
    label: string;
    value: string | number;
    subLabel?: string;
    icon?: React.ReactNode;
    variant?: PremiumCardVariant;
    isMain?: boolean; // Флаг для выделения главной карточки особым дизайном
}

export const PremiumMetricCard: React.FC<PremiumMetricCardProps> = ({
    label,
    value,
    subLabel,
    icon,
    variant = 'indigo',
    isMain = false,
}) => {
    // Конфигурация премиальных градиентов и индивидуального свечения для финтех-стиля
    const themes = {
        indigo: {
            gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            shadow: 'rgba(79, 70, 229, 0.25)',
            hoverGlow: '0 20px 35px -5px rgba(79, 70, 229, 0.5), 0 10px 15px -5px rgba(124, 58, 237, 0.3)'
        },
        green: {
            gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            shadow: 'rgba(16, 185, 129, 0.25)',
            hoverGlow: '0 20px 35px -5px rgba(16, 185, 129, 0.5), 0 10px 15px -5px rgba(5, 150, 105, 0.3)'
        },
        amber: {
            gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            shadow: 'rgba(245, 158, 11, 0.25)',
            hoverGlow: '0 20px 35px -5px rgba(245, 158, 11, 0.5), 0 10px 15px -5px rgba(217, 119, 6, 0.3)'
        },
        purple: {
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            shadow: 'rgba(139, 92, 246, 0.25)',
            hoverGlow: '0 20px 35px -5px rgba(139, 92, 246, 0.5), 0 10px 15px -5px rgba(109, 40, 217, 0.3)'
        },
        blue: {
            gradient: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
            shadow: 'rgba(14, 165, 233, 0.25)',
            hoverGlow: '0 20px 35px -5px rgba(14, 165, 233, 0.5), 0 10px 15px -5px rgba(37, 99, 235, 0.3)'
        },
        rose: {
            gradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
            shadow: 'rgba(244, 63, 94, 0.25)',
            hoverGlow: '0 20px 35px -5px rgba(244, 63, 94, 0.5), 0 10px 15px -5px rgba(225, 29, 72, 0.3)'
        },
    };

    const currentTheme = isMain 
        ? {
            gradient: 'linear-gradient(135deg, #312E81 0%, #4F46E5 100%)',
            shadow: 'rgba(49, 46, 129, 0.3)',
            hoverGlow: '0 20px 40px -5px rgba(79, 70, 229, 0.6)'
          }
        : themes[variant];

    const cardClassName = `pm-card-${variant}${isMain ? '-main' : ''}`;

    return (
        <div 
            className={`premium-analytics-card ${cardClassName}`} 
            style={{
                ...styles.cardBase,
                background: currentTheme.gradient,
                boxShadow: `0 10px 20px -5px ${currentTheme.shadow}`,
            }}
        >
            {/* Анимации и фикс видимости иконок */}
            <style>{`
                .${cardClassName} {
                    transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), 
                                box-shadow 0.35s cubic-bezier(0.25, 1, 0.5, 1);
                }
                .${cardClassName}:hover {
                    transform: translateY(-6px) scale(1.015);
                    box-shadow: ${currentTheme.hoverGlow} !important;
                }
                
                /* Стили контейнера иконки и ПРИНУДИТЕЛЬНЫЙ БЕЛЫЙ ЦВЕТ для SVG */
                .${cardClassName} .pm-icon-wrapper {
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), 
                                background-color 0.3s ease;
                }
                .${cardClassName} .pm-icon-wrapper svg {
                    stroke: #FFFFFF !important;
                    color: #FFFFFF !important;
                    fill: transparent; /* Сбрасываем лишние заливки, если они мешают */
                }
                /* Для заполненных иконок, если используются не линейные */
                .${cardClassName} .pm-icon-wrapper svg[fill*="#"] {
                    fill: #FFFFFF !important;
                }

                .${cardClassName}:hover .pm-icon-wrapper {
                    transform: scale(1.12) rotate(5deg);
                    background: rgba(255, 255, 255, 0.3) !important;
                }
            `}</style>

            {/* Верхний ряд */}
            <div style={styles.topRow}>
                <span style={styles.label}>{label.toUpperCase()}</span>
                {icon && (
                    <div className="pm-icon-wrapper" style={styles.iconWrapper}>
                        {icon}
                    </div>
                )}
            </div>

            {/* Значение */}
            <div style={styles.value}>{value}</div>

            {/* Суб-текст */}
            {subLabel && (
                <>
                    <div style={styles.divider} />
                    <div style={styles.subLabel}>{subLabel}</div>
                </>
            )}
        </div>
    );
};

// ─── СТИЛИ КОМПОНЕНТА ────────────────────────────────────────────────────
const styles = {
    cardBase: {
        borderRadius: '24px',
        padding: '26px',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '155px',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
        border: '1px solid rgba(255, 255, 255, 0.15)',
    } as React.CSSProperties,

    topRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
    } as React.CSSProperties,

    label: {
        fontSize: '12px',
        fontWeight: 700,
        color: 'rgba(255, 255, 255, 0.8)',
        letterSpacing: '0.06em',
    } as React.CSSProperties,

    iconWrapper: {
        padding: '10px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.16)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
    } as React.CSSProperties,

    value: {
        fontSize: '30px',
        fontWeight: 800,
        color: '#FFFFFF',
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
        marginBottom: '4px',
    } as React.CSSProperties,

    divider: {
        height: '1px',
        background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%)',
        margin: '14px 0 10px 0',
    } as React.CSSProperties,

    subLabel: {
        fontSize: '13px',
        fontWeight: 500,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 1.4,
    } as React.CSSProperties,
};

export default PremiumMetricCard;