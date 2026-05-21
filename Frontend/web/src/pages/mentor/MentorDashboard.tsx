import React from 'react';
import Sidebar from '../../components/Sidebar';

const MentorDashboard: React.FC = () => {
    return (
        <div style={styles.layout}>
            <Sidebar role="Mentor" />
            <main style={styles.mainContent}>
                <header style={styles.header}>
                    <h1 style={styles.title}>Рабочее пространство Ментора</h1>
                    <span style={styles.badge}>Преподаватель</span>
                </header>
                <div style={styles.card}>
                    <h3>Мои текущие курсы</h3>
                    <p>Выставление посещаемости, проверка домашних заданий (Phase 2) и ведение успеваемости групп.</p>
                </div>
            </main>
        </div>
    );
};

const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' },
    mainContent: { flex: 1, marginLeft: '260px', padding: '2.5rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    title: { fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: 0 },
    badge: { padding: '6px 12px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' },
    card: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }
};

export default MentorDashboard;