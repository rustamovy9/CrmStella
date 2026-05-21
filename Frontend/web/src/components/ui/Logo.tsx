import React, { useState } from 'react';
// Твой оригинальный logo-light.png
import logoLight from '../../assets/logo-light.png';

interface LogoProps {
    width?: string;
    height?: string;
}

const Logo: React.FC<LogoProps> = ({ width = '280px', height = 'auto' }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            style={{ 
                ...styles.logoWrapper, 
                width,
                height,
                transform: isHovered ? 'scale(1.04) translateY(-2px)' : 'scale(1) translateY(0)',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Глубокое футуристичное неоновое свечение под логотипом */}
            <div style={{
                ...styles.neonGlow,
                opacity: isHovered ? 0.7 : 0.4,
                transform: isHovered ? 'scale(1.15)' : 'scale(1)',
            }} />

            {/* Дополнительное мягкое центральное сияние */}
            <div style={{
                ...styles.ambientLight,
                opacity: isHovered ? 0.5 : 0.2,
            }} />

            <img 
                src={logoLight} 
                alt="EduCRM" 
                style={{
                    ...styles.logoImg,
                    filter: isHovered 
                        ? 'brightness(1.2) contrast(1.05) drop-shadow(0 8px 30px rgba(56, 189, 248, 0.5))' 
                        : 'brightness(1.05) contrast(1) drop-shadow(0 4px 15px rgba(37, 99, 235, 0.3))'
                }} 
            />
        </div>
    );
};

const styles = {
    logoWrapper: {
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 24px', // Увеличили внутренние отступы для объема
        borderRadius: '16px',
        userSelect: 'none' as const,
        transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        cursor: 'pointer',
    },
    neonGlow: {
        position: 'absolute' as const,
        width: '85%',
        height: '60%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.6) 0%, rgba(37, 99, 235, 0.2) 50%, transparent 80%)',
        filter: 'blur(24px)',
        borderRadius: '40px',
        zIndex: 1,
        pointerEvents: 'none' as const,
        transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
    },
    ambientLight: {
        position: 'absolute' as const,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
        filter: 'blur(16px)',
        zIndex: 1,
        pointerEvents: 'none' as const,
        transition: 'opacity 0.4s ease',
    },
    logoImg: {
        position: 'relative' as const,
        zIndex: 2,
        width: '100%',
        height: 'auto',
        display: 'block',
        objectFit: 'contain' as const,
        // Убрали mixBlendMode: 'screen', чтобы картинка была плотной, сочной и без левых пикселей
        transition: 'filter 0.4s ease',
    }
};

export default Logo;