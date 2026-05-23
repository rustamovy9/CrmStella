import React, { useState } from 'react';
// Твой оригинальный логотип
import logoLight from '../../assets/logo-light.png';

interface LogoProps {
    width?: string;
    height?: string;
    maxWidth?: string;
}

const Logo: React.FC<LogoProps> = ({ width = '125px', height = 'auto' }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            style={{ 
                ...styles.logoWrapper, 
                width,
                height,
                background: isHovered ? '#F1F5F9' : '#FFFFFF', // Мягкая смена цвета: из чисто белого в деликатный светло-серый
                borderColor: isHovered ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                boxShadow: isHovered 
                    ? '0 4px 12px rgba(0, 0, 0, 0.05)' // Легкая естественная тень при наведении
                    : '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img 
                src={logoLight} 
                alt="EduCRM" 
                style={styles.logoImg} 
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
        padding: '5px 10px', // Ультра-компактные отступы, убрали лишний воздух
        borderRadius: '10px', // Аккуратное скругление под стать элементам админки
        border: '1px solid',
        userSelect: 'none' as const,
        transition: 'all 0.2s ease-in-out', // Быстрый и плавный отклик интерфейса
        cursor: 'pointer',
    },
    logoImg: {
        width: '100%',
        height: 'auto',
        display: 'block',
        objectFit: 'contain' as const,
    }
};

export default Logo;