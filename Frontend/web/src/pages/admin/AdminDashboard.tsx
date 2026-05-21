import React from 'react';
import Sidebar from '../../components/Sidebar';

const AdminDashboard: React.FC = () => {
    // Получаем актуальный отступ на основе состояния сайдбара
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    const contentMargin = isCollapsed ? '78px' : '260px';

    return (
        <div style={styles.layout}>
            <Sidebar role="Admin" />
            <main style={{ ...styles.mainContent, marginLeft: contentMargin }}>
                <header style={styles.header}>
                    <h1 style={styles.title}>Управление системой</h1>
                </header>
                <div style={styles.card}>
                    <h3>EduCRM Консоль</h3>
                    <p>Контент вашей панели администратора.</p>
                </div>
            </main>
        </div>
    );
};

const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' },
    mainContent: { flex: 1, padding: '2.5rem', transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)' },
    header: { marginBottom: '2rem' },
    title: { fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' },
    card: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }
};

export default AdminDashboard;