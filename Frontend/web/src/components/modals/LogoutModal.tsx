import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={styles.modalIconBox}>
                    <AlertTriangle size={32} color="#EF4444" />
                </div>
                <h3 style={styles.modalTitle}>Выход из системы</h3>
                <p style={styles.modalText}>Вы уверены, что хотите завершить текущую сессию?</p>
                <div style={styles.modalButtons}>
                    <button onClick={onClose} style={styles.btnCancel}>
                        Отмена
                    </button>
                    <button onClick={onConfirm} style={styles.btnConfirm}>
                        Да, выйти
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    modalOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.2)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    modalContent: {
        background: '#ffffff',
        borderRadius: 20,
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center' as const,
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
        animation: 'modalFade 0.2s ease-out',
    },
    modalIconBox: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: '#FEF2F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 18px auto',
    },
    modalTitle: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        color: '#0F172A',
        margin: '0 0 8px 0',
    },
    modalText: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '14px',
        color: '#64748B',
        margin: '0 0 24px 0',
        lineHeight: '1.5',
    },
    modalButtons: {
        display: 'flex',
        gap: 12,
    },
    btnCancel: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        background: '#ffffff',
        color: '#475569',
        fontFamily: '"Inter", sans-serif',
        fontSize: '14.5px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    btnConfirm: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        border: 'none',
        background: '#EF4444',
        color: '#ffffff',
        fontFamily: '"Inter", sans-serif',
        fontSize: '14.5px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
    }
};

export default LogoutModal;