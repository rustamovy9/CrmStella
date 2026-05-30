import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
    role: 'Admin' | 'Mentor' | 'Student';
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ role, children }) => {
    // Считываем начальное состояние из localStorage, как и в твоем сайдбаре
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    useEffect(() => {
        const handleToggle = () => {
            const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            setIsCollapsed(collapsed);
        };

        // Слушаем кастомный ивент window.dispatchEvent(new Event('sidebar-toggle')) из твоего сайдбара
        window.addEventListener('sidebar-toggle', handleToggle);
        return () => window.removeEventListener('sidebar-toggle', handleToggle);
    }, []);

    return (
        <div style={styles.layoutContainer}>
            {/* Твой сайдбар в первозданном виде */}
            <Sidebar role={role} />

            {/* Область контента, которая плавно сдвигается */}
            <main
                style={{
                    ...styles.mainContent,
                    marginLeft: isCollapsed ? '88px' : '310px', // Четкие размеры из твоего стилей сайдбара
                }}
            >
                {children}
            </main>
        </div>
    );
};

const styles = {
    layoutContainer: {
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#F8FAFC', // Приятный фоновый цвет для страниц аналитики
    },
    mainContent: {
        flex: 1,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', // Идентичная анимация для плавности
        minWidth: 0,
    },
};

export default MainLayout;