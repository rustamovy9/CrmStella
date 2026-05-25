import React from 'react';
import { Construction, ArrowLeft, Lightbulb } from 'lucide-react';

const LeadsPage: React.FC = () => {
    // Функция для имитации возврата (если захочешь привязать к кнопке)
    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div style={styles.container}>
            {/* Добавляем CSS-анимацию прямо в компонент для плавной пульсации иконки */}
            <style>
                {`
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 0.9; }
                        50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 25px rgba(79, 70, 229, 0.4); }
                        100% { transform: scale(1); opacity: 0.9; }
                    }
                `}
            </style>

            <div style={styles.card}>
                {/* Иконка в красивом круге с анимацией */}
                <div style={styles.iconWrapper}>
                    <Construction size={40} color="#4F46E5" />
                </div>

                {/* Главный текст */}
                <h2 style={styles.title}>Раздел «Лиды (Заявки)» в разработке</h2>
                
                <p style={styles.subtitle}>
                    Мы активно создаем эту страницу. Здесь будет мощная воронка продаж, 
                    управление статусами потенциальных клиентов и автоматический сбор заявок.
                </p>

                {/* Информационный блок-подсказка */}
                <div style={styles.infoBox}>
                    <Lightbulb size={18} color="#4F46E5" style={{ marginRight: '10px', flexShrink: 0 }} />
                    <span style={styles.infoText}>
                        <strong>Что здесь будет?</strong> Интеграция с сайтом, распределение лидов между менеджерами и аналитика конверсий в реальном времени.
                    </span>
                </div>

                {/* Кнопка возврата на главную, чтобы юзер не потерялся */}
                <button 
                    onClick={handleGoBack} 
                    style={styles.button}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#EEF2FF';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                    Вернуться назад
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)', // Подстраивается под твою админку, чтобы не вылезать за рамки
        padding: '40px 20px',
        boxSizing: 'border-box' as const,
    },
    card: {
        background: '#ffffff',
        border: '1px solid #F1F5F9',
        borderRadius: '24px',
        padding: '48px 32px',
        maxWidth: '520px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        textAlign: 'center' as const,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 16px -6px rgba(0, 0, 0, 0.02)',
    },
    iconWrapper: {
        width: '84px',
        height: '84px',
        borderRadius: '50%',
        backgroundColor: '#EFF6FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        animation: 'pulse 3s infinite ease-in-out', // Подключаем созданную анимацию
    },
    title: {
        margin: '0 0 12px 0',
        fontSize: '22px',
        fontWeight: 700,
        color: '#0F172A',
        fontFamily: 'inherit',
    },
    subtitle: {
        margin: '0 0 28px 0',
        fontSize: '14px',
        fontWeight: 500,
        color: '#64748B',
        lineHeight: '1.6',
    },
    infoBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '14px 18px',
        marginBottom: '32px',
        textAlign: 'left' as const,
    },
    infoText: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#334155',
        lineHeight: '1.5',
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        color: '#4F46E5',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
};

export default LeadsPage;